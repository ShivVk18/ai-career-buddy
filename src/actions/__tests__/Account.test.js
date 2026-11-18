import { describe, it, expect, vi, beforeEach } from "vitest";

const calls = [];
const op = (name) => vi.fn((args) => (calls.push({ name, args }), Promise.resolve({ count: 1 })));
const models = ["interviewAnswer", "quizSession", "assessment", "application", "job", "coverLetter", "coldEmail", "aTSScore", "resumeVersion", "resume", "careerPath", "careerGoal", "skillGapAnalysis", "mockInterview", "practiceSession", "aiUsage"];
const db = {
  user: { findUnique: vi.fn(), deleteMany: op("user.deleteMany"), updateMany: op("user.updateMany") },
  $transaction: vi.fn(async (ops) => Promise.all(ops)),
};
for (const m of models) db[m] = { deleteMany: op(m) };
const auth = vi.fn();
const deleteUser = vi.fn();
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@clerk/nextjs/server", () => ({ auth: () => auth(), clerkClient: async () => ({ users: { deleteUser } }) }));

const { deleteAllMyData, deleteAccount } = await import("../Account.js");

beforeEach(() => {
  calls.length = 0;
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  auth.mockResolvedValue({ userId: "clerk_1" });
  db.user.findUnique.mockResolvedValue({ id: "u1" });
  db.$transaction.mockImplementation(async (ops) => Promise.all(ops));
  deleteUser.mockResolvedValue({});
});

describe("Account deletion", () => {
  it("throws when signed out", async () => {
    auth.mockResolvedValue({ userId: null });
    await expect(deleteAllMyData({ confirmation: "DELETE MY DATA" })).rejects.toThrow("Unauthorized");
  });
  it("requires the exact phrase and touches nothing otherwise", async () => {
    for (const bad of [undefined, {}, { confirmation: "delete my data" }, { confirmation: "DELETE MY ACCOUNT" }]) {
      expect((await deleteAllMyData(bad)).code).toBe("CONFIRMATION_REQUIRED");
    }
    expect((await deleteAccount({ confirmation: "DELETE MY DATA" })).code).toBe("CONFIRMATION_REQUIRED");
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });
  it("deletes children first, only for this user, and keeps the account", async () => {
    expect(await deleteAllMyData({ confirmation: " DELETE MY DATA " })).toEqual({ success: true });
    const names = calls.map((c) => c.name);
    expect(names.indexOf("interviewAnswer")).toBeLessThan(names.indexOf("quizSession"));
    expect(names.indexOf("application")).toBeLessThan(names.indexOf("job"));
    expect(names.indexOf("resumeVersion")).toBeLessThan(names.indexOf("resume"));
    expect(names).toContain("user.updateMany");
    expect(names).not.toContain("user.deleteMany");
    for (const c of calls.filter((x) => x.name !== "resumeVersion" && x.name !== "aiUsage")) {
      expect(JSON.stringify(c.args.where)).toMatch(/"(userId|id)":"u1"/);
    }
    expect(calls.find((c) => c.name === "aiUsage").args.where.userId).toBe("clerk_1");
    expect(deleteUser).not.toHaveBeenCalled();
  });
  it("deleteAccount removes rows, then the Clerk user", async () => {
    expect(await deleteAccount({ confirmation: "DELETE MY ACCOUNT" })).toEqual({ success: true });
    expect(calls.map((c) => c.name)).toContain("user.deleteMany");
    expect(deleteUser).toHaveBeenCalledWith("clerk_1");
  });
  it("reports a Clerk failure with a clear code after the rows are gone", async () => {
    deleteUser.mockRejectedValue(new Error("boom"));
    const r = await deleteAccount({ confirmation: "DELETE MY ACCOUNT" });
    expect(r.code).toBe("CLERK_FAILED");
    expect(calls.length).toBeGreaterThan(0);
  });
  it("does not call Clerk when the database delete fails", async () => {
    db.$transaction.mockRejectedValue(new Error("db"));
    expect((await deleteAccount({ confirmation: "DELETE MY ACCOUNT" })).code).toBe("FAILED");
    expect(deleteUser).not.toHaveBeenCalled();
  });
});
