import { describe, it, expect } from "vitest";
import { scrubEvent, scrubBreadcrumb, scrubValue, scrubUrl, scrubString, SAFE_SENTRY_OPTIONS } from "../sentryScrub.js";

const event = {
  message: "failed for ada@example.com user_2abcDEF123456",
  user: { id: "user_2abcDEF123456", email: "ada@example.com" },
  server_name: "host",
  request: {
    method: "POST",
    url: "https://app.example.com/api/chat?token=abc#x",
    data: { message: "my resume says secret stuff" },
    cookies: { __session: "jwt" },
    headers: { authorization: "Bearer x", cookie: "a=b" },
    query_string: "token=abc",
  },
  extra: { resumeText: "SECRET RESUME", jobDescription: "JD TEXT", answer: "ANS", content: "LETTER", clerkUserId: "user_x", email: "a@b.co", code: "AI_LIMIT", nested: { userEmail: "a@b.co", ok: 1 } },
  tags: { route: "/api/chat", clerkId: "user_2abcDEF123456" },
  contexts: { runtime: { name: "node" }, custom: { text: "private", n: 1 } },
  exception: {
    values: [
      {
        type: "Error",
        value: "boom for bob@example.com",
        stacktrace: { frames: [{ filename: "a.js", lineno: 3, function: "f", vars: { resume: "SECRET" }, context_line: "const resume = 'SECRET'" }] },
      },
    ],
  },
  breadcrumbs: [
    { category: "console", message: "user typed my resume" },
    { category: "ui.input", message: "typing" },
    { category: "fetch", message: "ok", data: { url: "https://x.test/api/a?email=a@b.co", status: 200, body: "PRIVATE" } },
  ],
};

describe("scrubEvent", () => {
  const out = scrubEvent(event);
  const json = JSON.stringify(out);

  it("removes user, request body, cookies, headers and query", () => {
    expect(out.user).toBeUndefined();
    expect(out.request).toEqual({ method: "POST", url: "https://app.example.com/api/chat" });
  });
  it("keeps no personal text anywhere in the event", () => {
    for (const secret of ["SECRET RESUME", "JD TEXT", "ANS", "LETTER", "ada@example.com", "bob@example.com", "a@b.co", "user_2abcDEF123456", "PRIVATE", "private", "SECRET", "Bearer", "jwt"]) {
      expect(json, secret).not.toContain(secret);
    }
  });
  it("keeps useful non-personal data: codes, route, stack frames", () => {
    expect(out.extra.code).toBe("AI_LIMIT");
    expect(out.tags.route).toBe("/api/chat");
    expect(out.contexts.runtime).toEqual({ name: "node" });
    expect(out.exception.values[0].stacktrace.frames[0]).toEqual({ filename: "a.js", lineno: 3, function: "f" });
  });
  it("drops console and input breadcrumbs, scrubs the rest", () => {
    expect(out.breadcrumbs).toHaveLength(1);
    expect(out.breadcrumbs[0].data).toMatchObject({ status: 200, url: "https://x.test/api/a" });
    expect(out.breadcrumbs[0].data.body).toBe("[Filtered]");
  });
  it("never drops the event and tolerates junk", () => {
    expect(scrubEvent(null)).toBeNull();
    expect(scrubEvent({})).toEqual({});
  });
  it("does not mutate its input", () => {
    expect(event.user.email).toBe("ada@example.com");
  });
});

describe("message redaction", () => {
  const prisma = {
    message: "Invalid `prisma.resume.update()` invocation: data: { content: \"Led a team of 9 engineers at Acme Corp\" }",
    exception: {
      values: [
        { type: "PrismaClientValidationError", value: "Invalid `prisma.resume.update()` invocation: data: { content: \"Led a team of 9 engineers at Acme Corp\" }", stacktrace: { frames: [{ filename: "app/api/x.js", lineno: 12, colno: 4, function: "POST", vars: { a: "Acme" }, context_line: "const t = 'Acme Corp'", pre_context: ["x = 'Acme'"], post_context: ["y = 'Acme'"] }] } },
        { type: "SafeErr", value: "AI_LIMIT" },
      ],
    },
    logentry: { message: "resume says Acme Corp", params: ["Acme"] },
    extra: { note: "Acme Corp resume text here", code: "AI_LIMIT" },
    contexts: { custom: { info: "Acme Corp resume text", n: 1 } },
  };
  const out = scrubEvent(prisma);
  const json = JSON.stringify(out);
  it("removes content echoed in messages everywhere", () => {
    expect(json).not.toContain("Acme");
    expect(json).not.toContain("engineers");
    expect(out.exception.values[0].value).toBe("PrismaClientValidationError: [redacted]");
    expect(out.message).toBe("[redacted]");
    expect(out.logentry).toEqual({ message: "[redacted]" });
  });
  it("keeps a SafeErr code", () => {
    expect(out.exception.values[1].value).toBe("AI_LIMIT");
    expect(out.extra.code).toBe("AI_LIMIT");
  });
  it("keeps frame file and line but no source context", () => {
    expect(out.exception.values[0].stacktrace.frames[0]).toEqual({ filename: "app/api/x.js", lineno: 12, colno: 4, function: "POST" });
  });
});

describe("helpers", () => {
  it("filters sensitive keys case-insensitively and nested", () => {
    const v = scrubValue({ Resume: "x", JD: "x", job_description: "x", ClerkId: "x", Email: "x", safe: "yes", arr: [{ answer: "x", n: 1 }] });
    expect(v).toEqual({ Resume: "[Filtered]", JD: "[Filtered]", job_description: "[Filtered]", ClerkId: "[Filtered]", Email: "[Filtered]", safe: "yes", arr: [{ answer: "[Filtered]", n: 1 }] });
  });
  it("strips query and hash from urls", () => {
    expect(scrubUrl("/a/b?x=1#y")).toBe("/a/b");
    expect(scrubUrl("https://h.test/p?q=1")).toBe("https://h.test/p");
  });
  it("redacts emails and Clerk ids in strings and caps length", () => {
    expect(scrubString("a@b.co user_abcdefgh12")).toBe("[Filtered] [Filtered]");
    expect(scrubString("x".repeat(1000)).length).toBeLessThan(400);
  });
  it("breadcrumb scrubber rejects non-objects", () => {
    expect(scrubBreadcrumb(null)).toBeNull();
  });
  it("shared options send no PII and no traces", () => {
    expect(SAFE_SENTRY_OPTIONS).toMatchObject({ sendDefaultPii: false, tracesSampleRate: 0 });
    expect(SAFE_SENTRY_OPTIONS.beforeSend).toBe(scrubEvent);
  });
});
