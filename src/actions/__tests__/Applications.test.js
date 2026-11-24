import { parseUndoToken } from "@/lib/undo";
import { describe, it, expect, vi, beforeEach } from "vitest";

let app, path, scores, madeTasks;
const db = {
  user: { findUnique: vi.fn(async () => ({ id: "u1", name: "Sam" })) },
  application: {
    findFirst: vi.fn(async ({ where }) => (app && where.id === app.id && where.userId === "u1" && !app.deletedAt ? structuredClone(app) : null)),
    updateMany: vi.fn(async ({ where, data }) => {
      if (!app || where.id !== app.id || where.userId !== "u1") return { count: 0 };
      if ("gapTasksAddedAt" in where && where.gapTasksAddedAt === null && app.gapTasksAddedAt) return { count: 0 };
      Object.assign(app, data);
      return { count: 1 };
    }),
  },
  careerPath: {
    findFirst: vi.fn(async () => structuredClone(path)),
    updateMany: vi.fn(async ({ data }) => (Object.assign(path, data), { count: 1 })),
  },
  aTSScore: { findMany: vi.fn(async () => scores) },
  task: { createMany: vi.fn(async ({ data }) => { const fresh = data.filter((d) => !madeTasks.some((t) => t.key === d.key)); madeTasks.push(...fresh); return { count: fresh.length }; }) },
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@/lib/session", () => ({ auth: async () => ({ userId: "clerk_1" }) }));
vi.mock("@/actions/Practice", () => ({ generateOpenQuestions: vi.fn() }));

const { generateOpenQuestions } = await import("@/actions/Practice");
const { setApplicationStatus, markApplied, closeApplication, approveNeedsYou, unapproveNeedsYou } = await import("../Applications.js");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  app = {
    id: "a1", userId: "u1", jobId: "j1", status: "SAVED", appliedAt: null, interviewAt: null, nextActionAt: null, followUpCount: 0,
    closedReason: null, gapTasksAddedAt: null, deletedAt: null, pipeline: { steps: { WRITER: { status: "done", needsYou: true } } },
    updatedAt: new Date(1), job: { id: "j1", title: "Dev", company: "Acme", jdText: "x" },
  };
  path = { id: "p1", steps: [{ id: 1, title: "Learn Go", completed: true }], updatedAt: new Date(1) };
  madeTasks = [];
  scores = [{ missingSkills: ["Docker", "docker", "Kafka"] }];
});

describe("application actions", () => {
  it("returns previousStatus and starts the follow-up clock", async () => {
    const r = await markApplied("a1");
    expect(r.previousStatus).toBe("SAVED");
    expect(r.application.status).toBe("APPLIED");
    expect(app.appliedAt).toBeInstanceOf(Date);
    expect(app.nextActionAt.getTime() - app.appliedAt.getTime()).toBe(5 * 86400000);
    const undo = await setApplicationStatus("a1", "SAVED");
    expect(undo.previousStatus).toBe("APPLIED");
    expect(app.appliedAt).toBeNull();
  });
  it("markApplied returns an undo token that restores the previous status, plus quiet fields", async () => {
    const r = await markApplied("a1");
    expect(r.application).toMatchObject({ status: "APPLIED", quietDays: 0, isQuiet: false });
    expect(app.lastActivityAt).toBeInstanceOf(Date);
    expect(parseUndoToken(r.undoToken)).toEqual({ kind: "status_move", id: "a1", data: { s: "SAVED", i: null } });
    const again = await markApplied("a1");
    expect(again.undoToken).toBeUndefined(); // no change, nothing to undo
  });
  it("an application applied 6 days ago is quiet", async () => {
    app.status = "APPLIED";
    app.appliedAt = new Date(Date.now() - 6 * 86400000);
    const r = await setApplicationStatus("a1", "APPLIED");
    expect(r.application).toMatchObject({ quietDays: 6, isQuiet: true });
  });
  it("rejects bad input and other users' applications", async () => {
    expect((await setApplicationStatus("a1", "WON")).code).toBe("INVALID");
    expect((await setApplicationStatus("other", "APPLIED")).code).toBe("NOT_FOUND");
  });
  it("closing adds each missing skill once as roadmap tasks", async () => {
    const r = await closeApplication("a1", "Role filled");
    expect(r.tasksAdded).toBe(2);
    expect(r.application.status).toBe("CLOSED");
    expect(path.steps.map((s) => s.title)).toEqual(["Learn Go", "Learn Docker", "Learn Kafka"]);
    const again = await closeApplication("a1", "Role filled");
    expect(again.tasksAdded).toBe(0);
    expect(path.steps).toHaveLength(3);
  });
  it("closing without a roadmap is not an error", async () => {
    path = null;
    expect((await closeApplication("a1", "")).tasksAdded).toBe(0);
  });
  it("closing also makes next-week tasks from the gaps, once, even with no roadmap", async () => {
    path = null;
    const r = await closeApplication("a1", "no reply");
    expect(r.weekTasksAdded).toBe(2);
    expect(madeTasks.map((t) => t.title)).toEqual(["Work on Docker", "Work on Kafka"]);
    expect(madeTasks[0]).toMatchObject({ source: "rejection_gap", applicationId: "a1", userId: "u1" });
    expect(madeTasks[0].dueAt.getTime()).toBeGreaterThan(Date.now());
    expect(new Date(madeTasks[0].dueAt).getDay()).toBe(1);
    expect((await closeApplication("a1", "no reply")).weekTasksAdded).toBe(0);
  });
  it("approving clears needsYou once", async () => {
    expect(await approveNeedsYou("a1", "WRITER")).toEqual({ success: true });
    expect(app.pipeline.steps.WRITER.needsYou).toBe(false);
    expect(await approveNeedsYou("a1", "WRITER")).toEqual({ success: true });
    expect((await approveNeedsYou("a1", "NOPE")).code).toBe("INVALID");
  });
  it("unapprove restores needsYou for a done step and is idempotent", async () => {
    await approveNeedsYou("a1", "WRITER");
    expect(await unapproveNeedsYou("a1", "WRITER")).toEqual({ success: true });
    expect(app.pipeline.steps.WRITER.needsYou).toBe(true);
    expect(await unapproveNeedsYou("a1", "WRITER")).toEqual({ success: true });
    expect(app.pipeline.steps.WRITER.needsYou).toBe(true);
  });
  it("unapprove does not invent a review for a step that is not done, and un-dismisses the ATS fix", async () => {
    await unapproveNeedsYou("a1", "TAILOR");
    expect(app.pipeline.steps.TAILOR?.needsYou).toBeUndefined();
    await approveNeedsYou("a1", "CHECKER");
    expect(app.pipeline.steps.CHECKER.fixDismissed).toBe(true);
    await unapproveNeedsYou("a1", "CHECKER");
    expect(app.pipeline.steps.CHECKER.fixDismissed).toBe(false);
  });
  it("unapprove validates input and ownership", async () => {
    expect((await unapproveNeedsYou("a1", "NOPE")).code).toBe("INVALID");
    expect((await unapproveNeedsYou("other", "WRITER")).code).toBe("NOT_FOUND");
  });
  it("a board move to CLOSED adds gap tasks once, like closeApplication", async () => {
    const r = await setApplicationStatus("a1", "CLOSED");
    expect(r.application.status).toBe("CLOSED");
    expect(r.previousStatus).toBe("SAVED");
    expect(r.tasksAdded).toBe(2);
    expect(path.steps).toHaveLength(3);
    // out of CLOSED and back in: nothing added twice, nothing removed
    await setApplicationStatus("a1", "APPLIED");
    expect(path.steps).toHaveLength(3);
    const again = await setApplicationStatus("a1", "CLOSED");
    expect(again.tasksAdded).toBe(0);
    expect(path.steps).toHaveLength(3);
  });
  it("closing via the board with no roadmap leaves gapTasksAddedAt unset so a later close can add them", async () => {
    const saved = path;
    path = null;
    expect((await setApplicationStatus("a1", "CLOSED")).tasksAdded).toBe(0);
    expect(app.gapTasksAddedAt).toBeNull();
    path = saved;
    expect((await setApplicationStatus("a1", "CLOSED")).tasksAdded).toBe(2);
  });
  it("a board move to INTERVIEWING with a date creates the prep session like setInterviewDate", async () => {
    generateOpenQuestions.mockResolvedValueOnce({ sessionId: "s1" });
    const r = await setApplicationStatus("a1", "INTERVIEWING", "2026-12-01");
    expect(r.application.status).toBe("INTERVIEWING");
    expect(r.prepSessionId).toBe("s1");
    expect(r.previousStatus).toBe("SAVED");
    expect(r.previousInterviewAt).toBeNull();
    expect(app.prepSessionId).toBe("s1");
    expect(app.interviewAt.toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });
  it("keeps the status and date when prep fails, and reports prepError", async () => {
    generateOpenQuestions.mockResolvedValueOnce({ error: "x", code: "AI_LIMIT" });
    const r = await setApplicationStatus("a1", "INTERVIEWING", "2026-12-01");
    expect(r.application.status).toBe("INTERVIEWING");
    expect(r.prepSessionId).toBeNull();
    expect(r.prepError).toBe("AI_LIMIT");
    expect(app.interviewAt).toBeInstanceOf(Date);
  });
  it("a board move to INTERVIEWING without a date makes no prep session", async () => {
    generateOpenQuestions.mockClear();
    const r = await setApplicationStatus("a1", "INTERVIEWING");
    expect(r.prepSessionId).toBeUndefined();
    expect(generateOpenQuestions).not.toHaveBeenCalled();
  });
  it("gap tasks skip a deleted roadmap (the query filters deletedAt)", async () => {
    await closeApplication("a1", "");
    expect(db.careerPath.findFirst.mock.calls[0][0].where.deletedAt).toBeNull();
  });
});
