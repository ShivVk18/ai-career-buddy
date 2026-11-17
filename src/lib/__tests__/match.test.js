import { describe, it, expect } from "vitest";
import { extractTerms, matchText } from "../match.js";

const JD = "We need React, TypeScript and Node.js. Experience with AWS, Docker and REST APIs. Knowledge of GraphQL is a plus.";

describe("match", () => {
  it("extracts canonical terms in order and ignores ambiguous fragments", () => {
    const t = extractTerms(JD);
    expect(t).toEqual(["react", "typescript", "node.js", "aws", "docker", "rest api", "graphql"]);
    expect(extractTerms("javascript only")).not.toContain("java");
    expect(extractTerms("")).toEqual([]);
  });
  it("computes a deterministic percent from matched terms", () => {
    const r = matchText(JD, "React and typescript on AWS with docker");
    expect(r.matched).toEqual(["react", "typescript", "aws", "docker"]);
    expect(r.missing).toEqual(["node.js", "rest api", "graphql"]);
    expect(r.percent).toBe(Math.round((4 / 7) * 100));
  });
  it("returns 0 with no terms or no resume text", () => {
    expect(matchText("nothing technical here", "anything").percent).toBe(0);
    expect(matchText(JD, "").percent).toBe(0);
  });
});
