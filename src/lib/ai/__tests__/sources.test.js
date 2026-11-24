import { describe, it, expect } from "vitest";
import { normalizeText, buildSources, validateSourceIds, snapshot, formatCatalogForPrompt, assignEntryIds } from "../sources.js";

describe("normalizeText", () => {
  it("makes hyphenation, case, quotes and whitespace irrelevant", () => {
    expect(normalizeText("Full-\nStack  Developer")).toBe(normalizeText("fullstack developer"));
    expect(normalizeText("It’s “good”")).toBe("it's \"good\"");
    expect(normalizeText(null)).toBe("");
  });
});

const resume = {
  summary: "Engineer.",
  skills: "React, Go",
  experience: [{ id: "e1", title: "Dev", organization: "Acme", startDate: "2020", description: "Built things" }, { title: "", organization: "", description: "" }],
};

describe("buildSources", () => {
  const cat = buildSources({
    profile: { industry: "Tech", skills: ["a", "b"], bio: " hi ", experience: 3 },
    resume,
    jobDescription: "Line one\n\nLine three " + "x".repeat(900),
    extra: [{ id: "input:x", kind: "input", label: "X", text: "t" }, { id: "", text: "bad" }],
  });
  const ids = cat.map((c) => c.id);
  it("builds ids for profile, resume, entries, jd and extras", () => {
    expect(ids).toEqual(expect.arrayContaining(["profile:industry", "profile:skills", "profile:bio", "profile:experience", "resume:summary", "resume:skills", "exp:e1", "jd:1", "jd:3.1", "jd:3.2", "input:x"]));
    expect(ids).not.toContain("jd:2");
  });
  it("skips empty entries and invalid extras", () => {
    expect(ids.filter((i) => i.startsWith("exp:"))).toEqual(["exp:e1"]);
    expect(ids).not.toContain("");
  });
  it("validates ids: unknown dropped, duplicates removed, order kept", () => {
    expect(validateSourceIds(["jd:1", "nope", "exp:e1", "jd:1", 5], cat)).toEqual(["jd:1", "exp:e1"]);
    expect(validateSourceIds("x", cat)).toEqual([]);
  });
  it("snapshots only valid ids with a clipped excerpt", () => {
    const s = snapshot(["jd:3.1", "zzz"], cat);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ id: "jd:3.1", kind: "jd" });
    expect(s[0].excerpt.length).toBeLessThanOrEqual(200);
  });
  it("formats one line per source", () => {
    expect(formatCatalogForPrompt(cat).split("\n")).toHaveLength(cat.length);
  });
});

describe("assignEntryIds", () => {
  it("keeps existing ids and regenerates duplicates", () => {
    const out = assignEntryIds([{ id: "a", title: "x" }, { id: "a", title: "y" }, { title: "z" }]);
    expect(out[0].id).toBe("a");
    expect(out[1].id).not.toBe("a");
    expect(out[2].id).toBeTruthy();
    expect(new Set(out.map((e) => e.id)).size).toBe(3);
  });
});
