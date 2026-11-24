import { describe, it, expect, vi, beforeEach } from "vitest";

// With the Auth.js session, userId IS the DB id. Actions must scope every read/write by it.
const db = {
  user: { findUnique: vi.fn(), update: vi.fn(async ({ data }) => ({ id: "x", ...data })), updateMany: vi.fn(async () => ({ count: 1 })) },
  resume: { count: vi.fn(async () => 0) },
  $transaction: vi.fn(async (fn) => (typeof fn === "function" ? fn(db) : Promise.all(fn))),
};
const auth = vi.fn();
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@/lib/session", () => ({ auth: () => auth() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { updateUser, getUserOnboardingStatus } = await import("../User.js");

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  db.user.findUnique.mockImplementation(async ({ where }) => (where.id === "userA" ? { id: "userA", industry: "Tech" } : null));
});

describe("session to DB user mapping", () => {
  it("signed out throws", async () => {
    auth.mockResolvedValue({ userId: null });
    await expect(updateUser({ industry: "x", experience: 1 })).rejects.toThrow("Unauthorized");
    await expect(getUserOnboardingStatus()).rejects.toThrow("Unauthorized");
  });
  it("updateUser writes only the session user's row", async () => {
    auth.mockResolvedValue({ userId: "userA" });
    const r = await updateUser({ industry: "Tech", experience: 2 });
    expect(r.success).toBe(true);
    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { id: "userA" } });
    expect(db.user.update.mock.calls[0][0].where).toEqual({ id: "userA" });
  });
  it("a session for a user with no row gets NOT_FOUND / Unauthorized, never someone else's data", async () => {
    auth.mockResolvedValue({ userId: "userB" });
    expect((await updateUser({ industry: "Tech", experience: 2 })).code).toBe("NOT_FOUND");
    expect(db.user.update).not.toHaveBeenCalled();
    await expect(getUserOnboardingStatus()).rejects.toThrow("Unauthorized");
  });
});
