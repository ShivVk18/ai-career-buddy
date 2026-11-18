// Guarded fetch of a public job page (D56). Server only.
//
// Guards: https on port 443 only, no credentials in the URL; the hostname is resolved by us, EVERY
// address must be public, and the connection is pinned to the vetted IP (custom `lookup`), and the
// socket's remote address is verified again once connected, so a DNS rebind between our check and the
// connect cannot reach a private address. Redirects are followed by hand (max 3) and each hop goes
// through the same checks. 5 s total deadline, 2 MB streamed cap, text/html only, no cookies,
// no credentials, generic User-Agent, no compression (so the cap is on real bytes).
import dns from "node:dns";
import https from "node:https";
import net from "node:net";

export const FETCH_LIMITS = Object.freeze({ timeoutMs: 5000, maxBytes: 2 * 1024 * 1024, maxRedirects: 3 });
const USER_AGENT = "Mozilla/5.0 (compatible; JobPageReader/1.0)";

/** Thrown for every refusal. code: URL_BLOCKED | FETCH_FAILED. reason is a short machine tag. */
export class FetchGuardError extends Error {
  constructor(code, reason, status) {
    super(`${code}:${reason}`);
    this.name = "FetchGuardError";
    this.code = code;
    this.reason = reason;
    this.status = status;
  }
}
const blocked = (reason) => new FetchGuardError("URL_BLOCKED", reason);
const failed = (reason, status) => new FetchGuardError("FETCH_FAILED", reason, status);

// ---------------------------------------------------------------------------------------------
// IP classification
// ---------------------------------------------------------------------------------------------

function v4ToInt(ip) {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}

// [base, prefixLength]
const BLOCKED_V4 = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, includes the 169.254.169.254 metadata address
  ["172.16.0.0", 12],
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.88.99.0", 24], // 6to4 relay
  ["192.168.0.0", 16],
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, includes 255.255.255.255
].map(([base, bits]) => ({ base: v4ToInt(base), mask: bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0 }));

export function isBlockedIPv4(ip) {
  const n = v4ToInt(ip);
  if (n === null) return true;
  return BLOCKED_V4.some(({ base, mask }) => ((n & mask) >>> 0) === ((base & mask) >>> 0));
}

/** Expands an IPv6 string to 8 numeric groups, or null if malformed. Handles :: and a trailing dotted v4. */
function expandV6(ip) {
  let s = ip.toLowerCase();
  const zone = s.indexOf("%");
  if (zone !== -1) s = s.slice(0, zone);
  const lastColon = s.lastIndexOf(":");
  const tail = s.slice(lastColon + 1);
  if (tail.includes(".")) {
    const n = v4ToInt(tail);
    if (n === null) return null;
    s = `${s.slice(0, lastColon + 1)}${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = 8 - head.length - rest.length;
  if (halves.length === 2 ? fill < 1 : fill !== 0) return null;
  const groups = [...head, ...Array(halves.length === 2 ? fill : 0).fill("0"), ...rest].map((g) =>
    /^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN
  );
  return groups.length === 8 && groups.every((g) => Number.isInteger(g)) ? groups : null;
}

const embeddedV4 = (hi, lo) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;

export function isBlockedIPv6(ip) {
  const g = expandV6(ip);
  if (!g) return true;
  const first96Zero = g.slice(0, 6).every((x) => x === 0);
  if (first96Zero) return true; // ::, ::1 and IPv4-compatible ::a.b.c.d
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return isBlockedIPv4(embeddedV4(g[6], g[7])); // ::ffff:a.b.c.d (IPv4-mapped)
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return isBlockedIPv4(embeddedV4(g[6], g[7])); // 64:ff9b::/96 NAT64
  if (g[0] === 0x64 && g[1] === 0xff9b) return true; // 64:ff9b:1::/48 local-use NAT64
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0] & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local (deprecated)
  if ((g[0] & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentation
  if (g[0] === 0x2001 && g[1] === 0) return true; // Teredo
  if (g[0] === 0x2002) return true; // 6to4 (embeds an arbitrary IPv4)
  if (g[0] === 0x0100 && g.slice(1, 4).every((x) => x === 0)) return true; // 100::/64 discard
  return false;
}

/** True when the address must never be contacted. Anything unparseable counts as blocked. */
export function isBlockedIp(ip) {
  const s = String(ip ?? "").trim();
  const kind = net.isIP(s.includes("%") ? s.slice(0, s.indexOf("%")) : s);
  if (kind === 4) return isBlockedIPv4(s);
  if (kind === 6) return isBlockedIPv6(s);
  return true;
}

// ---------------------------------------------------------------------------------------------
// URL checks
// ---------------------------------------------------------------------------------------------

const BLOCKED_NAME = /(^|\.)(localhost|local|internal|localdomain|lan|home|corp|intranet)$/i;

/** Parses and checks the static parts of a URL. Returns a URL object or throws FetchGuardError. */
export function checkUrl(input) {
  let u;
  try {
    u = new URL(String(input ?? "").trim());
  } catch {
    throw blocked("invalid_url");
  }
  if (u.protocol !== "https:") throw blocked("https_only");
  if (u.username || u.password) throw blocked("credentials_in_url");
  if (u.port && u.port !== "443") throw blocked("port_not_allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (!host) throw blocked("invalid_url");
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw blocked("private_address");
  } else if (BLOCKED_NAME.test(host.replace(/\.$/, "")) || !host.includes(".")) {
    throw blocked("private_hostname");
  }
  return u;
}

/** Resolves a host and returns { address, family } of the first address after checking ALL of them. */
async function resolvePublic(host, lookup) {
  const bare = host.replace(/^\[|\]$/g, "");
  if (net.isIP(bare)) {
    if (isBlockedIp(bare)) throw blocked("private_address");
    return { address: bare, family: net.isIP(bare) };
  }
  let addrs;
  try {
    addrs = await lookup(bare, { all: true, verbatim: true });
  } catch {
    throw failed("dns_failed");
  }
  if (!Array.isArray(addrs) || addrs.length === 0) throw failed("dns_failed");
  if (addrs.some((a) => isBlockedIp(a.address))) throw blocked("private_address");
  return { address: addrs[0].address, family: addrs[0].family || net.isIP(addrs[0].address) };
}

// ---------------------------------------------------------------------------------------------
// One request, pinned to a vetted IP
// ---------------------------------------------------------------------------------------------

/**
 * Default transport. Resolves { status, headers, body: AsyncIterable<Buffer>, destroy() }.
 * `lookup` is overridden so the socket can only ever connect to `ip`.
 */
/** dns.lookup replacement that always answers with the vetted IP; handles (host, cb), (host, opts, cb) and { all: true }. */
export function pinnedLookup(ip, family) {
  return (_host, opts, cb) => {
    if (typeof opts === "function") cb = opts, opts = {};
    if (opts && opts.all) cb(null, [{ address: ip, family }]);
    else cb(null, ip, family);
  };
}

export function httpsRequest(url, { ip, family, signal, tls, isBlocked = isBlockedIp } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: "https:",
        host: url.hostname.replace(/^\[|\]$/g, ""),
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        servername: net.isIP(url.hostname.replace(/^\[|\]$/g, "")) ? undefined : url.hostname, // SNI + certificate check use the real name
        lookup: pinnedLookup(ip, family),
        agent: false,
        signal,
        ...(tls ?? {}), // tests only (self-signed certificate)
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml;q=0.9",
          "Accept-Encoding": "identity",
          "Accept-Language": "en",
          Connection: "close",
        },
      },
      (res) => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: res, destroy: () => res.destroy() })
    );
    req.on("socket", (socket) => {
      socket.on("connect", () => {
        // Belt and braces against rebinding: the peer we really connected to must be public.
        if (isBlocked(socket.remoteAddress)) req.destroy(blocked("private_address"));
      });
    });
    req.on("error", reject);
    req.end();
  });
}

const defaultDeps = { lookup: dns.promises.lookup.bind(dns.promises), request: httpsRequest };

const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

/**
 * Fetches a public https page. Returns { html, finalUrl } or throws FetchGuardError
 * (URL_BLOCKED: refused by the guard; FETCH_FAILED: dns_failed | timeout | too_many_redirects |
 * bad_redirect | too_large | not_html | http_status (err.status) | network).
 * `deps` ({ lookup, request }) exists for tests only.
 */
export async function fetchPublicPage(rawUrl, deps = {}) {
  const { lookup, request } = { ...defaultDeps, ...deps };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_LIMITS.timeoutMs);
  try {
    let url = checkUrl(rawUrl);
    for (let hop = 0; ; hop++) {
      const { address, family } = await resolvePublic(url.hostname, lookup);
      let res;
      try {
        res = await request(url, { ip: address, family, signal: ctrl.signal });
      } catch (e) {
        if (e instanceof FetchGuardError) throw e;
        if (ctrl.signal.aborted) throw failed("timeout");
        throw failed("network");
      }
      try {
        if (REDIRECT_CODES.has(res.status)) {
          res.destroy?.();
          const loc = res.headers?.location;
          if (!loc) throw failed("bad_redirect");
          if (hop >= FETCH_LIMITS.maxRedirects) throw failed("too_many_redirects");
          let next;
          try {
            next = new URL(String(loc), url);
          } catch {
            throw failed("bad_redirect");
          }
          url = checkUrl(next.toString()); // https/credentials/port/literal-IP checks, then DNS again at the top of the loop
          continue;
        }
        if (res.status < 200 || res.status >= 300) {
          res.destroy?.();
          throw failed("http_status", res.status);
        }
        const type = String(res.headers?.["content-type"] ?? "").toLowerCase();
        if (!/^text\/html\b/.test(type)) {
          res.destroy?.();
          throw failed("not_html");
        }
        const declared = Number(res.headers?.["content-length"]);
        if (Number.isFinite(declared) && declared > FETCH_LIMITS.maxBytes) {
          res.destroy?.();
          throw failed("too_large");
        }
        const chunks = [];
        let total = 0;
        try {
          for await (const chunk of res.body) {
            total += chunk.length;
            if (total > FETCH_LIMITS.maxBytes) {
              res.destroy?.();
              throw failed("too_large");
            }
            chunks.push(chunk);
          }
        } catch (e) {
          if (e instanceof FetchGuardError) throw e;
          if (ctrl.signal.aborted) throw failed("timeout");
          throw failed("network");
        }
        return { html: Buffer.concat(chunks).toString("utf8"), finalUrl: url.toString() };
      } catch (e) {
        res.destroy?.();
        throw e;
      }
    }
  } catch (e) {
    if (e instanceof FetchGuardError) throw e;
    if (ctrl.signal.aborted) throw failed("timeout");
    throw failed("network");
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------------------------

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "-", mdash: "-", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', hellip: "...", bull: "-", middot: "-", copy: "(c)" };

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const cp = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isInteger(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : " ";
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

/** HTML fragment to readable text, one block per line. Script, style and similar are removed. */
export function htmlToText(html) {
  let s = String(html ?? "");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<(script|style|noscript|template|svg|iframe|head|nav|footer)\b[\s\S]*?<\/\1\s*>/gi, " ");
  s = s.replace(/<li\b[^>]*>/gi, "\n- ");
  s = s.replace(/<\/?(p|div|br|h[1-6]|ul|ol|li|tr|section|article|header|main|table|blockquote|dd|dt)\b[^>]*>/gi, "\n");
  s = s.replace(/<[^>]*>/g, " ");
  s = decodeEntities(s);
  return s
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const str = (v) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

function findJobPosting(node, depth = 0) {
  if (!node || typeof node !== "object" || depth > 6) return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const f = findJobPosting(n, depth + 1);
      if (f) return f;
    }
    return null;
  }
  const types = asArray(node["@type"]).map((t) => String(t).toLowerCase());
  if (types.includes("jobposting")) return node;
  return findJobPosting(node["@graph"], depth + 1);
}

function locationOf(job) {
  const parts = [];
  for (const loc of asArray(job.jobLocation)) {
    const a = loc?.address;
    if (typeof a === "string") parts.push(str(a));
    else if (a) parts.push([a.addressLocality, a.addressRegion, a.addressCountry?.name ?? a.addressCountry].map(str).filter(Boolean).join(", "));
  }
  if (!parts.filter(Boolean).length && String(job.jobLocationType ?? "").toUpperCase() === "TELECOMMUTE") parts.push("Remote");
  return parts.filter(Boolean).join(" / ");
}

/**
 * Readable text of a job page. Prefers a schema.org JobPosting in a JSON-LD block (its title, company,
 * location and description become the first lines). Returns { text, usedJsonLd }.
 */
export function extractJobText(html, maxChars = 20000) {
  const src = String(html ?? "");
  const blocks = [...src.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script\s*>/gi)];
  for (const [, raw] of blocks) {
    let data;
    try {
      data = JSON.parse(decodeEntities(raw.trim()));
    } catch {
      continue;
    }
    const job = findJobPosting(data);
    if (!job) continue;
    const description = htmlToText(typeof job.description === "string" ? decodeEntities(job.description) : "");
    const title = str(job.title);
    const company = str(job.hiringOrganization?.name ?? job.hiringOrganization);
    const location = locationOf(job);
    if (!description && !title) continue;
    const head = [title && `Job title: ${title}`, company && `Company: ${company}`, location && `Location: ${location}`].filter(Boolean);
    return { text: [...head, description].filter(Boolean).join("\n").slice(0, maxChars), usedJsonLd: true };
  }
  const body = src.match(/<body\b[\s\S]*<\/body\s*>/i)?.[0] ?? src;
  const title = decodeEntities(src.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
  const text = htmlToText(body);
  return { text: (title && !text.includes(title) ? `${title}\n${text}` : text).slice(0, maxChars), usedJsonLd: false };
}
