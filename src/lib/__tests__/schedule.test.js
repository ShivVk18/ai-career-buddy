import { describe, it, expect } from "vitest";
import { nextMondayAt9, validTimeZone } from "../applications/schedule.js";
import { quietInfo } from "../applications/derive.js";
import { compareOffers, negotiationDraft, offerTotal } from "../applications/offer.js";
import { intakeChips, sniffEmploymentType, sniffExperience } from "../jobs/chips.js";

describe("nextMondayAt9", () => {
  it("is the following Monday 09:00 in the given zone (Mon -> a week later)", () => {
    // Wed 2026-11-25 12:00 UTC -> Mon 2026-11-30 09:00 UTC
    expect(nextMondayAt9(Date.parse("2026-11-25T12:00:00Z"), "UTC").toISOString()).toBe("2026-11-30T09:00:00.000Z");
    expect(nextMondayAt9(Date.parse("2026-11-23T08:00:00Z"), "UTC").toISOString()).toBe("2026-11-30T09:00:00.000Z");
    expect(nextMondayAt9(Date.parse("2026-11-29T23:00:00Z"), "UTC").toISOString()).toBe("2026-11-30T09:00:00.000Z");
  });
  it("uses the user's zone: Sunday evening UTC is already Monday in Tokyo", () => {
    expect(nextMondayAt9(Date.parse("2026-11-29T20:00:00Z"), "Asia/Tokyo").toISOString()).toBe("2026-12-07T00:00:00.000Z"); // 09:00 JST
    expect(nextMondayAt9(Date.parse("2026-11-25T12:00:00Z"), "America/New_York").toISOString()).toBe("2026-11-30T14:00:00.000Z");
  });
  it("falls back to the server zone for junk", () => {
    expect(validTimeZone("Mars/Base")).toBeNull();
    expect(nextMondayAt9(Date.parse("2026-11-25T12:00:00Z"), "nope")).toBeInstanceOf(Date);
  });
});

describe("quietInfo", () => {
  const now = Date.parse("2026-11-23T12:00:00Z");
  const day = 86400000;
  it("flags APPLIED after 5 quiet days, resets on activity", () => {
    expect(quietInfo({ status: "APPLIED", appliedAt: new Date(now - 6 * day) }, now)).toEqual({ quietDays: 6, isQuiet: true });
    expect(quietInfo({ status: "APPLIED", appliedAt: new Date(now - 4 * day) }, now)).toEqual({ quietDays: 4, isQuiet: false });
    expect(quietInfo({ status: "APPLIED", appliedAt: new Date(now - 9 * day), lastActivityAt: new Date(now - 1 * day) }, now)).toEqual({ quietDays: 1, isQuiet: false });
  });
  it("does not apply outside APPLIED", () => {
    expect(quietInfo({ status: "SAVED" }, now)).toEqual({ quietDays: null, isQuiet: false });
    expect(quietInfo({ status: "OFFER", appliedAt: new Date(now - 30 * day) }, now).isQuiet).toBe(false);
  });
});

describe("offer helpers", () => {
  it("compares with target and other offers, honestly", () => {
    const r = compareOffers({ offer: { base: 90000, bonus: 5000 }, targetBase: 100000, others: [{ applicationId: "b", company: "X", offer: { base: 95000, bonus: 0 } }] });
    expect(r.offer.total).toBe(95000);
    expect(r.vsTarget).toEqual({ targetBase: 100000, diff: -10000, pct: -10, meets: false });
    expect(r.others[0]).toMatchObject({ baseDiff: 5000, totalDiff: 0 });
    expect(r.marketData).toBeNull();
    expect(r.notes.join(" ")).toMatch(/no market salary data/);
  });
  it("says so when there is no target or other offer", () => {
    const r = compareOffers({ offer: { base: 1 }, targetBase: null, others: [] });
    expect(r.vsTarget).toBeNull();
    expect(r.notes.join(" ")).toMatch(/target/);
    expect(r.notes.join(" ")).toMatch(/other offer/);
    expect(offerTotal({ base: null, bonus: null, equity: null, other: null })).toBeNull();
  });
  it("draft uses only given facts", () => {
    const d = negotiationDraft({ company: "Acme", title: "Dev", offer: { base: 90000, currency: "EUR" }, targetBase: 100000, name: "Sam" });
    expect(d.text).toContain("90,000 EUR");
    expect(d.text).toContain("100,000 EUR");
    expect(d.text).not.toMatch(/market|competing|another offer/i);
    expect(negotiationDraft({ company: "Acme", offer: {}, targetBase: null, otherOfferCount: 1 }).text).toMatch(/another offer/);
  });
});

describe("job chips", () => {
  it("adds employment type and experience only when the text has them", () => {
    expect(sniffEmploymentType("This is a Full-Time position")).toBe("full-time");
    expect(sniffEmploymentType("We build things")).toBeNull();
    expect(sniffExperience("Requires 3-5 years of experience")).toBe("3-5 yrs");
    expect(sniffExperience("3+ years of frontend experience")).toBe("3+ yrs");
    expect(sniffExperience("at least 2 years in sales")).toBe("2+ yrs");
    expect(sniffExperience("no mention")).toBeNull();
    const c = intakeChips({ company: "A", title: "B" }, "Full-time. 2-4 years experience.\n- one");
    expect(c).toMatchObject({ employmentType: "full-time", experience: "2-4 yrs" });
    expect("employmentType" in intakeChips({}, "nothing")).toBe(false);
  });
});
