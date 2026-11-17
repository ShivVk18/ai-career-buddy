import { describe, it, expect } from "vitest";
import { classifyInput, looksLikeJob } from "../classify.js";
import { chipsFromHeader, verifyJobField } from "../meta.js";
import { buildSources } from "../../ai/sources.js";

const JD = `Senior Frontend Engineer
Acme Corp - Remote (EU)

About the role
We are looking for a Senior Frontend Engineer to join our platform team. You will own the design system.

Responsibilities
- Build accessible React components
- Mentor junior engineers

Requirements
- 5+ years of experience with React and TypeScript
- Experience with testing

Nice to have: GraphQL. We offer a competitive salary and benefits. Apply now.`;

describe("classifyInput", () => {
  it("detects links", () => {
    expect(classifyInput("https://boards.example.com/jobs/123")).toEqual({ kind: "url", url: "https://boards.example.com/jobs/123" });
    expect(classifyInput("  http://example.com/job  ").kind).toBe("url");
    expect(classifyInput("check this out https://example.com/j/1.").url).toBe("https://example.com/j/1");
    expect(classifyInput("www.example.com/careers/42")).toEqual({ kind: "url", url: "https://www.example.com/careers/42" });
  });
  it("treats a long job posting that contains a link as text", () => {
    expect(classifyInput(`${JD}\nSee https://example.com/apply`).kind).toBe("text");
  });
  it("detects pasted job text", () => {
    expect(classifyInput(JD)).toEqual({ kind: "text", text: JD });
    expect(classifyInput("x ".repeat(700)).kind).toBe("text");
  });
  it("sends questions to chat", () => {
    for (const q of [
      "How do I prepare for a system design interview?",
      "what should I put in my summary",
      "Can you review my resume?",
      "thanks",
      "make me a plan for this week",
    ]) {
      expect(classifyInput(q), q).toEqual({ kind: "question", text: q });
    }
  });
  it("keeps a long real job posting phrased with a leading question word as a job", () => {
    expect(classifyInput(`Are you ready to join us?\n${JD}`).kind).toBe("text");
  });
  it("handles empty input", () => {
    expect(classifyInput("   ").kind).toBe("empty");
    expect(classifyInput(undefined).kind).toBe("empty");
  });
});

describe("looksLikeJob", () => {
  it("accepts job text and rejects other pages", () => {
    expect(looksLikeJob(JD)).toBe(true);
    expect(looksLikeJob("Welcome to our blog about cooking. ".repeat(20))).toBe(false);
  });
});

describe("job chips", () => {
  const catalog = buildSources({ jobDescription: JD });
  it("accepts a value copied from the cited line", () => {
    expect(verifyJobField({ value: "Acme Corp", sourceIds: ["jd:2"] }, catalog)?.sources[0].id).toBe("jd:2");
    expect(verifyJobField({ value: "Senior Frontend Engineer", sourceIds: ["jd:1"] }, catalog)?.value).toBe("Senior Frontend Engineer");
  });
  it("nulls unsourced, wrong-line, unknown-id and invented values", () => {
    expect(verifyJobField({ value: "Acme Corp", sourceIds: [] }, catalog)).toBeNull();
    expect(verifyJobField({ value: "Acme Corp", sourceIds: ["jd:1"] }, catalog)).toBeNull();
    expect(verifyJobField({ value: "Acme Corp", sourceIds: ["jd:999"] }, catalog)).toBeNull();
    expect(verifyJobField({ value: "Initech", sourceIds: ["jd:2"] }, catalog)).toBeNull();
    expect(verifyJobField({ value: null, sourceIds: ["jd:2"] }, catalog)).toBeNull();
  });
  it("rejects a number the lines do not contain", () => {
    expect(verifyJobField({ value: "Senior Frontend Engineer 7", sourceIds: ["jd:1"] }, catalog)).toBeNull();
  });
  it("reads labelled header lines without AI", () => {
    const c = buildSources({ jobDescription: "Job title: Data Engineer\nCompany: Globex\nLocation: Berlin, DE\nOwn the pipelines." });
    const chips = chipsFromHeader(c);
    expect(chips.title.value).toBe("Data Engineer");
    expect(chips.company.sources[0].id).toBe("jd:2");
    expect(chips.location.value).toBe("Berlin, DE");
  });
});
