import { describe, it, expect, vi, beforeEach } from "vitest";

let appRow, resumeRow, rows, notes;
const db = {
  user: { findUnique: vi.fn(async () => ({ id: "u1", name: "Sam" })) },
  application: {
    findFirst: vi.fn(async ({ where }) => {
      if (!appRow || appRow.id !== where.id || appRow.userId !== where.userId || appRow.deletedAt) return null;
      return structuredClone(appRow);
    }),
    findMany: vi.fn(async () => [structuredClone(appRow)]),
    updateMany: vi.fn(async ({ where, data }) => {
      if (!appRow || appRow.id !== where.id || appRow.userId !== where.userId) return { count: 0 };
      if (where.updatedAt && where.updatedAt.getTime() !== appRow.updatedAt.getTime()) return { count: 0 };
      appRow.pipeline = structuredClone(data.pipeline);
      appRow.updatedAt = new Date(appRow.updatedAt.getTime() + 1);
      return { count: 1 };
    }),
  },
  resume: { findUnique: vi.fn(async () => resumeRow) },
  aTSScore: { findFirst: vi.fn(async () => rows.ats[0] ?? null), create: vi.fn(async () => (rows.ats.push({ id: "ats1", atsScore: 71 }), rows.ats[0])) },
  resumeVersion: { findFirst: vi.fn(async () => rows.draft[0] ?? null) },
  coverLetter: { findFirst: vi.fn(async () => rows.letter[0] ?? null) },
  coldEmail: { findFirst: vi.fn(async () => rows.email[0] ?? null) },
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@/lib/session", () => ({ auth: async () => ({ userId: null }) }));
vi.mock("@/lib/notifications/create", () => ({ createNotification: vi.fn(async (u, n) => (notes.push({ u, ...n }), "n1")) }));

const tailorResume = vi.fn(async () => ({ draftId: "d1", matchBefore: { percent: 40 }, proposals: [{ original: "Built UI", proposed: "Built React UI" }, { original: "Led 3 devs", proposed: "Led 9 devs" }] }));
const generateCoverLetter = vi.fn(async () => (rows.letter.push({ id: "cl1" }), { id: "cl1" }));
const generateColdEmail = vi.fn(async () => (rows.email.push({ id: "ce1" }), { id: "ce1" }));
const scoreResume = vi.fn(async () => ({
  result: { strengths: [], weaknesses: [], recommendations: [] },
  raw: { atsScore: 71, matchPercentage: 60, improvements: [], relevantSkills: [], missingSkills: [], finalSummary: "ok" },
  evidence: {},
}));
vi.mock("@/actions/Resume", () => ({ tailorResume: (...a) => tailorResume(...a) }));
vi.mock("@/actions/CoverLetter", () => ({ generateCoverLetter: (...a) => generateCoverLetter(...a) }));
vi.mock("@/actions/ColdEmail", () => ({ generateColdEmail: (...a) => generateColdEmail(...a) }));
vi.mock("@/lib/ats/score", () => ({ scoreResume: (...a) => scoreResume(...a), stripRec: ({ sources, ...r }) => r }));

const { advanceRun, isStalled, runStepFor } = await import("../runner.js");
const { pipelineStatus, countRequirements } = await import("../chips.js");

const user = { id: "u1", name: "Sam" };
const JD = "Senior Engineer at Acme\nRequirements\n- React and TypeScript\n- 5 years of experience\n- Testing\nBenefits\n- Snacks";
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  rows = { ats: [], draft: [], letter: [], email: [] };
  notes = [];
  resumeRow = { summary: "Frontend developer with React and TypeScript experience building design systems for years.", skills: "React", experience: [], education: [], projects: [] };
  appRow = {
    id: "a1", userId: "u1", jobId: "j1", deletedAt: null, updatedAt: new Date(1000),
    pipeline: { v: 1, run: { actionId: "run1", capChecked: false, startedAt: new Date(0).toISOString() }, steps: {} },
    job: { id: "j1", title: "Senior Engineer", company: "Acme", jdText: JD, deletedAt: null },
  };
  for (const f of [tailorResume, generateCoverLetter, generateColdEmail, scoreResume]) f.mockClear();
});

describe("advanceRun", () => {
  it("runs all four steps once, notifies once, and a second run does nothing", async () => {
    expect(await advanceRun({ applicationId: "a1", user, authUserId: "clerk_1" })).toBe("done");
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ type: "pipeline_done", href: "/jobs/j1" });
    expect(await advanceRun({ applicationId: "a1", user, authUserId: "clerk_1" })).toBeNull();
    for (const f of [scoreResume, tailorResume, generateCoverLetter, generateColdEmail]) expect(f).toHaveBeenCalledTimes(1);
    expect(notes).toHaveLength(1);
  });

  it("resumes from saved state without redoing finished steps", async () => {
    await runStepFor({ applicationId: "a1", user, authUserId: "clerk_1" }); // CHECKER only, then "the server died"
    expect(scoreResume).toHaveBeenCalledTimes(1);
    await advanceRun({ applicationId: "a1", user, authUserId: "clerk_1" });
    expect(scoreResume).toHaveBeenCalledTimes(1);
    expect(tailorResume).toHaveBeenCalledTimes(1);
    expect(pipelineStatus(appRow).run).toBe("needs_you");
  });

  it("stops at a failed step, notifies the failure once, and retries only on request", async () => {
    generateCoverLetter.mockImplementationOnce(async () => ({ error: "nope", code: "FAILED" }));
    expect(await advanceRun({ applicationId: "a1", user, authUserId: "clerk_1" })).toBe("failed");
    expect(generateColdEmail).not.toHaveBeenCalled();
    expect(isStalled({ ...appRow, updatedAt: new Date(0) })).toBe(false); // failed runs are not auto-retried
    expect(await advanceRun({ applicationId: "a1", user, authUserId: "clerk_1" })).toBe("done"); // explicit retry
    expect(notes.map((n) => n.type)).toEqual(["pipeline_failed", "pipeline_done"]);
    expect(scoreResume).toHaveBeenCalledTimes(1);
  });

  it("reports tailor inventedCount from numberCheck", async () => {
    await advanceRun({ applicationId: "a1", user, authUserId: "clerk_1" });
    const tailor = pipelineStatus(appRow).steps[1];
    expect(tailor.id).toBe("tailor");
    expect(tailor.chips).toEqual([
      { label: "Edits", value: "2", tone: "neutral" },
      { label: "Invented", value: "1", tone: "bad" },
    ]);
  });
});

describe("isStalled / chips", () => {
  it("a started run with work left and an old updatedAt is stalled; a fresh claim is not", () => {
    expect(isStalled({ ...appRow, updatedAt: new Date(0) })).toBe(true);
    expect(isStalled({ ...appRow, updatedAt: new Date() })).toBe(false);
    expect(isStalled({ pipeline: null, updatedAt: new Date(0) })).toBe(false);
    const fresh = { ...appRow, updatedAt: new Date(0), pipeline: { ...appRow.pipeline, steps: { CHECKER: { status: "running", startedAt: new Date().toISOString() } } } };
    expect(isStalled(fresh)).toBe(false);
  });
  it("counts requirement bullets under the requirements heading", () => {
    expect(countRequirements(JD)).toBe(3);
    expect(countRequirements("no bullets here")).toBe(0);
  });
});
