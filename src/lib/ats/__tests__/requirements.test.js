import { describe, it, expect, vi } from "vitest";
vi.mock("@/lib/ai", () => ({ runAIStructured: vi.fn() }));
const { verifyRequirements } = await import("../score.js");
const { buildSources, normalizeText } = await import("@/lib/ai/sources");

const resume = "Built dashboards in React and shipped internal tools used by the support team every day.";
const catalog = buildSources({ jobDescription: "Strong React experience\nLead production Kubernetes clusters\nGood communication" });
const q = (quote) => [{ type: "resume_quote", quote }];
const run = (items) => verifyRequirements(items, normalizeText(resume), catalog);

describe("verifyRequirements", () => {
  it("keeps old status matched|gap and adds match have|partial|gap", () => {
    const out = run([
      { requirement: "React", status: "matched", sources: q("Built dashboards in React and shipped internal tools") },
      { requirement: "Kubernetes in production", status: "partial", sources: q("shipped internal tools used by the support team") },
      { requirement: "Kubernetes", status: "gap", sources: [{ type: "jd", id: "jd:2" }] },
    ]);
    expect(out.map((r) => [r.status, r.match])).toEqual([["matched", "have"], ["gap", "partial"], ["gap", "gap"]]);
  });
  it("drops matched/partial without a verified resume quote and gap without a jd id", () => {
    const out = run([
      { requirement: "a", status: "partial", sources: q("this quote is not in the resume at all") },
      { requirement: "b", status: "matched", sources: [{ type: "jd", id: "jd:1" }] },
      { requirement: "c", status: "gap", sources: q("Built dashboards in React and shipped internal tools") },
      { requirement: "d", status: "maybe", sources: q("Built dashboards in React and shipped internal tools") },
    ]);
    expect(out).toEqual([]);
  });
});
