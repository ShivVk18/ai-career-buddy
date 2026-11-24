import { describe, it, expect, vi } from "vitest";

const db = { coldEmail: { findMany: vi.fn(async () => [{ id: "e1", companyName: " Acme ", jobTitle: "Dev", recipientName: null, subject: "Hi", followUpAt: new Date("2026-01-02T00:00:00Z") }]) } };
vi.mock("@/lib/prisma", () => ({ db }));

const { deriveTargets, loadDueFollowUps } = await import("../derive.js");

describe("deriveTargets", () => {
  it("dedupes by company and role and keeps the first (newest) row per kind", () => {
    const d1 = new Date("2026-01-03"), d2 = new Date("2026-01-01");
    const r = deriveTargets(
      [{ id: "a1", atsScore: 80, companyName: "Acme", jobTitle: "Dev", createdAt: d1 }, { id: "a0", atsScore: 50, companyName: "acme", jobTitle: "dev", createdAt: d2 }],
      [{ id: "l1", companyName: "ACME", jobTitle: "Dev", createdAt: d2 }],
      [{ id: "x", companyName: "", jobTitle: "", createdAt: d1 }]
    );
    expect(r.totalTargets).toBe(1);
    expect(r.targets[0]).toMatchObject({ company: "Acme", ats: { id: "a1", score: 80 }, coverLetter: { id: "l1" }, coldEmail: null, lastActivityAt: d1.toISOString() });
  });
});

describe("loadDueFollowUps", () => {
  it("maps rows and is empty on failure", async () => {
    const r = await loadDueFollowUps("u1");
    expect(r[0]).toMatchObject({ id: "e1", company: "Acme", href: "/cold-email/e1", followUpAt: "2026-01-02T00:00:00.000Z" });
    db.coldEmail.findMany.mockRejectedValueOnce(new Error("x"));
    expect(await loadDueFollowUps("u1")).toEqual([]);
  });
});
