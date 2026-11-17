import { describe, it, expect } from "vitest";
import { findCliches, countWords, COVER_LETTER_WORDS, COLD_EMAIL_WORDS } from "../writing.js";

describe("writing", () => {
  it("counts words", () => {
    expect(countWords("  a b\nc ")).toBe(3);
    expect(countWords("")).toBe(0);
    expect(countWords(null)).toBe(0);
  });
  it("keeps ranges consistent", () => {
    expect(COVER_LETTER_WORDS.min).toBeLessThan(COVER_LETTER_WORDS.max);
    expect(COLD_EMAIL_WORDS).toMatchObject({ min: 100, max: 140 });
  });
  it("finds cliches with original offsets, whole phrases only", () => {
    const t = "I am thrilled to apply. A proven track record, and I am a Team Player!";
    const hits = findCliches(t);
    expect(hits.map((h) => h.phrase)).toEqual(["i am thrilled to apply", "proven track record", "team player"]);
    expect(t.slice(hits[2].start, hits[2].end)).toBe("Team Player");
    expect(findCliches("a team players club")).toEqual([]);
    expect(findCliches("")).toEqual([]);
  });
});
