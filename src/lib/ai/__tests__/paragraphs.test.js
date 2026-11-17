import { describe, it, expect, vi, beforeEach } from "vitest";

const runAIStructured = vi.fn();
vi.mock("../index.js", () => ({ runAIStructured: (...a) => runAIStructured(...a) }));

const { generateSourcedParagraphs, allowedNumberText, NoSourcesError } = await import("../paragraphs.js");

const catalog = [
  { id: "exp:1", kind: "experience", label: "Experience: Dev at Acme", text: "Dev at Acme. Led 5 engineers." },
  { id: "jd:1", kind: "jd", label: "JD line 1", text: "Needs React." },
];
const allowed = allowedNumberText(catalog);
const para = (kind, text, ids = []) => ({ kind, text, sourceIds: ids });

beforeEach(() => runAIStructured.mockReset());

describe("generateSourcedParagraphs", () => {
  it("keeps sourced body paragraphs, drops unknown ids, and stores sources per paragraph", async () => {
    runAIStructured.mockResolvedValueOnce({
      paragraphs: [para("greeting", "Hello,"), para("body", "I led 5 engineers.", ["exp:1", "bogus"]), para("closing", "Best,\nAda")],
    });
    const out = await generateSourcedParagraphs({ prompt: "p", catalog, userId: "u", allowedText: allowed });
    expect(out.content).toBe("Hello,\n\nI led 5 engineers.\n\nBest,\nAda");
    expect(out.sources.version).toBe(1);
    expect(out.sources.paragraphs.map((p) => p.kind)).toEqual(["greeting", "body", "closing"]);
    expect(out.sources.paragraphs[1].sources.map((s) => s.id)).toEqual(["exp:1"]);
  });
  it("retries once when a body paragraph is unsourced, then drops it", async () => {
    const first = { paragraphs: [para("body", "Made up claim."), para("body", "Real.", ["jd:1"])] };
    runAIStructured.mockResolvedValueOnce(first).mockResolvedValueOnce(first);
    const out = await generateSourcedParagraphs({ prompt: "p", catalog, userId: "u", allowedText: allowed });
    expect(runAIStructured).toHaveBeenCalledTimes(2);
    expect(out.content).toBe("Real.");
  });
  it("throws NO_SOURCES when no body paragraph can be sourced", async () => {
    runAIStructured.mockResolvedValue({ paragraphs: [para("body", "Nothing cited.")] });
    await expect(generateSourcedParagraphs({ prompt: "p", catalog, userId: "u" })).rejects.toBeInstanceOf(NoSourcesError);
  });
  it("treats a body paragraph with an invented number as unsourced", async () => {
    runAIStructured.mockResolvedValue({ paragraphs: [para("body", "I grew revenue 90%.", ["exp:1"])] });
    await expect(generateSourcedParagraphs({ prompt: "p", catalog, userId: "u", allowedText: allowed })).rejects.toBeInstanceOf(NoSourcesError);
  });
  it("replaces a greeting or closing with an invented number by a safe default", async () => {
    runAIStructured.mockResolvedValueOnce({
      paragraphs: [para("greeting", "Hello 77,"), para("body", "I led 5 engineers.", ["exp:1"]), para("closing", "Cheers 99")],
    });
    const out = await generateSourcedParagraphs({ prompt: "p", catalog, userId: "u", allowedText: allowed, userName: "Ada" });
    expect(out.content).toBe("Hello,\n\nI led 5 engineers.\n\nBest regards,\nAda");
  });
  it("demotes a misplaced greeting or closing to body", async () => {
    runAIStructured.mockResolvedValueOnce({
      paragraphs: [para("body", "A.", ["jd:1"]), para("greeting", "B.", ["jd:1"]), para("closing", "C.", ["jd:1"]), para("body", "D.", ["jd:1"])],
    });
    const out = await generateSourcedParagraphs({ prompt: "p", catalog, userId: "u" });
    expect(out.sources.paragraphs.map((p) => p.kind)).toEqual(["body", "body", "body", "body"]);
  });
  it("keeps a cold email subject only with a valid source and no claims", async () => {
    runAIStructured.mockResolvedValueOnce({
      paragraphs: [para("body", "Hi.", ["jd:1"])],
      subject: { text: "Dev role at Acme", sourceIds: ["exp:1"] },
    });
    const ok = await generateSourcedParagraphs({ prompt: "p", catalog, userId: "u", withSubject: true });
    expect(ok.subject.text).toBe("Dev role at Acme");
    runAIStructured.mockResolvedValueOnce({
      paragraphs: [para("body", "Hi.", ["jd:1"])],
      subject: { text: "Guaranteed 50% open rate", sourceIds: ["exp:1"] },
    });
    const bad = await generateSourcedParagraphs({ prompt: "p", catalog, userId: "u", withSubject: true });
    expect(bad.subject).toBeNull();
  });
});

import { paragraphHash } from "../../entryIds.js";
import { withUpdatedHashes } from "../paragraphs.js";

describe("paragraph hashes", () => {
  it("are stored on new generations and match paragraphHash of the text", async () => {
    runAIStructured.mockResolvedValueOnce({ paragraphs: [para("greeting", "Hello,"), para("body", "I led 5 engineers.", ["exp:1"])] });
    const out = await generateSourcedParagraphs({ prompt: "p", catalog, userId: "u", allowedText: allowed });
    expect(out.sources.paragraphs.map((p) => p.hash)).toEqual([paragraphHash("Hello,"), paragraphHash("I led 5 engineers.")]);
  });
  it("paragraphHash is stable, whitespace-insensitive and text-sensitive", () => {
    expect(paragraphHash("a  b\n c")).toBe(paragraphHash(" a b c "));
    expect(paragraphHash("a b")).not.toBe(paragraphHash("a c"));
    expect(paragraphHash("x")).toMatch(/^[0-9a-z]{7}$/);
  });
  it("shorten refreshes only rewritten paragraphs that had a hash", () => {
    const old = ["Hello,", "Long body text here.", "Other body."];
    const next = ["Hello,", "Short body.", "Other body."];
    const sources = {
      version: 1,
      tone: "confident",
      paragraphs: [
        { kind: "greeting", hash: paragraphHash(old[0]), sources: [] },
        { kind: "body", hash: paragraphHash(old[1]), sources: [{ id: "exp:1" }] },
        { kind: "body", sources: [{ id: "jd:1" }] },
      ],
    };
    const out = withUpdatedHashes(sources, old, next);
    expect(out.paragraphs[0].hash).toBe(paragraphHash("Hello,"));
    expect(out.paragraphs[1].hash).toBe(paragraphHash("Short body."));
    expect(out.paragraphs[1].sources).toEqual([{ id: "exp:1" }]);
    expect(out.paragraphs[2]).toEqual(sources.paragraphs[2]);
    expect(out.tone).toBe("confident");
    expect(withUpdatedHashes(null, old, next)).toBeNull();
  });
});
