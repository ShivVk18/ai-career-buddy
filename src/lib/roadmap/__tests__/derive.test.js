import { describe, it, expect } from "vitest";
import { countGaps, gapKey, titlePhrases, matchStepToJd, deriveStepTargets, MAX_TARGETS_PER_STEP } from "../derive.js";

describe("countGaps", () => {
  it("counts once per result, groups spellings, sorts by count then name", () => {
    const rows = [
      { missingSkills: ["Docker", "docker ", "Kubernetes"] },
      { missingSkills: ["DOCKER.", "Terraform"] },
      { missingSkills: [null, 5, ""] },
    ];
    expect(countGaps(rows)).toEqual([
      { skill: "Docker", count: 2 },
      { skill: "Kubernetes", count: 1 },
      { skill: "Terraform", count: 1 },
    ]);
    expect(countGaps(null)).toEqual([]);
    expect(gapKey("  (Go)  ")).toBe("go");
  });
});

describe("step matching", () => {
  it("builds phrases from non-stopword runs", () => {
    expect(titlePhrases("Master event driven architecture patterns")).toContain("event driven architecture");
  });
  it("matches a named skill and ignores generic steps", () => {
    expect(matchStepToJd({ id: 1, title: "Learn Docker" }, "Must know Docker.")).toEqual({ jdExcerpt: "Must know Docker." });
    expect(matchStepToJd({ id: 2, title: "Learn and build skills" }, "Build team skills and learn.")).toBeNull();
    expect(matchStepToJd({ id: 3, title: "Learn Docker" }, "")).toBeNull();
  });
  it("does not match generic phrases", () => {
    for (const p of ["customer facing", "cross functional", "fast paced", "best practices"]) {
      expect(matchStepToJd({ id: 9, title: `Improve ${p} skills` }, `We value ${p} work.`), p).toBeNull();
    }
  });
  it("derives deduplicated, capped targets per step", () => {
    const docs = [
      { kind: "ats", company: "Acme", role: "Dev", jobDescription: "Docker" },
      { kind: "coldEmail", company: "acme", role: "dev", jobDescription: "Docker" },
      { kind: "ats", company: "", role: "", jobDescription: "Docker" },
      ...Array.from({ length: 10 }, (_, i) => ({ kind: "ats", company: `C${i}`, role: "R", jobDescription: "Docker" })),
    ];
    const t = deriveStepTargets([{ id: 1, title: "Learn Docker" }], docs);
    expect(t["1"]).toHaveLength(MAX_TARGETS_PER_STEP);
    expect(t["1"][0]).toMatchObject({ company: "Acme", kinds: ["ats", "coldEmail"] });
  });
});
