import { describe, it, expect } from "vitest";
import { inventedNumbers, inventedQuestionNumbers, numTokens } from "../numberCheck.js";

describe("inventedNumbers", () => {
  it("accepts numbers backed by the input, digits or words", () => {
    expect(inventedNumbers("led five engineers", "led 5 engineers")).toEqual([]);
    expect(inventedNumbers("twenty-five users", "25 users")).toEqual([]);
    expect(inventedNumbers("in 2023", "in 2023")).toEqual([]);
  });
  it("flags numbers the input does not back", () => {
    expect(inventedNumbers("grew 40%", "grew sales").length).toBeGreaterThan(0);
    expect(inventedNumbers("led five engineers", "led engineers").length).toBeGreaterThan(0);
  });
  it("does not treat a lone 'one' as a number", () => {
    expect(inventedNumbers("one of the leads", "one of the leads")).toEqual([]);
    expect(inventedNumbers("first place", "place")).toEqual([]);
  });
  it("numTokens ignores list numbering and thousands commas", () => {
    expect(numTokens("1. Did 1,200 things")).toEqual(["1200"]);
  });
});

describe("inventedQuestionNumbers", () => {
  it("allows small counts but flags years, percents, money and time", () => {
    expect(inventedQuestionNumbers("Name 3 trade-offs of Node.", "React, Node")).toEqual([]);
    for (const q of ["Tell me about your 12 years.", "improved by 30%", "a $5 budget", "What happened in 2019?", "You have 5 minutes."]) {
      expect(inventedQuestionNumbers(q, "React, Node").length, q).toBeGreaterThan(0);
    }
  });
});
