import { describe, it, expect } from "vitest";
import { legacyEntryId, ensureEntryIds } from "../entryIds.js";

describe("entryIds", () => {
  const a = { title: "Dev", organization: "Acme", startDate: "2020-01" };
  it("is deterministic and varies with section, index and content", () => {
    expect(legacyEntryId("exp", 0, a)).toBe(legacyEntryId("exp", 0, { ...a }));
    expect(legacyEntryId("exp", 0, a)).toMatch(/^l-exp-[0-9a-z]+$/);
    expect(legacyEntryId("exp", 0, a)).not.toBe(legacyEntryId("exp", 1, a));
    expect(legacyEntryId("exp", 0, a)).not.toBe(legacyEntryId("proj", 0, a));
    expect(legacyEntryId("exp", 0, a)).not.toBe(legacyEntryId("exp", 0, { ...a, organization: "B" }));
  });
  it("adds missing ids without mutating or changing existing ones, and is idempotent", () => {
    const r = { experience: [a, { ...a, id: "keep" }] };
    const out = ensureEntryIds(r);
    expect(out.experience[1].id).toBe("keep");
    expect(out.experience[0].id).toBe(legacyEntryId("exp", 0, a));
    expect(r.experience[0].id).toBeUndefined();
    expect(ensureEntryIds(out)).toEqual(out);
  });
  it("passes through non-objects", () => {
    expect(ensureEntryIds(null)).toBeNull();
  });
});
