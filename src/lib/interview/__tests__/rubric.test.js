import { describe, it, expect } from "vitest";
import { RUBRIC_WEIGHTS, computeOverall } from "../rubric.js";

describe("computeOverall", () => {
  it("weights sum to 100", () => {
    expect(Object.values(RUBRIC_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
  it("computes 0-100 from weights", () => {
    const all = (s) => [{ name: "clarity", score: s }, { name: "depth", score: s }, { name: "evidence", score: s }];
    expect(computeOverall(all(10))).toBe(100);
    expect(computeOverall(all(0))).toBe(0);
    expect(computeOverall(all(5))).toBe(50);
    expect(computeOverall([{ name: "clarity", score: 10 }, { name: "depth", score: 0 }, { name: "evidence", score: 0 }])).toBe(30);
  });
  it("clamps, ignores unknown names and duplicates, counts missing as 0", () => {
    expect(computeOverall([{ name: "clarity", score: 99 }, { name: "clarity", score: 0 }, { name: "bogus", score: 10 }])).toBe(30);
    expect(computeOverall([{ name: "depth", score: -5 }])).toBe(0);
    expect(computeOverall([{ name: "depth", score: "x" }])).toBe(0);
    expect(computeOverall(undefined)).toBe(0);
  });
});
