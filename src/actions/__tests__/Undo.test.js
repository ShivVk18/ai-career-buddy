import { describe, it, expect, vi, beforeEach } from "vitest";

let resume, versions, paths;
const db = {
  user: { findUnique: vi.fn(async () => ({ id: "u1" })) },
  resume: {
    findUnique: vi.fn(async ({ where }) => (resume && where.userId === "u1" && (where.deletedAt !== null || !resume.deletedAt) && !(where.deletedAt === null && resume.deletedAt) ? structuredClone(resume) : null)),
    findFirst: vi.fn(async ({ where }) => (resume && where.id === resume.id && where.userId === "u1" ? { deletedAt: resume.deletedAt } : null)),
    updateMany: vi.fn(async ({ where, data }) => {
      if (!resume || where.id !== resume.id || where.userId !== "u1") return { count: 0 };
      if (where.deletedAt === null && resume.deletedAt) return { count: 0 };
      if (where.deletedAt && (!resume.deletedAt || resume.deletedAt < where.deletedAt.gte)) return { count: 0 };
      Object.assign(resume, data);
      return { count: 1 };
    }),
  },
  resumeVersion: {
    create: vi.fn(async ({ data }) => (versions.push({ id: "v" + (versions.length + 1), ...data }), versions.at(-1))),
    findFirst: vi.fn(async ({ where }) => versions.find((v) => v.id === where.id && resume && v.resumeId === resume.id) ?? null),
  },
  careerPath: {
    updateMany: vi.fn(async ({ where, data }) => {
      const p = paths.find((x) => x.id === where.id && x.userId === where.userId);
      if (!p) return { count: 0 };
      if (where.deletedAt === null && p.deletedAt) return { count: 0 };
      if (where.deletedAt && (!p.deletedAt || p.deletedAt < where.deletedAt.gte)) return { count: 0 };
      Object.assign(p, data);
      return { count: 1 };
    }),
  },
  $transaction: vi.fn(async (ops) => Promise.all(ops)),
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "clerk_1" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/ai", () => ({ runAIText: vi.fn(), runAIStructured: vi.fn(), runAI: vi.fn(), withAiAction: (f) => f() }));

const { deleteResume, restoreDeletedResume } = await import("../Resume.js");
const { deleteCareerRoadmap, restoreCareerRoadmap } = await import("../CareerRoadmap.js");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  resume = { id: "r1", userId: "u1", content: "", template: null, summary: "Hi", skills: "Go", experience: [{ id: "e1", title: "Dev" }], education: [], projects: [], deletedAt: null };
  versions = [];
  paths = [{ id: "p1", userId: "u1", deletedAt: null }];
});

describe("deleteResume / restoreDeletedResume", () => {
  it("snapshots, soft deletes and returns an undoId", async () => {
    const r = await deleteResume();
    expect(r.success).toBe(true);
    expect(r.undoId).toBe("v1");
    expect(resume.deletedAt).toBeInstanceOf(Date);
    const env = JSON.parse(versions[0].tailoredContent);
    expect(env.label).toMatch(/^Deleted resume /);
    expect(env.content.summary).toBe("Hi");
  });
  it("is a no-op when there is no live resume", async () => {
    await deleteResume();
    expect((await deleteResume()).undoId).toBeNull();
    expect(versions).toHaveLength(1);
  });
  it("restores within 7 days", async () => {
    const { undoId } = await deleteResume();
    expect(await restoreDeletedResume(undoId)).toEqual({ success: true });
    expect(resume.deletedAt).toBeNull();
  });
  it("refuses unknown ids, other kinds of version and expired deletes", async () => {
    expect((await restoreDeletedResume("")).code).toBe("INVALID");
    expect((await restoreDeletedResume("nope")).code).toBe("NOT_FOUND");
    versions.push({ id: "vx", resumeId: "r1", tailoredContent: JSON.stringify({ kind: "version", v: 1, label: "Copy" }) });
    expect((await restoreDeletedResume("vx")).code).toBe("NOT_FOUND");
    const { undoId } = await deleteResume();
    resume.deletedAt = new Date(Date.now() - 8 * 86400000);
    expect((await restoreDeletedResume(undoId)).code).toBe("NOT_FOUND");
  });
  it("does not overwrite a resume the user started afterwards", async () => {
    const { undoId } = await deleteResume();
    resume.deletedAt = null; // a new save reused the row
    expect((await restoreDeletedResume(undoId)).code).toBe("CONFLICT");
  });
});

describe("deleteCareerRoadmap / restoreCareerRoadmap", () => {
  it("soft deletes once and restores", async () => {
    expect(await deleteCareerRoadmap("p1")).toEqual({ success: true, id: "p1" });
    expect(paths[0].deletedAt).toBeInstanceOf(Date);
    expect((await deleteCareerRoadmap("p1")).code).toBe("NOT_FOUND");
    expect(await restoreCareerRoadmap("p1")).toEqual({ success: true, id: "p1" });
    expect(paths[0].deletedAt).toBeNull();
  });
  it("is owner-scoped and expires after 7 days", async () => {
    paths.push({ id: "p2", userId: "someone-else", deletedAt: null });
    expect((await deleteCareerRoadmap("p2")).code).toBe("NOT_FOUND");
    expect((await deleteCareerRoadmap("")).code).toBe("INVALID");
    await deleteCareerRoadmap("p1");
    paths[0].deletedAt = new Date(Date.now() - 8 * 86400000);
    expect((await restoreCareerRoadmap("p1")).code).toBe("NOT_FOUND");
  });
});
