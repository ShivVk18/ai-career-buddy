import { describe, it, expect } from "vitest";
import { verifyQuote, stripInventedSentences, normKey } from "../verify.js";

const ANSWER = "I led the migration to Postgres.  It cut query time a lot, and we shipped on schedule.";

describe("verifyQuote", () => {
  it("accepts a verbatim quote and returns the original range", () => {
    const r = verifyQuote("led the migration to postgres", ANSWER);
    expect(r.quote).toBe("led the migration to Postgres");
    expect(ANSWER.slice(...r.range)).toBe(r.quote);
  });
  it("is whitespace tolerant", () => {
    expect(verifyQuote("It cut query time", ANSWER)).not.toBeNull();
    expect(verifyQuote("postgres. it cut query", ANSWER)).not.toBeNull();
  });
  it("rejects invented, empty and too-short quotes", () => {
    expect(verifyQuote("we rewrote everything in Rust", ANSWER)).toBeNull();
    expect(verifyQuote("", ANSWER)).toBeNull();
    expect(verifyQuote("led", ANSWER)).toBeNull();
  });
});

describe("stripInventedSentences", () => {
  it("drops only sentences with unbacked numbers", () => {
    expect(stripInventedSentences("Good clarity. You saved 40% time. Nice.", "I saved time")).toBe("Good clarity. Nice.");
    expect(stripInventedSentences("You saved 40% time.", "I saved time")).toBe("");
    expect(stripInventedSentences("Fine as is.", "x")).toBe("Fine as is.");
    expect(stripInventedSentences("", "x")).toBe("");
  });
});

describe("normKey", () => {
  it("groups by case and whitespace", () => {
    expect(normKey("  Product   Analytics ")).toBe("product analytics");
  });
});
