import { describe, it, expect, vi, beforeEach } from "vitest";

let row;
const resume = {
  id: "r1", content: "", template: null, photoUrl: null, contactInfo: null, summary: null, skills: null, education: [], projects: [],
  experience: [{ id: "e1", title: "Dev", organization: "Acme", description: "- Built the billing service\n- Wrote docs" }],
};
const db = {
  user: { findUnique: vi.fn(async () => ({ id: "u1" })) },
  resume: { findUnique: vi.fn(async () => resume) },
  resumeVersion: {
    findFirst: vi.fn(async ({ where }) => (row && where.id === row.id && where.resumeId === "r1" ? structuredClone(row) : null)),
    update: vi.fn(async ({ data }) => Object.assign(row, data)),
  },
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "clerk_1" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/ai", () => ({ runAIText: vi.fn(), runAIStructured: vi.fn(), withAiAction: (f) => f() }));

const { getTailorDraft, saveTailoredVersion } = await import("../Resume.js");

const proposals = [
  { proposalId: "p1", entryId: "exp:e1", bulletIndex: 0, original: "Built the billing service", proposed: "Built the billing platform", reason: "r", sources: [{ id: "jd:1", kind: "jd", label: "JD", excerpt: "billing" }] },
  { proposalId: "p2", entryId: "exp:e1", bulletIndex: 1, original: "Wrote docs", proposed: "Wrote clear docs", reason: "r", sources: [] },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  row = {
    id: "d1", resumeId: "r1", jobId: "j1", jobTitle: "Dev", companyName: "Acme", jobDescription: "We need billing and docs, 5 years",
    createdAt: new Date(), tailoredContent: JSON.stringify({ kind: "draft", v: 1, label: "x", proposals }),
  };
});

describe("getTailorDraft", () => {
  it("returns the draft in tailorResume's shape", async () => {
    const r = await getTailorDraft("d1");
    expect(r).toMatchObject({ draftId: "d1", jobId: "j1", jobTitle: "Dev", companyName: "Acme" });
    expect(r.proposals).toHaveLength(2);
    expect(r.proposals[0]).toEqual(proposals[0]);
    expect(r.matchBefore).toHaveProperty("percent");
    expect(new Date(r.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
  it("is owner-scoped and refuses unknown, saved and expired drafts", async () => {
    expect((await getTailorDraft("nope")).code).toBe("NOT_FOUND");
    expect((await getTailorDraft("")).code).toBe("INVALID");
    row.tailoredContent = JSON.stringify({ kind: "version", v: 1, label: "x", content: {} });
    expect((await getTailorDraft("d1")).code).toBe("NOT_FOUND");
    row.tailoredContent = JSON.stringify({ kind: "draft", v: 1, proposals });
    row.createdAt = new Date(Date.now() - 25 * 3600 * 1000);
    expect((await getTailorDraft("d1")).code).toBe("STALE");
  });
});

describe("saveTailoredVersion edits", () => {
  const saved = () => JSON.parse(row.tailoredContent);
  it("replaces the accepted proposal's text and marks it userEdited with no sources", async () => {
    const r = await saveTailoredVersion({ draftId: "d1", acceptedProposalIds: ["p1", "p2"], edits: { p1: "  Led the   billing service rebuild " } });
    expect(r.applied).toEqual(["p1", "p2"]);
    const v = saved();
    const a1 = v.applied.find((a) => a.proposalId === "p1");
    expect(a1).toMatchObject({ proposed: "Led the billing service rebuild", userEdited: true, sources: [] });
    expect(v.applied.find((a) => a.proposalId === "p2").userEdited).toBeUndefined();
    expect(v.content.experience[0].description).toContain("Led the billing service rebuild");
    expect(v.content.experience[0].description).toContain("Wrote clear docs");
  });
  it("rejects edits for proposals that were not accepted, unknown ids and bad lengths", async () => {
    expect((await saveTailoredVersion({ draftId: "d1", acceptedProposalIds: ["p1"], edits: { p2: "x" } })).code).toBe("INVALID");
    expect((await saveTailoredVersion({ draftId: "d1", acceptedProposalIds: ["p9"], edits: { p9: "x" } })).code).toBe("INVALID");
    expect((await saveTailoredVersion({ draftId: "d1", acceptedProposalIds: ["p1"], edits: { p1: "   " } })).code).toBe("INVALID");
    expect((await saveTailoredVersion({ draftId: "d1", acceptedProposalIds: ["p1"], edits: { p1: "a".repeat(601) } })).code).toBe("INVALID");
    expect(db.resumeVersion.update).not.toHaveBeenCalled();
  });
  it("skips an edit with an invented number but keeps the others", async () => {
    const r = await saveTailoredVersion({ draftId: "d1", acceptedProposalIds: ["p1", "p2"], edits: { p1: "Built a billing service used by 9000 users" } });
    expect(r.applied).toEqual(["p2"]);
    expect(r.skipped).toEqual([{ proposalId: "p1", reason: "FAILED_CHECK" }]);
  });
  it("skips an edit when the original bullet changed", async () => {
    resume.experience[0].description = "- Rewrote billing\n- Wrote docs";
    const r = await saveTailoredVersion({ draftId: "d1", acceptedProposalIds: ["p1", "p2"], edits: { p1: "Rebuilt billing" } });
    resume.experience[0].description = "- Built the billing service\n- Wrote docs";
    expect(r.skipped).toEqual([{ proposalId: "p1", reason: "RESUME_CHANGED" }]);
    expect(r.applied).toEqual(["p2"]);
  });
  it("works without edits as before", async () => {
    const r = await saveTailoredVersion({ draftId: "d1", acceptedProposalIds: ["p1"] });
    expect(r.applied).toEqual(["p1"]);
    expect(saved().applied[0].userEdited).toBeUndefined();
  });
});
