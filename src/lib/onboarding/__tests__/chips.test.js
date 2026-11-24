import { describe, it, expect } from "vitest";
import { verifyChips } from "../chips.js";

const TEXT = `Jane Doe
Senior Frontend Developer, Acme Corp 2019-2023
Built dashboards with React and TypeScript. 5 years of experience in web development.
Projects: Pocket Budget - a budgeting app`;

describe("verifyChips", () => {
  it("keeps verified chips and drops invented ones", () => {
    const out = verifyChips(
      {
        chips: [
          { kind: "role", label: "Senior Frontend Developer", detail: "Acme Corp", quote: "Senior Frontend Developer, Acme Corp 2019-2023" },
          { kind: "role", label: "CTO", detail: "Globex", quote: "CTO at Globex" },
          { kind: "skill", label: "React", quote: "dashboards with React and TypeScript" },
          { kind: "skill", label: "Kubernetes", quote: "Kubernetes" },
          { kind: "skill", label: "Go", quote: "Go" },
          { kind: "project", label: "Pocket Budget", detail: "invented blurb", quote: "Pocket Budget - a budgeting app" },
        ],
        years: { value: 5, quote: "5 years of experience" },
        suggestedTargetRole: { value: "Senior Frontend Developer", quote: "Senior Frontend Developer" },
        suggestedIndustry: { value: "Web", quote: "web development" },
      },
      TEXT
    );
    const labels = out.chips.map((c) => c.label);
    expect(labels).toEqual(["Senior Frontend Developer", "React", "Pocket Budget", "5 years"]);
    expect(out.chips[0].detail).toBe("Acme Corp");
    expect(out.chips[2].detail).toBeUndefined();
    expect(out.years).toBe(5);
    expect(out.suggestedTargetRole).toBe("Senior Frontend Developer");
    expect(out.suggestedIndustry).toBe("Web");
  });
  it("drops years that the text does not state", () => {
    const out = verifyChips({ chips: [], years: { value: 9, quote: "9 years of experience" } }, TEXT);
    expect(out.years).toBeNull();
    expect(out.chips).toEqual([]);
  });
  it("drops a target role that is not in the resume", () => {
    expect(verifyChips({ chips: [], suggestedTargetRole: { value: "Staff Engineer", quote: "Senior Frontend Developer" } }, TEXT).suggestedTargetRole).toBeNull();
  });
});
