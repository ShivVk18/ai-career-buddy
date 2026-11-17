// Privacy scrubber for error monitoring (D51). Pure functions, no imports: used by the Sentry configs and
// unit-tested. Only error codes, routes and stack frames may leave the app. Never request bodies, cookies,
// headers, user objects, or fields that can hold personal text (resume, job description, answer, content,
// email, Clerk ids).

const REDACTED = "[Filtered]";
const MAX_STRING = 300;

// Keys whose value is dropped wherever they appear in extra/contexts/tags/breadcrumb data.
export const SENSITIVE_KEY =
  /resume|(^|[^a-z])jd([^a-z]|$)|jobdescription|job_description|answer|content|email|clerk|text|prompt|quote|bio$|message|cookie|authorization|token|secret|password|body|headers?$|user$/i;

const EMAIL_RE = /[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+/g;
const CLERK_ID_RE = /\b(?:user|sess|org)_[A-Za-z0-9]{8,}\b/g;

/** Redacts emails and Clerk ids inside a string and caps its length. */
export function scrubString(s) {
  const t = String(s).replace(EMAIL_RE, REDACTED).replace(CLERK_ID_RE, REDACTED);
  return t.length > MAX_STRING ? `${t.slice(0, MAX_STRING)}…` : t;
}

/** Recursively removes sensitive keys and scrubs strings. Depth-limited. */
export function scrubValue(v, depth = 0) {
  if (v === null || v === undefined) return v;
  if (typeof v === "string") return scrubString(v);
  if (typeof v !== "object") return v;
  if (depth > 6) return REDACTED;
  if (Array.isArray(v)) return v.slice(0, 50).map((x) => scrubValue(x, depth + 1));
  const out = {};
  for (const [k, val] of Object.entries(v)) {
    out[k] = SENSITIVE_KEY.test(k) ? REDACTED : scrubValue(val, depth + 1);
  }
  return out;
}

/** Path only: no query string, hash or credentials. */
export function scrubUrl(url) {
  if (typeof url !== "string") return url;
  try {
    const u = new URL(url, "http://localhost");
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? `${u.origin}${u.pathname}` : u.pathname;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

/** Sentry beforeSend. Always returns an event (never drops errors), with personal data removed. */
export function scrubEvent(event) {
  if (!event || typeof event !== "object") return event;
  const e = { ...event };

  delete e.user;
  delete e.server_name;
  delete e.modules;
  if (e.request) {
    // Method and path only. No body (data), cookies, headers, query string or env.
    e.request = { method: e.request.method, url: scrubUrl(e.request.url) };
  }
  if (e.extra) e.extra = scrubValue(e.extra);
  if (e.tags) e.tags = scrubValue(e.tags);
  if (e.contexts) {
    const c = {};
    for (const [name, val] of Object.entries(e.contexts)) {
      // Device/runtime/app contexts carry no personal text; everything else is scrubbed.
      c[name] = ["os", "runtime", "browser", "device", "app", "culture"].includes(name) ? val : scrubValue(val);
    }
    e.contexts = c;
  }
  if (typeof e.message === "string") e.message = scrubString(e.message);
  if (e.logentry) delete e.logentry;
  if (e.exception?.values) {
    e.exception = {
      ...e.exception,
      values: e.exception.values.map((x) => ({
        ...x,
        value: typeof x.value === "string" ? scrubString(x.value) : x.value,
        // Stack frames stay, but local variable values never do.
        stacktrace: x.stacktrace
          ? { ...x.stacktrace, frames: (x.stacktrace.frames || []).map((f) => { const { vars: _v, pre_context: _p, context_line: _c, post_context: _o, ...rest } = f; return rest; }) }
          : x.stacktrace,
      })),
    };
  }
  if (Array.isArray(e.breadcrumbs)) e.breadcrumbs = e.breadcrumbs.map(scrubBreadcrumb).filter(Boolean);
  else if (e.breadcrumbs?.values) e.breadcrumbs = { ...e.breadcrumbs, values: e.breadcrumbs.values.map(scrubBreadcrumb).filter(Boolean) };
  return e;
}

/** Sentry beforeBreadcrumb. Console and input breadcrumbs can hold typed text and are dropped. */
export function scrubBreadcrumb(b) {
  if (!b || typeof b !== "object") return null;
  if (b.category === "console" || b.category === "ui.input" || b.category === "ui.click") return null;
  const out = { ...b };
  if (typeof out.message === "string") out.message = scrubString(out.message);
  if (out.data) {
    const data = { ...out.data };
    if (typeof data.url === "string") data.url = scrubUrl(data.url); // before the string scrub eats the query
    if (typeof data.to === "string") data.to = scrubUrl(data.to);
    if (typeof data.from === "string") data.from = scrubUrl(data.from);
    out.data = scrubValue(data);
  }
  return out;
}

/** Shared init options (no PII, no tracing, no replay). */
export const SAFE_SENTRY_OPTIONS = {
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
};
