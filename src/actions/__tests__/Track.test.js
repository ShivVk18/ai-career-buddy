import { describe, it, expect, vi, beforeEach } from "vitest";

let email, tasks, app;
const db = {
  user: { findUnique: vi.fn(async () => ({ id: "u1", name: "Sam" })) },
  coldEmail: {
    findFirst: vi.fn(async ({ where }) => (email && where.id === email.id && where.userId === "u1" && !email.deletedAt ? structuredClone(email) : null)),
    updateMany: vi.fn(async ({ where, data }) => {
      if (!email || where.id !== email.id || where.userId !== "u1" || (where.status && where.status !== email.status)) return { count: 0 };
      Object.assign(email, data);
      return { count: 1 };
    }),
  },
  application: {
    findFirst: vi.fn(async ({ where }) => (app && (where.id === app.id || where.jobId === app.jobId) && where.userId === "u1" ? { id: app.id } : null)),
    updateMany: vi.fn(async ({ where, data }) => (where.id === app.id && where.userId === "u1" ? (Object.assign(app, data), { count: 1 }) : { count: 0 })),
  },
  task: {
    findFirst: vi.fn(async ({ where }) => tasks.find((t) => t.userId === where.userId && t.key === where.key) ?? null),
    create: vi.fn(async ({ data }) => { const t = { id: `t${tasks.length + 1}`, ...data }; tasks.push(t); return t; }),
    updateMany: vi.fn(async ({ where, data }) => {
      const t = tasks.find((x) => x.id === where.id && x.userId === where.userId);
      if (!t) return { count: 0 };
      Object.assign(t, data);
      return { count: 1 };
    }),
  },
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "clerk_1" }) }));

const { approveAndCopy, saveWeakSpot, completeTask } = await import("../Track.js");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  email = { id: "e1", jobId: "j1", status: "draft", content: "Hi there,\n\nfollowing up.", subject: "Following up", deletedAt: null, sources: { template: "follow_up", paragraphs: [] } };
  app = { id: "a1", jobId: "j1", lastActivityAt: null };
  tasks = [];
});

describe("approveAndCopy", () => {
  it("marks the draft sent-by-user, returns the text and resets the quiet clock", async () => {
    const r = await approveAndCopy("FOLLOW_UP_DRAFT:e1");
    expect(r).toMatchObject({ success: true, text: "Hi there,\n\nfollowing up.", subject: "Following up", applicationId: "a1", alreadyApproved: false });
    expect(email.status).toBe("sent");
    expect(email.sources.sentByUser).toBe(true);
    expect(app.lastActivityAt).toBeInstanceOf(Date);
  });
  it("is idempotent", async () => {
    await approveAndCopy("FOLLOW_UP_DRAFT:e1");
    const again = await approveAndCopy("FOLLOW_UP_DRAFT:e1");
    expect(again).toMatchObject({ success: true, text: "Hi there,\n\nfollowing up.", alreadyApproved: true });
  });
  it("rejects other items, non follow-up emails and other users' rows", async () => {
    expect((await approveAndCopy("COLD_EMAIL:e1")).code).toBe("INVALID");
    expect((await approveAndCopy("FOLLOW_UP_DRAFT:zzz")).code).toBe("NOT_FOUND");
    email.sources = { template: null };
    expect((await approveAndCopy("FOLLOW_UP_DRAFT:e1")).code).toBe("NOT_FOUND");
  });
});

describe("saveWeakSpot", () => {
  it("creates a task due next Monday 09:00 and dedupes the same skill", async () => {
    const r = await saveWeakSpot({ applicationId: "a1", skill: "System design", note: "got stuck on caching", timeZone: "UTC" });
    expect(r.created).toBe(true);
    expect(r.task).toMatchObject({ title: "Practise System design", note: "got stuck on caching", applicationId: "a1" });
    const due = new Date(r.task.dueAt);
    expect(due.getUTCDay()).toBe(1);
    expect(due.getUTCHours()).toBe(9);
    expect(due.getTime()).toBeGreaterThan(Date.now());
    const again = await saveWeakSpot({ skill: "system design", timeZone: "UTC" });
    expect(again.created).toBe(false);
    expect(tasks).toHaveLength(1);
  });
  it("validates input and ownership", async () => {
    expect((await saveWeakSpot({ skill: "  " })).code).toBe("INVALID");
    expect((await saveWeakSpot({ skill: "SQL", applicationId: "nope" })).code).toBe("NOT_FOUND");
    expect(tasks).toHaveLength(0);
  });
  it("completeTask only touches your own task", async () => {
    const r = await saveWeakSpot({ skill: "SQL" });
    expect(await completeTask(r.task.taskId)).toEqual({ success: true });
    expect(tasks[0].doneAt).toBeInstanceOf(Date);
    expect((await completeTask("nope")).code).toBe("NOT_FOUND");
  });
});
