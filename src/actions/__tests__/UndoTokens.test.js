import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeUndoToken, parseUndoToken } from "@/lib/undo";

const restoreResumeVersion = vi.fn();
const restoreDeletedResume = vi.fn();
const restoreCareerRoadmap = vi.fn();
vi.mock("@/lib/session", () => ({ auth: async () => ({ userId: "clerk_1" }) }));
vi.mock("@/actions/Resume", () => ({ restoreResumeVersion, restoreDeletedResume }));
vi.mock("@/actions/CareerRoadmap", () => ({ restoreCareerRoadmap }));
const setApplicationStatus = vi.fn();
vi.mock("@/actions/Applications", () => ({ setApplicationStatus }));

const { acceptTailoredVersion, undo } = await import("../Undo.js");

describe("undo tokens", () => {
  it("round-trips and rejects junk", () => {
    expect(parseUndoToken(makeUndoToken("resume_delete", "abc"))).toEqual({ kind: "resume_delete", id: "abc" });
    expect(parseUndoToken("nope")).toBeNull();
    expect(parseUndoToken(Buffer.from(JSON.stringify({ v: 1, k: "drop_db", id: "x" })).toString("base64url"))).toBeNull();
    expect(() => makeUndoToken("bad", "x")).toThrow();
  });
});

describe("accept then undo", () => {
  beforeEach(() => {
    restoreResumeVersion.mockReset();
    restoreDeletedResume.mockReset();
    restoreCareerRoadmap.mockReset();
  });
  it("accept returns a token that undo uses, and undo returns a redo token", async () => {
    restoreResumeVersion.mockResolvedValueOnce({ success: true, undoVersionId: "backup1" });
    const a = await acceptTailoredVersion("v9");
    expect(restoreResumeVersion).toHaveBeenCalledWith("v9");
    expect(parseUndoToken(a.undoToken)).toEqual({ kind: "resume_restore", id: "backup1" });

    restoreResumeVersion.mockResolvedValueOnce({ success: true, undoVersionId: "backup2" });
    const u = await undo(a.undoToken);
    expect(restoreResumeVersion).toHaveBeenLastCalledWith("backup1");
    expect(u.success).toBe(true);
    expect(parseUndoToken(u.redoToken)).toEqual({ kind: "resume_restore", id: "backup2" });
  });
  it("passes errors through and rejects bad tokens", async () => {
    restoreResumeVersion.mockResolvedValueOnce({ error: "x", code: "NOT_FOUND" });
    expect(await acceptTailoredVersion("v1")).toEqual({ error: "x", code: "NOT_FOUND" });
    expect((await undo("garbage")).code).toBe("INVALID");
  });
  it("dispatches delete undos", async () => {
    restoreDeletedResume.mockResolvedValueOnce({ success: true });
    restoreCareerRoadmap.mockResolvedValueOnce({ success: true, id: "p1" });
    expect((await undo(makeUndoToken("resume_delete", "v1"))).success).toBe(true);
    expect((await undo(makeUndoToken("roadmap_delete", "p1"))).success).toBe(true);
    expect(restoreCareerRoadmap).toHaveBeenCalledWith("p1");
  });
});

describe("status_move tokens", () => {
  it("carries the previous state and undo moves the application back", async () => {
    const tok = makeUndoToken("status_move", "app1", { s: "SAVED", i: null });
    expect(parseUndoToken(tok)).toEqual({ kind: "status_move", id: "app1", data: { s: "SAVED", i: null } });
    setApplicationStatus.mockResolvedValueOnce({ application: { id: "app1", status: "SAVED" }, undoToken: "redo" });
    const u = await undo(tok);
    expect(setApplicationStatus).toHaveBeenCalledWith("app1", "SAVED", null);
    expect(u).toMatchObject({ success: true, kind: "status_move", redoToken: "redo" });
  });
  it("rejects a status token without a status", async () => {
    expect((await undo(makeUndoToken("status_move", "app1"))).code).toBe("INVALID");
  });
});
