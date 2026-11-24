import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = { user: { findUnique: vi.fn(), update: vi.fn() }, resume: { findUnique: vi.fn(), upsert: vi.fn() } };
const db = { user: { findUnique: vi.fn() }, resume: { findUnique: vi.fn() }, $transaction: vi.fn(async (fn) => fn(tx)) };
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@/lib/jobs/common", async () => ({
  fail: (code, error) => ({ error, code }),
  requireUser: async () => ({ authUserId: "c1", user: { id: "u1" } }),
  NO_PROFILE_MSG: "x", AI_LIMIT_MSG: "x", AI_UNAVAILABLE_MSG: "x",
}));
vi.mock("@/lib/ai", () => ({ runAIStructured: vi.fn(), withAiAction: (f) => f() }));
vi.mock("@/lib/ai/pdf", () => ({ validateAndExtractPdf: vi.fn() }));
vi.mock("@/lib/profile/strength", () => ({ computeProfileStrength: async () => ({ percent: 50 }) }));

const { getProfileChips, saveProfileChips } = await import("../Onboarding.js");

const resume = {
  experience: [{ id: "e1", title: "Engineer", organization: "Acme", startDate: "2020", description: "bullets" }, { id: "e2", title: "Intern", organization: "Beta" }],
  projects: [{ id: "p1", title: "Site", description: "a site" }],
  skills: "React, SQL",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  db.user.findUnique.mockResolvedValue({ skills: ["React", "SQL"], experience: 3, industry: "Tech" });
  db.resume.findUnique.mockResolvedValue(resume);
  tx.user.findUnique.mockResolvedValue({ skills: ["React", "SQL"] });
  tx.resume.findUnique.mockResolvedValue(resume);
});

describe("getProfileChips", () => {
  it("returns roles, projects, skills and years with ids and null sources", async () => {
    const out = await getProfileChips();
    expect(out.chips.filter((c) => c.kind === "role").map((c) => [c.id, c.label, c.detail])).toEqual([["e1", "Engineer", "Acme"], ["e2", "Intern", "Beta"]]);
    expect(out.chips.find((c) => c.kind === "project")).toMatchObject({ id: "p1", label: "Site", detail: "a site" });
    expect(out.chips.filter((c) => c.kind === "skill").map((c) => c.label)).toEqual(["React", "SQL"]);
    expect(out.chips.find((c) => c.kind === "years").label).toBe("3 years");
    expect(out.chips.every((c) => c.source === null && c.id)).toBe(true);
    expect(out.years).toBe(3);
    expect(out.industry).toBe("Tech");
    expect(out.targetRole).toBeNull();
    expect(out.jobSearchStage).toBeNull();
  });
  it("returns targetRole and jobSearchStage", async () => {
    db.user.findUnique.mockResolvedValue({ skills: [], experience: null, industry: null, targetRole: "Designer", jobSearchStage: "APPLYING" });
    const out = await getProfileChips();
    expect(out.targetRole).toBe("Designer");
    expect(out.jobSearchStage).toBe("APPLYING");
  });
  it("works with no resume", async () => {
    db.resume.findUnique.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue({ skills: [], experience: null, industry: null });
    expect((await getProfileChips()).chips).toEqual([]);
  });
});

describe("saveProfileChips replace mode", () => {
  it("removes unsent skills and entries, keeps and edits sent ones, clears years", async () => {
    const out = await saveProfileChips({
      mode: "replace",
      chips: [
        { id: "e1", kind: "role", label: "Senior Engineer", detail: "Acme" },
        { id: "c_new", kind: "project", label: "New thing", detail: "d" },
        { kind: "skill", label: "React" },
      ],
    });
    expect(out.success).toBe(true);
    const u = tx.resume.upsert.mock.calls[0][0].update;
    expect(u.experience).toHaveLength(1);
    expect(u.experience[0]).toMatchObject({ id: "e1", title: "Senior Engineer", startDate: "2020", description: "bullets" });
    expect(u.projects.map((p) => p.title)).toEqual(["New thing"]);
    expect(u.skills).toBe("React");
    const d = tx.user.update.mock.calls[0][0].data;
    expect(d.skills).toEqual(["React"]);
    expect(d.experience).toBeNull();
  });
  it("merge mode (default) keeps everything", async () => {
    await saveProfileChips({ chips: [{ kind: "skill", label: "Go" }] });
    expect(tx.user.update.mock.calls[0][0].data.skills).toEqual(["React", "SQL", "Go"]);
    expect(tx.resume.upsert.mock.calls[0][0].update.experience).toHaveLength(2);
  });
});
