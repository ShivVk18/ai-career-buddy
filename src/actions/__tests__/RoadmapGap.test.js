import { describe, it, expect, vi, beforeEach } from "vitest";

let paths, email, app;
const db = {
  user: { findUnique: vi.fn(async () => ({ id: "u1" })) },
  application: {
    findFirst: vi.fn(async ({ where }) => (app && where.id === app.id && where.userId === "u1" ? { jobId: "j1", id: "a1", job: { title: "Dev", company: "Acme" } } : null)),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
  careerPath: {
    findFirst: vi.fn(async ({ where }) => {
      const p = paths.filter((x) => x.userId === where.userId && !x.deletedAt && (!where.id || x.id === where.id) && (!where.status || x.status === where.status));
      p.sort((a, b) => b.updatedAt - a.updatedAt);
      return p[0] ? structuredClone(p[0]) : null;
    }),
    updateMany: vi.fn(async ({ where, data }) => {
      const p = paths.find((x) => x.id === where.id && x.userId === where.userId && x.updatedAt.getTime() === where.updatedAt.getTime());
      if (!p) return { count: 0 };
      Object.assign(p, data, { updatedAt: new Date(p.updatedAt.getTime() + 1) });
      return { count: 1 };
    }),
  },
  coldEmail: {
    findFirst: vi.fn(async ({ where }) => (email && where.id === email.id && where.userId === "u1" ? structuredClone(email) : null)),
    updateMany: vi.fn(async ({ where, data }) => (email && where.id === email.id && where.status === email.status ? (Object.assign(email, data), { count: 1 }) : { count: 0 })),
  },
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "clerk_1" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/ai", () => ({ runAIText: vi.fn(), runAIStructured: vi.fn(), runAI: vi.fn(), withAiAction: (f) => f() }));
vi.mock("@/lib/jobs/common", async (orig) => ({ ...(await orig()), requireUser: async () => ({ user: { id: "u1" } }) }));
vi.mock("@/actions/Resume", () => ({ restoreResumeVersion: vi.fn(), restoreDeletedResume: vi.fn() }));
vi.mock("@/actions/Applications", () => ({ setApplicationStatus: vi.fn() }));

const { addGapToRoadmap } = await import("../CareerRoadmap.js");
const { undo } = await import("../Undo.js");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  paths = [{ id: "p1", userId: "u1", status: "active", deletedAt: null, updatedAt: new Date(1000), steps: [{ id: 1, title: "Learn Go", category: "Core", completed: true }] }];
  app = { id: "a1" };
  email = { id: "e1", userId: "u1", jobId: "j1", status: "draft", sources: { template: "follow_up" } };
});

describe("addGapToRoadmap", () => {
  it("adds one Skill gap step, is idempotent per skill, and returns an undo token", async () => {
    const r = await addGapToRoadmap({ skill: "Kubernetes", applicationId: "a1" });
    expect(r).toMatchObject({ success: true, roadmapId: "p1", stepId: 2, roadmapItemId: 2, created: true });
    expect(typeof r.undoToken).toBe("string");
    expect(paths[0].steps[1]).toMatchObject({ title: "Learn Kubernetes", category: "Skill gap", completed: false });
    const again = await addGapToRoadmap({ skill: "kubernetes" });
    expect(again).toMatchObject({ success: true, created: false, stepId: 2 });
    expect(again.undoToken).toBeUndefined();
    expect(paths[0].steps).toHaveLength(2);
  });
  it("validates, checks ownership and needs a roadmap", async () => {
    expect((await addGapToRoadmap({ skill: " " })).code).toBe("INVALID");
    expect((await addGapToRoadmap({ skill: "SQL", applicationId: "other" })).code).toBe("NOT_FOUND");
    paths[0].status = "paused";
    expect((await addGapToRoadmap({ skill: "SQL" })).code).toBe("NO_ROADMAP");
  });
  it("undo removes the added step only", async () => {
    const r = await addGapToRoadmap({ skill: "Kubernetes" });
    expect(await undo(r.undoToken)).toMatchObject({ success: true, kind: "roadmap_gap" });
    expect(paths[0].steps.map((s) => s.id)).toEqual([1]);
    expect(await undo(r.undoToken)).toMatchObject({ success: true }); // idempotent
  });
  it("undo keeps a step the user has since completed", async () => {
    const r = await addGapToRoadmap({ skill: "Kubernetes" });
    paths[0].steps[1].completed = true;
    expect((await undo(r.undoToken)).code).toBe("NOT_FOUND");
    expect(paths[0].steps).toHaveLength(2);
  });
});

describe("undo of approveAndCopy", () => {
  it("followup_approve token puts the draft back", async () => {
    const { makeUndoToken } = await import("@/lib/undo");
    email.status = "sent";
    email.sources = { template: "follow_up", sentByUser: true, approvedAt: "x", prevActivityAt: null };
    expect(await undo(makeUndoToken("followup_approve", "e1"))).toMatchObject({ success: true, kind: "followup_approve" });
    expect(email.status).toBe("draft");
  });
});
