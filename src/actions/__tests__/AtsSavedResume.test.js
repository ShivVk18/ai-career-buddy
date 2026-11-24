import { describe, it, expect, vi, beforeEach } from "vitest";

let resume, created;
const scoreResume = vi.fn();
const db = {
  user: { findUnique: vi.fn(async () => ({ id: "u1" })), upsert: vi.fn(async () => ({ id: "u1", experience: 3 })) },
  resume: { findUnique: vi.fn(async ({ where }) => (resume && where.deletedAt === null ? resume : null)) },
  job: { findFirst: vi.fn() },
  aTSScore: { create: vi.fn(async ({ data }) => ((created = data), { id: "s1", createdAt: new Date(), ...data })), updateMany: vi.fn(), findMany: vi.fn(async () => []) },
  $executeRaw: vi.fn(),
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@/lib/session", () => ({ auth: async () => ({ userId: "clerk_1" }), currentUser: async () => ({ firstName: "A", lastName: "B", emailAddresses: [] }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/ai", () => ({ runAIStructured: vi.fn(), withAiAction: (f) => f() }));
vi.mock("@/lib/ats/score", () => ({ scoreResume: (...a) => scoreResume(...a), stripRec: (r) => r }));
vi.mock("@/lib/ai/pdf", () => ({ validateAndExtractPdf: vi.fn(async () => ({ text: "PDF TEXT" })), INVALID_FILE_MSG: "bad file" }));

const { createATSAnalysis } = await import("../ResumeParser.js");

const base = { companyName: "Acme", jobTitle: "Dev", jobDescription: "We need Go" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  created = null;
  resume = { id: "r1", summary: "Backend dev", skills: "Go, SQL", experience: [{ title: "Dev", organization: "Acme", description: "Built APIs" }], education: [], projects: [] };
  scoreResume.mockResolvedValue({
    result: { strengths: [], weaknesses: [], recommendations: [] },
    raw: { atsScore: 70, matchPercentage: 60, improvements: [], relevantSkills: [], missingSkills: [], finalSummary: "ok" },
    evidence: { requirements: [], resumeText: "x" },
  });
});

describe("createATSAnalysis with the saved resume", () => {
  it("scores the builder resume text and records resumeSource saved", async () => {
    const r = await createATSAnalysis({ ...base, useSavedResume: true });
    expect(r.success).toBe(true);
    expect(scoreResume.mock.calls[0][0].resumeText).toContain("Built APIs");
    expect(created.evidence.resumeSource).toBe("saved");
  });
  it("returns NO_RESUME when there is none, before any AI call", async () => {
    resume = null;
    const r = await createATSAnalysis({ ...base, useSavedResume: true });
    expect(r).toMatchObject({ success: false, code: "NO_RESUME" });
    expect(scoreResume).not.toHaveBeenCalled();
  });
  it("keeps the PDF path and marks it pdf", async () => {
    const r = await createATSAnalysis({ ...base, resumeBase64: "abc" });
    expect(r.success).toBe(true);
    expect(scoreResume.mock.calls[0][0].resumeText).toBe("PDF TEXT");
    expect(created.evidence.resumeSource).toBe("pdf");
  });
  it("needs a PDF or useSavedResume", async () => {
    expect((await createATSAnalysis(base)).code).toBe("INVALID_FILE");
  });
});
