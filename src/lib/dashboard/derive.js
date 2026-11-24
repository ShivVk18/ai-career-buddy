import { db } from "@/lib/prisma";
import { safeErr } from "@/lib/utils";

export const MAX_TARGETS = 10;
export const MAX_FOLLOW_UPS = 10;

const norm = (v) => (typeof v === "string" ? v.trim() : "");

/**
 * Targets from documents: dedupe by (company, role); inputs are newest first so the first row per kind is the latest.
 * Returns { targets (max 10, lastActivityAt ISO), totalTargets }.
 */
export function deriveTargets(ats = [], letters = [], emails = []) {
  const map = new Map();
  const touch = (company, role, createdAt) => {
    const c = norm(company);
    const r = norm(role);
    if (!c && !r) return null;
    const key = `${c.toLowerCase()}|${r.toLowerCase()}`;
    let t = map.get(key);
    if (!t) {
      t = { key, company: c, role: r, lastActivityAt: createdAt, ats: null, coverLetter: null, coldEmail: null };
      map.set(key, t);
    }
    if (createdAt > t.lastActivityAt) t.lastActivityAt = createdAt;
    return t;
  };
  for (const a of ats) {
    const t = touch(a.companyName, a.jobTitle, a.createdAt);
    if (t && !t.ats) t.ats = { id: a.id, score: a.atsScore, href: "/resume-parser" };
  }
  for (const l of letters) {
    const t = touch(l.companyName, l.jobTitle, l.createdAt);
    if (t && !t.coverLetter) t.coverLetter = { id: l.id, href: `/cover-letter/${l.id}` };
  }
  for (const e of emails) {
    const t = touch(e.companyName, e.jobTitle, e.createdAt);
    if (t && !t.coldEmail) t.coldEmail = { id: e.id, href: `/cold-email/${e.id}` };
  }
  const all = [...map.values()].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  return {
    targets: all.slice(0, MAX_TARGETS).map((t) => ({ ...t, lastActivityAt: t.lastActivityAt.toISOString() })),
    totalTargets: all.length,
  };
}

/** Due follow-ups (reminders only): owner-scoped, due on or before the end of today (UTC). Empty on failure. */
export async function loadDueFollowUps(uid, now = new Date()) {
  try {
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const due = await db.coldEmail.findMany({
      where: { userId: uid, deletedAt: null, followUpAt: { not: null, lt: endOfToday } },
      orderBy: { followUpAt: "asc" },
      take: MAX_FOLLOW_UPS,
      select: { id: true, companyName: true, jobTitle: true, recipientName: true, subject: true, followUpAt: true },
    });
    return due.map((e) => ({
      id: e.id,
      company: norm(e.companyName),
      role: norm(e.jobTitle),
      recipientName: e.recipientName ?? null,
      subject: e.subject ?? null,
      followUpAt: e.followUpAt.toISOString(),
      href: `/cold-email/${e.id}`,
    }));
  } catch (err) {
    console.error("follow-ups failed:", safeErr(err));
    return [];
  }
}

/** Loads the document rows and derives targets (used by home; the dashboard already has the rows). */
export async function loadTargets(uid) {
  const where = { userId: uid, deletedAt: null };
  const orderBy = { createdAt: "desc" };
  try {
    const [ats, letters, emails] = await Promise.all([
      db.aTSScore.findMany({ where, orderBy, take: 200, select: { id: true, atsScore: true, companyName: true, jobTitle: true, createdAt: true } }),
      db.coverLetter.findMany({ where, orderBy, take: 200, select: { id: true, companyName: true, jobTitle: true, createdAt: true } }),
      db.coldEmail.findMany({ where, orderBy, take: 200, select: { id: true, companyName: true, jobTitle: true, createdAt: true } }),
    ]);
    return deriveTargets(ats, letters, emails);
  } catch (err) {
    console.error("targets failed:", safeErr(err));
    return { targets: [], totalTargets: 0 };
  }
}
