import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// In-memory stand-in for the few Prisma calls the auth actions use.
let users, tokens, seq;
const match = (row, where) =>
  Object.entries(where).every(([k, v]) => {
    if (v && typeof v === "object" && !(v instanceof Date)) {
      if ("gt" in v) return row[k] > v.gt;
      return false;
    }
    return row[k] === v;
  });
const db = {
  user: {
    findUnique: vi.fn(async ({ where }) => users.find((u) => match(u, where)) ?? null),
    create: vi.fn(async ({ data }) => {
      if (users.some((u) => u.email === data.email)) throw Object.assign(new Error("dup"), { code: "P2002" });
      const u = { id: `u${++seq}`, clerkUserId: null, passwordHash: null, ...data };
      users.push(u);
      return u;
    }),
    update: vi.fn(async ({ where, data }) => Object.assign(users.find((u) => u.id === where.id), data)),
  },
  passwordResetToken: {
    create: vi.fn(async ({ data }) => (tokens.push({ id: `t${++seq}`, usedAt: null, ...data }), data)),
    findUnique: vi.fn(async ({ where }) => tokens.find((t) => t.tokenHash === where.tokenHash) ?? null),
    updateMany: vi.fn(async ({ where, data }) => {
      const hit = tokens.filter((t) => match(t, where));
      hit.forEach((t) => Object.assign(t, data));
      return { count: hit.length };
    }),
  },
  $transaction: vi.fn(async (fn) => fn(db)),
};
const sent = [];
const allow = vi.fn(async () => true);
const signIn = vi.fn();
class AuthError extends Error {}
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("next-auth", () => ({ AuthError, default: vi.fn(() => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() })) }));
vi.mock("next-auth/providers/credentials", () => ({ default: vi.fn((c) => c) }));
vi.mock("@/auth", () => ({ signIn: (...a) => signIn(...a), signOut: vi.fn() }));
vi.mock("@/lib/auth/rateLimit", () => ({ allow: (...a) => allow(...a), clientIp: async () => "1.2.3.4", ipFromHeaders: () => "1.2.3.4" }));
vi.mock("@/lib/auth/email", () => ({ emailReady: () => true, sendPasswordResetEmail: async (to, token) => void sent.push({ to, token }) }));
vi.mock("next/server", () => ({ after: () => { throw new Error("outside request scope"); } }));

const { signUp, requestPasswordReset, resetPassword, signInWithPassword } = await import("../Auth.js");
const { hashPassword, verifyPassword } = await import("@/lib/auth/password");
const { hashToken, RESET_TTL_MS } = await import("@/lib/auth/tokens");
const { authorizeCredentials } = await vi.importActual("@/auth");

beforeEach(() => {
  users = [];
  tokens = [];
  sent.length = 0;
  seq = 0;
  vi.spyOn(console, "error").mockImplementation(() => {});
  allow.mockResolvedValue(true);
});
afterEach(() => vi.useRealTimers());

const T = 30_000;

describe("signUp", () => {
  it("creates a user with a hashed password (lowercased email) and sends nothing", async () => {
    const r = await signUp({ name: "Sam", email: "  Sam@Example.COM ", password: "correct horse" });
    expect(r.success).toBe(true);
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("sam@example.com");
    expect(users[0].passwordHash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse", users[0].passwordHash)).toBe(true);
    expect(sent).toHaveLength(0);
  }, T);

  it("duplicate email: does not attach, same response, emails a set-password link", async () => {
    const fresh = await signUp({ email: "new@example.com", password: "password-one" });
    users.push({ id: "old", email: "old@example.com", clerkUserId: "user_clerk123", passwordHash: null });
    const dup = await signUp({ email: "OLD@example.com", password: "attacker-pass" });
    expect(dup).toEqual(fresh);
    expect(users.find((u) => u.id === "old").passwordHash).toBeNull();
    expect(users).toHaveLength(2); // no new row either
    expect(sent).toEqual([{ to: "old@example.com", token: expect.any(String) }]);
    expect(tokens[0].userId).toBe("old");
  }, T);

  it("validates input and rate limits", async () => {
    expect((await signUp({ email: "nope", password: "password-one" })).code).toBe("INVALID");
    expect((await signUp({ email: "a@b.co", password: "short" })).code).toBe("INVALID");
    expect((await signUp({ email: "a@b.co", password: "x".repeat(73) })).code).toBe("INVALID");
    allow.mockResolvedValue(false);
    expect((await signUp({ email: "a@b.co", password: "password-one" })).code).toBe("RATE_LIMITED");
    expect(users).toHaveLength(0);
  }, T);
});

describe("signInWithPassword", () => {
  it("returns success, and a generic error for bad credentials", async () => {
    signIn.mockResolvedValueOnce("/");
    expect(await signInWithPassword({ email: "a@b.co", password: "pw" })).toEqual({ success: true });
    signIn.mockRejectedValueOnce(new AuthError("CredentialsSignin"));
    expect((await signInWithPassword({ email: "a@b.co", password: "pw" })).code).toBe("INVALID_CREDENTIALS");
  });
});

describe("authorizeCredentials", () => {
  it("accepts the right password; same null for wrong password, unknown email, no password set, and rate limit", async () => {
    users.push({ id: "u9", email: "me@example.com", name: "Me", passwordHash: await hashPassword("right-password") });
    users.push({ id: "u8", email: "claim@example.com", name: "C", passwordHash: null });
    expect(await authorizeCredentials({ email: "ME@example.com", password: "right-password" })).toEqual({ id: "u9", email: "me@example.com", name: "Me" });
    expect(await authorizeCredentials({ email: "me@example.com", password: "wrong" })).toBeNull();
    expect(await authorizeCredentials({ email: "nobody@example.com", password: "x" })).toBeNull();
    expect(await authorizeCredentials({ email: "claim@example.com", password: "x" })).toBeNull();
    allow.mockResolvedValue(false);
    expect(await authorizeCredentials({ email: "me@example.com", password: "right-password" })).toBeNull();
  }, T);
});

describe("password reset", () => {
  const issue = async (email) => {
    await requestPasswordReset({ email });
    return sent.at(-1)?.token;
  };

  it("same response for unknown and known email; unknown sends nothing", async () => {
    users.push({ id: "u1", email: "me@example.com", passwordHash: null });
    const a = await requestPasswordReset({ email: "nobody@example.com" });
    const b = await requestPasswordReset({ email: "me@example.com" });
    expect(a).toEqual(b);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("me@example.com");
  }, T);

  it("stores only a hash, 30 minute expiry", async () => {
    users.push({ id: "u1", email: "me@example.com", passwordHash: null });
    const token = await issue("me@example.com");
    expect(tokens[0].tokenHash).toBe(hashToken(token));
    expect(JSON.stringify(tokens)).not.toContain(token);
    expect(tokens[0].expiresAt.getTime() - Date.now()).toBeGreaterThan(RESET_TTL_MS - 5000);
    expect(tokens[0].expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(RESET_TTL_MS);
  }, T);

  it("is single use", async () => {
    users.push({ id: "u1", email: "me@example.com", passwordHash: null });
    const token = await issue("me@example.com");
    expect((await resetPassword({ token, password: "brand-new-pass" })).success).toBe(true);
    expect((await resetPassword({ token, password: "another-pass-1" })).code).toBe("INVALID_TOKEN");
    expect(await verifyPassword("brand-new-pass", users[0].passwordHash)).toBe(true);
  }, T);

  it("a new request invalidates the previous token", async () => {
    users.push({ id: "u1", email: "me@example.com", passwordHash: null });
    const first = await issue("me@example.com");
    const second = await issue("me@example.com");
    expect((await resetPassword({ token: first, password: "brand-new-pass" })).code).toBe("INVALID_TOKEN");
    expect((await resetPassword({ token: second, password: "brand-new-pass" })).success).toBe(true);
  }, T);

  it("expires after 30 minutes", async () => {
    users.push({ id: "u1", email: "me@example.com", passwordHash: null });
    const token = await issue("me@example.com");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + RESET_TTL_MS + 1000);
    expect((await resetPassword({ token, password: "brand-new-pass" })).code).toBe("INVALID_TOKEN");
    expect(users[0].passwordHash).toBeNull();
  }, T);

  it("rejects unknown tokens and weak passwords", async () => {
    expect((await resetPassword({ token: "x".repeat(43), password: "brand-new-pass" })).code).toBe("INVALID_TOKEN");
    expect((await resetPassword({ token: "x".repeat(43), password: "short" })).code).toBe("INVALID");
  }, T);

  it("claim flow: an existing (Clerk-era) user keeps the same row and data, and can then sign in", async () => {
    users.push({ id: "legacy", email: "old@example.com", clerkUserId: "user_clerk123", passwordHash: null, industry: "Software" });
    // sign-up with the same email must not claim it
    await signUp({ email: "old@example.com", password: "attacker-pass" });
    expect(users[0].passwordHash).toBeNull();
    const token = sent.at(-1).token;
    expect((await resetPassword({ token, password: "my-real-password" })).success).toBe(true);
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ id: "legacy", clerkUserId: "user_clerk123", industry: "Software" });
    expect(await verifyPassword("my-real-password", users[0].passwordHash)).toBe(true);
  }, T);
});
