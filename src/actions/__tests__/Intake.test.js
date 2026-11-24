import { describe, it, expect, vi, beforeEach } from "vitest";

const created = [];
const db = {
  user: { findUnique: vi.fn(async () => ({ id: "u1", name: "Sam" })) },
  job: {
    create: vi.fn(async ({ data }) => {
      created.push(data);
      return { id: "j1", url: data.url, company: data.company, title: data.title, location: data.location, sources: data.sources, createdAt: new Date(), application: { id: "a1", status: "SAVED" } };
    }),
  },
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "clerk_1" }) }));
const afters = [];
vi.mock("next/server", () => ({ after: (fn) => afters.push(fn), NextResponse: {} }));
const runAIStructured = vi.fn();
vi.mock("@/lib/ai", () => ({ runAIStructured: (...a) => runAIStructured(...a), withAiAction: (fn) => fn() }));
vi.mock("@/lib/jobs/runner", () => ({ advanceRun: vi.fn(async () => "done"), isStalled: () => false, resumeStalledForUser: vi.fn() }));

const { startIntake } = await import("../Intake.js");

const JOB = `Job title: Senior Engineer\nCompany: Acme\nLocation: Remote\n\nResponsibilities\n- Build things\nRequirements\n- React\n- TypeScript\nWe are hiring. Apply now. Full-time, salary and benefits included. 5 years of experience preferred.`;
beforeEach(() => {
  created.length = 0;
  afters.length = 0;
  runAIStructured.mockClear();
});

describe("startIntake", () => {
  it("sends a question to chat without storing anything or calling AI", async () => {
    const r = await startIntake({ input: "How do I answer 'tell me about yourself'?" });
    expect(r).toEqual({ kind: "question", text: "How do I answer 'tell me about yourself'?" });
    expect(created).toHaveLength(0);
    expect(runAIStructured).not.toHaveBeenCalled();
    expect(afters).toHaveLength(0);
  });

  it("pasted job text returns ids and chips at once, with the run scheduled for after the response", async () => {
    const r = await startIntake({ input: JOB });
    expect(r).toMatchObject({ kind: "job", jobId: "j1", applicationId: "a1", chips: { company: "Acme", role: "Senior Engineer", location: "Remote", requirementCount: 2 } });
    expect(r.jdText).toBeUndefined();
    expect(created[0].application.create.pipeline.run.actionId).toBeTruthy();
    expect(afters).toHaveLength(1);
  });

  it("rejects empty input", async () => {
    expect(await startIntake({ input: "   " })).toMatchObject({ code: "INVALID" });
  });
});
