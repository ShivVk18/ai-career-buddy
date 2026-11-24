import { describe, it, expect, vi, beforeEach } from "vitest";

const auth = vi.fn();
const tx = {
  user: { update: vi.fn() },
};
const db = { user: { findUnique: vi.fn() }, $transaction: vi.fn((fn) => fn(tx)) };
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@clerk/nextjs/server", () => ({ auth: () => auth(), clerkClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { updateUser } = await import("../../actions/User.js");
const good = { industry: "tech-software", experience: 5, skills: ["a", "b"], bio: "hi" };

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "clerk_1" });
  db.user.findUnique.mockResolvedValue({ id: "u1" });
  tx.user.update.mockImplementation(async ({ data }) => ({ id: "u1", ...data }));
});

describe("updateUser validation", () => {
  it("throws when signed out", async () => {
    auth.mockResolvedValue({ userId: null });
    await expect(updateUser(good)).rejects.toThrow("Unauthorized");
  });
  it.each([
    ["no industry", { ...good, industry: "" }],
    ["experience over 60", { ...good, experience: 61 }],
    ["negative experience", { ...good, experience: -1 }],
    ["non-numeric experience", { ...good, experience: "lots" }],
    ["51 skills", { ...good, skills: Array.from({ length: 51 }, (_, i) => `s${i}`) }],
    ["skill over 50 chars", { ...good, skills: ["x".repeat(51)] }],
    ["bio over 500", { ...good, bio: "x".repeat(501) }],
    ["no data", undefined],
  ])("rejects %s with INVALID and touches no database", async (_n, input) => {
    const r = await updateUser(input);
    expect(r).toMatchObject({ code: "INVALID" });
    expect(typeof r.error).toBe("string");
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });
  it("saves valid input and reports success", async () => {
    const r = await updateUser({ ...good, experience: "7" });
    expect(r.success).toBe(true);
    expect(tx.user.update.mock.calls[0][0].data).toMatchObject({ industry: "tech-software", experience: 7, skills: ["a", "b"] });
  });
  it("returns NOT_FOUND for an unknown user and FAILED on a database error", async () => {
    db.user.findUnique.mockResolvedValueOnce(null);
    expect(await updateUser(good)).toMatchObject({ code: "NOT_FOUND" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.$transaction.mockRejectedValueOnce(new Error("boom"));
    expect(await updateUser(good)).toMatchObject({ code: "FAILED" });
  });
});
