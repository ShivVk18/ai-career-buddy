import { describe, it, expect, vi } from "vitest";

let prompt = "";
const db = {
  user: { findUnique: vi.fn(async () => ({ id: "u1", skills: ["React"] })) },
  resume: { findUnique: vi.fn(async () => ({ deletedAt: null, projects: [{ id: "p1", title: "Budget tracker", organization: "Personal project", description: "Charts for spending." }] })) },
  quizSession: { create: vi.fn(async () => ({ id: "s1" })) },
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "clerk_1" }) }));
vi.mock("@/lib/interview/prune", () => ({ pruneOldSessions: vi.fn(async () => {}) }));
vi.mock("@/lib/ai", () => ({
  withAiAction: (fn) => fn(),
  runAIStructured: vi.fn(async (_t, _s, build) => {
    prompt = build()[0][1];
    return { questions: [{ question: "Tell me about the Budget tracker you built.", topic: "Projects", timeLimitSec: 120, sourceIds: ["proj:p1"] }] };
  }),
}));

const { generateOpenQuestions } = await import("../Practice.js");

describe("generateOpenQuestions with projects", () => {
  it("offers the user's resume projects as a source and keeps a project question", async () => {
    const r = await generateOpenQuestions({ count: 3, jobDescription: "Build React dashboards." });
    expect(prompt).toContain("[proj:p1]");
    expect(r.questions[0].sources[0].id).toBe("proj:p1");
  });
});

describe("linked application", () => {
  it("returns the application of the prep session, or null", async () => {
    db.application = { findFirst: vi.fn(async () => ({ id: "app1", interviewAt: new Date("2026-02-01T10:00:00Z"), job: { company: "Zerodha", title: "Dev" } })) };
    let r = await generateOpenQuestions({ count: 3, jobDescription: "Build React dashboards." });
    expect(r.application).toEqual({ id: "app1", company: "Zerodha", title: "Dev", interviewAt: "2026-02-01T10:00:00.000Z" });
    db.application.findFirst.mockResolvedValueOnce(null);
    r = await generateOpenQuestions({ count: 3, jobDescription: "Build React dashboards." });
    expect(r.application).toBeNull();
  });
});
