import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizePipeline, nextStep, publicPipeline, STALE_CLAIM_MS } from "@/lib/jobs/pipeline";

// ---- in-memory db ----
let appRow, resumeRow, rows;
const db = {
  user: { findUnique: vi.fn(async () => ({ id: "u1", name: "Sam" })) },
  application: {
    findFirst: vi.fn(async ({ where }) => {
      if (!appRow || appRow.id !== where.id || appRow.userId !== where.userId || appRow.deletedAt) return null;
      return structuredClone({ ...appRow, updatedAt: appRow.updatedAt });
    }),
    updateMany: vi.fn(async ({ where, data }) => {
      if (!appRow || appRow.id !== where.id || appRow.userId !== where.userId) return { count: 0 };
      if (where.updatedAt && where.updatedAt.getTime() !== appRow.updatedAt.getTime()) return { count: 0 };
      appRow.pipeline = structuredClone(data.pipeline);
      appRow.updatedAt = new Date(appRow.updatedAt.getTime() + 1);
      return { count: 1 };
    }),
  },
  resume: { findUnique: vi.fn(async () => resumeRow) },
  aTSScore: {
    findFirst: vi.fn(async () => rows.ats[0] ?? null),
    create: vi.fn(async ({ data }) => (rows.ats.push({ id: "ats1", atsScore: data.atsScore, data }), rows.ats[0])),
  },
  resumeVersion: { findFirst: vi.fn(async () => rows.draft[0] ?? null) },
  coverLetter: { findFirst: vi.fn(async () => rows.letter[0] ?? null) },
  coldEmail: { findFirst: vi.fn(async () => rows.email[0] ?? null) },
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@/lib/session", () => ({ auth: async () => ({ userId: "clerk_1" }) }));

const seen = []; // { fn, args, actionId, capCheckedBefore }
const { currentAiAction } = await import("@/lib/ai/action");
const record = (fn, args) => {
  const a = currentAiAction();
  seen.push({ fn, args, actionId: a?.actionId, capCheckedBefore: a?.capChecked });
  if (a) a.capChecked = true; // what runAI does after a passing cap check
};
const tailorResume = vi.fn(async (args) => (record("tailor", args), { draftId: "d1", matchBefore: { percent: 40 }, proposals: [{}, {}] }));
const generateCoverLetter = vi.fn(async (args) => (record("letter", args), rows.letter.push({ id: "cl1" }), { id: "cl1" }));
const generateColdEmail = vi.fn(async (args) => (record("email", args), rows.email.push({ id: "ce1" }), { id: "ce1" }));
const scoreResume = vi.fn(async () => (record("ats", {}), {
  result: { strengths: [{ text: "s" }], weaknesses: [{ text: "w" }], recommendations: [{ text: "r", x: 1 }] },
  raw: { atsScore: 71, matchPercentage: 60, improvements: [], relevantSkills: [], missingSkills: [], finalSummary: "ok" },
  evidence: { version: 1 },
}));
vi.mock("@/actions/Resume", () => ({ tailorResume: (...a) => tailorResume(...a) }));
vi.mock("@/actions/CoverLetter", () => ({ generateCoverLetter: (...a) => generateCoverLetter(...a) }));
vi.mock("@/actions/ColdEmail", () => ({ generateColdEmail: (...a) => generateColdEmail(...a) }));
vi.mock("@/lib/ats/score", () => ({ scoreResume: (...a) => scoreResume(...a), stripRec: ({ sources, ...r }) => r }));

const { runNextStep, getPipeline } = await import("../Pipeline.js");

const JD = "Senior Engineer\nRequirements\n- React and TypeScript\n- 5 years of experience\nApply now";
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  seen.length = 0;
  rows = { ats: [], draft: [], letter: [], email: [] };
  resumeRow = { summary: "Frontend developer with React and TypeScript experience building design systems for years.", skills: "React, TypeScript", experience: [], education: [], projects: [] };
  appRow = {
    id: "a1", userId: "u1", jobId: "j1", pipeline: null, deletedAt: null, updatedAt: new Date(1000),
    job: { id: "j1", title: "Senior Engineer", company: "Acme", jdText: JD, deletedAt: null },
  };
  for (const f of [tailorResume, generateCoverLetter, generateColdEmail, scoreResume]) f.mockClear();
});

describe("pipeline state helpers", () => {
  it("normalizes junk and picks the next step", () => {
    expect(normalizePipeline(null).steps.CHECKER.status).toBe("pending");
    expect(nextStep(normalizePipeline("junk"))).toEqual({ step: "CHECKER" });
    const p = normalizePipeline({ steps: { CHECKER: { status: "done" }, TAILOR: { status: "skipped" } } });
    expect(nextStep(p)).toEqual({ step: "WRITER" });
  });
  it("treats a fresh claim as busy and a stale claim as takeover", () => {
    const now = Date.now();
    const fresh = normalizePipeline({ steps: { CHECKER: { status: "running", startedAt: new Date(now - 1000).toISOString() } } });
    expect(nextStep(fresh, now)).toEqual({ busy: true, step: "CHECKER" });
    const stale = normalizePipeline({ steps: { CHECKER: { status: "running", startedAt: new Date(now - STALE_CLAIM_MS - 1).toISOString() } } });
    expect(nextStep(stale, now)).toEqual({ step: "CHECKER" });
    expect(publicPipeline({ id: "a", jobId: "j" }, stale.steps && { steps: stale.steps }, now).steps[0].status).toBe("pending");
  });
});

describe("runNextStep", () => {
  it("finishes the 4 steps once each, and further calls change nothing", async () => {
    const order = [];
    for (let i = 0; i < 4; i++) order.push((await runNextStep("a1")).ran);
    expect(order).toEqual(["CHECKER", "TAILOR", "WRITER", "CONNECTOR"]);
    const extra = await runNextStep("a1");
    expect(extra).toMatchObject({ ran: null, complete: true, completedCount: 4 });
    await runNextStep("a1");
    expect(scoreResume).toHaveBeenCalledTimes(1);
    expect(tailorResume).toHaveBeenCalledTimes(1);
    expect(generateCoverLetter).toHaveBeenCalledTimes(1);
    expect(generateColdEmail).toHaveBeenCalledTimes(1);
    const state = await getPipeline("a1");
    expect(state.steps.map((s) => s.status)).toEqual(["done", "done", "done", "done"]);
    expect(state.steps[0].ids).toEqual({ atsScoreId: "ats1" });
    expect(state.steps[1].ids).toEqual({ draftId: "d1" });
    expect(state.steps[2].ids).toEqual({ coverLetterId: "cl1" });
    expect(state.steps[3].ids).toEqual({ coldEmailId: "ce1" });
    expect(state.steps.slice(1).every((s) => s.needsYou)).toBe(true);
    expect(rows.ats).toHaveLength(1);
  });

  it("links every output to the job and never passes recipient fields", async () => {
    for (let i = 0; i < 4; i++) await runNextStep("a1");
    expect(rows.ats[0].data.jobId).toBe("j1");
    for (const fn of ["tailor", "letter", "email"]) expect(seen.find((s) => s.fn === fn).args.jobId).toBe("j1");
    const emailArgs = seen.find((s) => s.fn === "email").args;
    expect(Object.keys(emailArgs).sort()).toEqual(["companyName", "jobDescription", "jobId", "jobTitle"]);
  });

  it("shares ONE actionId across all steps and checks the cap only on the first AI call", async () => {
    for (let i = 0; i < 4; i++) await runNextStep("a1");
    const ids = new Set(seen.map((s) => s.actionId));
    expect(seen).toHaveLength(4);
    expect(ids.size).toBe(1);
    expect(appRow.pipeline.run.actionId).toBe([...ids][0]);
    expect(seen.map((s) => s.capCheckedBefore)).toEqual([false, true, true, true]);
    expect(appRow.pipeline.run.capChecked).toBe(true);
  });

  it("skips Checker and Tailor when there is no resume", async () => {
    resumeRow = null;
    tailorResume.mockResolvedValueOnce({ error: "Save your resume first", code: "NOT_FOUND" });
    for (let i = 0; i < 4; i++) await runNextStep("a1");
    const s = (await getPipeline("a1")).steps;
    expect(s.map((x) => x.status)).toEqual(["skipped", "skipped", "done", "done"]);
    expect(s[0].reason).toBe("NO_RESUME");
    expect(scoreResume).not.toHaveBeenCalled();
  });

  it("lets only one of two simultaneous callers run a step", async () => {
    const [a, b] = await Promise.all([runNextStep("a1"), runNextStep("a1")]);
    expect([a.ran, b.ran].filter(Boolean)).toEqual(["CHECKER"]);
    expect(scoreResume).toHaveBeenCalledTimes(1);
    expect([a, b].some((r) => r.busy)).toBe(true);
  });

  it("keeps a failed step failed with its code and retries only that step", async () => {
    generateCoverLetter.mockResolvedValueOnce({ error: "Daily AI limit reached. Please try again tomorrow.", code: "AI_LIMIT" });
    await runNextStep("a1");
    await runNextStep("a1");
    const bad = await runNextStep("a1");
    expect(bad).toMatchObject({ code: "AI_LIMIT", step: "WRITER", error: expect.any(String) });
    expect(bad.steps[2]).toMatchObject({ status: "failed", error: { code: "AI_LIMIT" } });
    const retry = await runNextStep("a1");
    expect(retry.ran).toBe("WRITER");
    expect(retry.error).toBeUndefined();
    expect(tailorResume).toHaveBeenCalledTimes(1);
    expect(scoreResume).toHaveBeenCalledTimes(1);
    await runNextStep("a1");
    expect(generateCoverLetter).toHaveBeenCalledTimes(2);
    expect(rows.letter).toHaveLength(1);
  });

  it("adopts an output already linked to the job after a stale claim instead of duplicating it", async () => {
    appRow.pipeline = {
      v: 1,
      run: { actionId: "run-1", capChecked: true },
      steps: {
        CHECKER: { status: "done" }, TAILOR: { status: "done" },
        WRITER: { status: "running", claimId: "old", startedAt: new Date(Date.now() - STALE_CLAIM_MS - 5000).toISOString() },
      },
    };
    rows.letter.push({ id: "cl-existing" });
    const r = await runNextStep("a1");
    expect(r.ran).toBe("WRITER");
    expect(generateCoverLetter).not.toHaveBeenCalled();
    expect(r.steps[2].ids).toEqual({ coverLetterId: "cl-existing" });
  });

  it("is owner-scoped and validates input", async () => {
    appRow.userId = "someone-else";
    expect(await runNextStep("a1")).toMatchObject({ code: "NOT_FOUND" });
    expect(await getPipeline("a1")).toMatchObject({ code: "NOT_FOUND" });
    expect(await runNextStep("")).toMatchObject({ code: "INVALID" });
    expect(await getPipeline(undefined)).toMatchObject({ code: "INVALID" });
    expect(scoreResume).not.toHaveBeenCalled();
  });

  it("refuses a deleted job", async () => {
    appRow.job.deletedAt = new Date();
    expect(await runNextStep("a1")).toMatchObject({ code: "NOT_FOUND" });
  });
});
