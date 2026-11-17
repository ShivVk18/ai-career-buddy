import { describe, it, expect } from "vitest";
import { Readable } from "node:stream";
import { fetchPublicPage, checkUrl, isBlockedIp, extractJobText, FetchGuardError, FETCH_LIMITS } from "../fetch.js";

const PUBLIC = "93.184.216.34";
const dnsTo = (map) => async (host) => {
  const v = map[host] ?? [PUBLIC];
  return v.map((address) => ({ address, family: address.includes(":") ? 6 : 4 }));
};
const page = (body, { status = 200, type = "text/html; charset=utf-8", headers = {} } = {}) => ({
  status,
  headers: { "content-type": type, ...headers },
  body: Readable.from([Buffer.from(body)]),
  destroy() {},
});
const redirect = (location, status = 302) => ({ status, headers: { location }, body: Readable.from([]), destroy() {} });
const run = (url, { lookup, request }) => fetchPublicPage(url, { lookup: lookup ?? dnsTo({}), request });
const rejection = async (p) => {
  try {
    await p;
  } catch (e) {
    return e;
  }
  throw new Error("expected a rejection");
};

describe("isBlockedIp", () => {
  it.each([
    "0.0.0.0", "10.1.2.3", "127.0.0.1", "127.9.9.9", "169.254.169.254", "169.254.0.1", "172.16.0.1", "172.31.255.255",
    "192.168.1.1", "100.64.0.1", "100.127.255.255", "198.18.0.1", "224.0.0.1", "255.255.255.255",
    "::", "::1", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "::ffff:7f00:1",
    "::ffff:a9fe:a9fe", "64:ff9b::7f00:1", "2002:7f00:1::", "2001:db8::1", "fe80::1%eth0", "not-an-ip",
  ])("blocks %s", (ip) => expect(isBlockedIp(ip)).toBe(true));

  it.each(["8.8.8.8", "93.184.216.34", "172.32.0.1", "100.128.0.1", "1.1.1.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"])(
    "allows %s",
    (ip) => expect(isBlockedIp(ip)).toBe(false)
  );
});

describe("checkUrl", () => {
  it("refuses http, credentials, odd ports, literal private IPs and internal names", () => {
    for (const u of [
      "http://example.com/job", "ftp://example.com", "https://user:pw@example.com/", "https://example.com:8443/",
      "https://127.0.0.1/", "https://[::1]/", "https://169.254.169.254/latest/meta-data/", "https://2130706433/",
      "https://0x7f.1/", "https://localhost/", "https://intranet.local/", "https://corp/", "not a url",
    ]) {
      expect(() => checkUrl(u), u).toThrow(FetchGuardError);
    }
  });
  it("accepts a normal https URL", () => {
    expect(checkUrl("https://boards.example.com/jobs/1").hostname).toBe("boards.example.com");
  });
});

describe("fetchPublicPage", () => {
  it("returns html and the final url for a public page and pins the vetted IP", async () => {
    const calls = [];
    const request = async (url, opts) => {
      calls.push(opts.ip);
      return page("<html><body>hi</body></html>");
    };
    const out = await run("https://jobs.example.com/a", { request });
    expect(out.html).toContain("hi");
    expect(out.finalUrl).toBe("https://jobs.example.com/a");
    expect(calls).toEqual([PUBLIC]);
  });

  it("refuses http without any request", async () => {
    let called = false;
    const e = await rejection(run("http://example.com/", { request: async () => ((called = true), page("x")) }));
    expect(e).toMatchObject({ code: "URL_BLOCKED", reason: "https_only" });
    expect(called).toBe(false);
  });

  it("refuses a hostname that resolves to a private, metadata or mapped address (any of its addresses)", async () => {
    for (const addr of ["10.0.0.5", "169.254.169.254", "127.0.0.1", "fd00::1", "::ffff:192.168.0.1", "100.64.1.1"]) {
      let called = false;
      const e = await rejection(
        run("https://evil.example.com/", {
          lookup: dnsTo({ "evil.example.com": [PUBLIC, addr] }),
          request: async () => ((called = true), page("x")),
        })
      );
      expect(e, addr).toMatchObject({ code: "URL_BLOCKED", reason: "private_address" });
      expect(called).toBe(false);
    }
  });

  it("refuses a redirect to a private IP (literal, by DNS, and to http)", async () => {
    const hop = (location, lookup) =>
      run("https://jobs.example.com/a", {
        lookup: lookup ?? dnsTo({}),
        request: async (url) => (url.hostname === "jobs.example.com" ? redirect(location) : page("<html>secret</html>")),
      });
    expect(await rejection(hop("https://169.254.169.254/latest/meta-data/"))).toMatchObject({ code: "URL_BLOCKED" });
    expect(await rejection(hop("https://internal.example.com/x", dnsTo({ "internal.example.com": ["10.0.0.9"] })))).toMatchObject({
      code: "URL_BLOCKED",
      reason: "private_address",
    });
    expect(await rejection(hop("http://other.example.com/"))).toMatchObject({ code: "URL_BLOCKED", reason: "https_only" });
  });

  it("follows a relative redirect, re-resolving DNS each hop, and stops after 3 redirects", async () => {
    const seen = [];
    const lookups = [];
    const ok = await run("https://a.example.com/start", {
      lookup: async (h) => (lookups.push(h), [{ address: PUBLIC, family: 4 }]),
      request: async (url) => (seen.push(url.pathname), url.pathname === "/start" ? redirect("/next") : page("<p>done</p>")),
    });
    expect(ok.finalUrl).toBe("https://a.example.com/next");
    expect(lookups).toEqual(["a.example.com", "a.example.com"]);

    let n = 0;
    const e = await rejection(run("https://a.example.com/loop", { request: async () => (n++, redirect(`/loop${n}`)) }));
    expect(e).toMatchObject({ code: "FETCH_FAILED", reason: "too_many_redirects" });
    expect(n).toBe(FETCH_LIMITS.maxRedirects + 1);
  });

  it("refuses an oversized body (declared and streamed)", async () => {
    const declared = await rejection(
      run("https://big.example.com/", { request: async () => page("x", { headers: { "content-length": String(FETCH_LIMITS.maxBytes + 1) } }) })
    );
    expect(declared).toMatchObject({ code: "FETCH_FAILED", reason: "too_large" });

    let destroyed = false;
    const chunk = Buffer.alloc(512 * 1024, 97);
    const streamed = await rejection(
      run("https://big.example.com/", {
        request: async () => ({
          status: 200,
          headers: { "content-type": "text/html" },
          body: Readable.from([chunk, chunk, chunk, chunk, chunk]),
          destroy() {
            destroyed = true;
          },
        }),
      })
    );
    expect(streamed).toMatchObject({ code: "FETCH_FAILED", reason: "too_large" });
    expect(destroyed).toBe(true);
  });

  it("refuses a non-html content type and error statuses", async () => {
    for (const type of ["application/pdf", "application/json", "image/png", ""]) {
      const e = await rejection(run("https://x.example.com/", { request: async () => page("%PDF", { type }) }));
      expect(e, type).toMatchObject({ code: "FETCH_FAILED", reason: "not_html" });
    }
    const e403 = await rejection(run("https://x.example.com/", { request: async () => page("no", { status: 403 }) }));
    expect(e403).toMatchObject({ code: "FETCH_FAILED", reason: "http_status", status: 403 });
  });

  it("times out", async () => {
    const e = await rejection(
      fetchPublicPage("https://slow.example.com/", {
        lookup: dnsTo({}),
        request: (_url, { signal }) =>
          new Promise((_res, rej) => signal.addEventListener("abort", () => rej(Object.assign(new Error("aborted"), { name: "AbortError" })))),
      })
    );
    expect(e).toMatchObject({ code: "FETCH_FAILED", reason: "timeout" });
  }, 10000);

  it("never sends cookies or credentials (the transport is given only the url and the vetted ip)", async () => {
    let opts;
    await run("https://x.example.com/", { request: async (_u, o) => ((opts = o), page("<p>x</p>")) });
    expect(Object.keys(opts).sort()).toEqual(["family", "ip", "signal"]);
  });
});

describe("extractJobText", () => {
  it("strips script and style and keeps readable lines", () => {
    const html = `<html><head><title>Senior Dev - Acme</title><style>.a{color:red}</style></head>
      <body><script>var secret=1</script><h1>Senior Dev</h1><p>Build &amp; ship things</p><ul><li>React</li><li>SQL</li></ul></body></html>`;
    const { text, usedJsonLd } = extractJobText(html);
    expect(usedJsonLd).toBe(false);
    expect(text).not.toMatch(/secret|color:red/);
    expect(text).toContain("Build & ship things");
    expect(text).toContain("- React");
  });

  it("prefers a JSON-LD JobPosting and writes labelled header lines", () => {
    const ld = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "JobPosting",
          title: "Data Engineer",
          hiringOrganization: { "@type": "Organization", name: "Globex" },
          jobLocation: { address: { addressLocality: "Berlin", addressCountry: "DE" } },
          description: "<p>Own the pipelines.</p><ul><li>Python</li></ul>",
        },
      ],
    };
    const html = `<html><body><p>cookie banner</p><script type="application/ld+json">${JSON.stringify(ld)}</script></body></html>`;
    const { text, usedJsonLd } = extractJobText(html);
    expect(usedJsonLd).toBe(true);
    expect(text.split("\n").slice(0, 3)).toEqual(["Job title: Data Engineer", "Company: Globex", "Location: Berlin, DE"]);
    expect(text).toContain("Own the pipelines.");
    expect(text).not.toContain("cookie banner");
  });
});
