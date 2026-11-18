import { describe, it, expect, vi, beforeEach } from "vitest";

let row;
const match = (where) => row && where.id === row.id && where.userId === "u1" && (where.deletedAt === null ? !row.deletedAt : true);
const db = {
  user: { findUnique: vi.fn(async () => ({ id: "u1" })) },
  coverLetter: {
    findFirst: vi.fn(async ({ where }) => (match(where) ? structuredClone(row) : null)),
    updateMany: vi.fn(async ({ where, data }) => {
      if (!match(where) && !(where.deletedAt && row?.deletedAt)) return { count: 0 };
      Object.assign(row, data);
      return { count: 1 };
    }),
  },
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "clerk_1" }) }));

const { deleteCoverLetter, restoreCoverLetter, undoLetterChange } = await import("../CoverLetter.js");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  row = { id: "l1", userId: "u1", content: "new text", deletedAt: null, sources: { tone: "warmer", paragraphs: [], previous: { content: "old text", sources: { tone: "confident", paragraphs: [{ kind: "body" }] }, at: "x" } } };
});

describe("cover letter soft delete and undo", () => {
  it("delete sets deletedAt and restore clears it", async () => {
    expect(await deleteCoverLetter("l1")).toEqual({ success: true, id: "l1" });
    expect(row.deletedAt).toBeInstanceOf(Date);
    expect((await deleteCoverLetter("l1")).code).toBe("NOT_FOUND");
    expect(await restoreCoverLetter("l1")).toEqual({ success: true, id: "l1" });
    expect(row.deletedAt).toBeNull();
  });
  it("won't restore after 7 days", async () => {
    row.deletedAt = new Date(Date.now() - 8 * 86400000);
    db.coverLetter.updateMany.mockResolvedValueOnce({ count: 0 });
    expect((await restoreCoverLetter("l1")).code).toBe("NOT_FOUND");
  });
  it("undoLetterChange swaps the previous text back and clears it", async () => {
    const r = await undoLetterChange("l1");
    expect(r.content).toBe("old text");
    expect(r.sources.previous).toBeUndefined();
    expect(r.tone).toBe("confident");
    expect((await undoLetterChange("l1")).code).toBe("NOTHING_TO_UNDO");
  });
});
