import { describe, it, expect, vi, beforeEach } from "vitest";

let apps, me;
const db = {
  user: { findUnique: vi.fn(async ({ select }) => (select?.targetBase ? me : { id: "u1", name: "Sam" })) },
  application: {
    findFirst: vi.fn(async ({ where }) => apps.find((a) => a.id === where.id && a.userId === "u1") ?? null),
    findMany: vi.fn(async ({ where }) => apps.filter((a) => a.userId === "u1" && a.id !== where.id.not && a.status === where.status)),
    updateMany: vi.fn(async ({ where, data }) => {
      const a = apps.find((x) => x.id === where.id && x.userId === where.userId);
      if (!a) return { count: 0 };
      Object.assign(a, data);
      return { count: 1 };
    }),
  },
};
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@/lib/session", () => ({ auth: async () => ({ userId: "clerk_1" }) }));

const { compareOffer, draftNegotiation, setTargetSalary } = await import("../Offer.js");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  me = { targetBase: 100000 };
  apps = [
    { id: "a1", userId: "u1", status: "OFFER", offer: null, job: { company: "Fernwood", title: "Product Engineer" } },
    { id: "a2", userId: "u1", status: "OFFER", offer: { base: 95000, bonus: 0, equity: null, other: null }, job: { company: "Lumen", title: "Dev" } },
    { id: "a3", userId: "u1", status: "APPLIED", offer: null, job: { company: "X", title: "Y" } },
    { id: "z", userId: "other", status: "OFFER", offer: null, job: {} },
  ];
});

describe("compareOffer", () => {
  it("saves the typed offer and compares with target and other offers", async () => {
    const r = await compareOffer("a1", { base: 90000, bonus: 5000 });
    expect(r.offer).toMatchObject({ base: 90000, bonus: 5000, total: 95000 });
    expect(r.vsTarget).toMatchObject({ diff: -10000, meets: false });
    expect(r.others).toHaveLength(1);
    expect(r.others[0]).toMatchObject({ applicationId: "a2", baseDiff: 5000 });
    expect(r.marketData).toBeNull();
    expect(apps[0].offer.base).toBe(90000);
  });
  it("without a target says so", async () => {
    me = { targetBase: null };
    const r = await compareOffer("a1", { base: 1 });
    expect(r.vsTarget).toBeNull();
    expect(r.notes.join(" ")).toMatch(/target/);
  });
  it("validates, scopes to the owner and needs Offer status", async () => {
    expect((await compareOffer("a1", { base: -1 })).code).toBe("INVALID");
    expect((await compareOffer("a1", { base: "lots" })).code).toBe("INVALID");
    expect((await compareOffer("z", { base: 1 })).code).toBe("NOT_FOUND");
    expect((await compareOffer("a3", { base: 1 })).code).toBe("NOT_OFFER");
  });
});

describe("draftNegotiation", () => {
  it("uses the saved offer and target, with no invented market claims", async () => {
    await compareOffer("a1", { base: 90000, currency: "EUR" });
    const d = await draftNegotiation("a1");
    expect(d.text).toContain("90,000 EUR");
    expect(d.text).toContain("100,000 EUR");
    expect(d.text).toContain("Sam");
    expect(d.text).not.toMatch(/market rate|industry standard/i);
    expect(d.basedOn).toEqual({ hasOffer: true, hasTarget: true, otherOffers: 1 });
    expect(d.notes.join(" ")).toMatch(/no market salary data/);
  });
  it("says there are no numbers when none were entered", async () => {
    const d = await draftNegotiation("a1");
    expect(d.basedOn.hasOffer).toBe(false);
    expect(d.notes[0]).toMatch(/no numbers/);
    expect((await draftNegotiation("z")).code).toBe("NOT_FOUND");
  });
});

describe("setTargetSalary", () => {
  it("validates", async () => {
    db.user.update = vi.fn(async ({ data }) => data);
    expect(await setTargetSalary(120000)).toEqual({ targetBase: 120000 });
    expect(await setTargetSalary(null)).toEqual({ targetBase: null });
    expect((await setTargetSalary(-5)).code).toBe("INVALID");
    expect((await setTargetSalary("a")).code).toBe("INVALID");
  });
});
