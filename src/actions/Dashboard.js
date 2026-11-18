"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { safeErr } from "@/lib/utils";
import { publicApplication } from "@/lib/applications/derive";
import { computeNeedsYou } from "@/lib/applications/needsYou";
import { computeProfileStrength } from "@/lib/profile/strength";
import { pruneDeleted } from "@/lib/softDelete";

const MAX_TARGETS = 10;
const MAX_TASKS = 5;
const MAX_FOLLOW_UPS = 10;
const MAX_APPLICATIONS = 10;

const norm = (v) => (typeof v === "string" ? v.trim() : "");

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const clerkUser = await currentUser();
    const firstName = norm(clerkUser?.firstName) || null;

    const empty = {
      firstName,
      avgAtsScore: null,
      counts: { atsScores: 0, coverLetters: 0, coldEmails: 0, roadmaps: 0, assessments: 0, hasResume: false },
      targets: [],
      totalTargets: 0,
      nextTasks: [],
      dueFollowUps: [],
      applications: [],
      needsYouCount: 0,
      hasOffer: false,
      profileStrength: null,
    };

    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return empty;
    const uid = user.id;
    await pruneDeleted(uid); // lazy hard-delete of rows soft-deleted more than 7 days ago

    const [ats, letters, emails, roadmaps, assessmentCount, resumeCount] = await Promise.all([
      db.aTSScore.findMany({
        where: { userId: uid, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, atsScore: true, companyName: true, jobTitle: true, createdAt: true },
      }),
      db.coverLetter.findMany({
        where: { userId: uid, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, companyName: true, jobTitle: true, createdAt: true },
      }),
      db.coldEmail.findMany({
        where: { userId: uid, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, companyName: true, jobTitle: true, createdAt: true },
      }),
      db.careerPath.findMany({
        where: { userId: uid, status: "active", deletedAt: null },
        orderBy: { updatedAt: "desc" },
        select: { id: true, targetRole: true, steps: true },
      }),
      db.assessment.count({ where: { userId: uid } }),
      db.resume.count({ where: { userId: uid, deletedAt: null } }),
    ]);

    // Due follow-ups (D34): reminders only, never sends. Owner-scoped; due = on or before the end of today (UTC).
    // If the cold_email_fields migration is not applied yet, this is just empty.
    let dueFollowUps = [];
    try {
      const now = new Date();
      const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const due = await db.coldEmail.findMany({
        where: { userId: uid, deletedAt: null, followUpAt: { not: null, lt: endOfToday } },
        orderBy: { followUpAt: "asc" },
        take: MAX_FOLLOW_UPS,
        select: { id: true, companyName: true, jobTitle: true, recipientName: true, subject: true, followUpAt: true },
      });
      dueFollowUps = due.map((e) => ({
        id: e.id,
        company: norm(e.companyName),
        role: norm(e.jobTitle),
        recipientName: e.recipientName ?? null,
        subject: e.subject ?? null,
        followUpAt: e.followUpAt.toISOString(),
        href: `/cold-email/${e.id}`,
      }));
    } catch (err) {
      console.error("dashboard follow-ups failed:", safeErr(err));
    }

    // UX flow pass: applications with one next action each, the "needs you" count, the offer flag, profile strength.
    // Each part falls back to its empty value so the rest of the dashboard still loads.
    let applications = [];
    let needsYouCount = 0;
    let hasOffer = false;
    let profileStrength = null;
    await Promise.all([
      db.application
        .findMany({
          where: { userId: uid, deletedAt: null, job: { deletedAt: null } },
          orderBy: { updatedAt: "desc" },
          take: MAX_APPLICATIONS,
          include: { job: { select: { id: true, title: true, company: true, location: true, url: true } } },
        })
        .then((rows) => {
          applications = rows.map((r) => publicApplication(r));
        })
        .catch((err) => console.error("dashboard applications failed:", safeErr(err))),
      db.application
        .count({ where: { userId: uid, deletedAt: null, status: "OFFER", job: { deletedAt: null } } })
        .then((n) => {
          hasOffer = n > 0;
        })
        .catch((err) => console.error("dashboard offer flag failed:", safeErr(err))),
      computeNeedsYou(uid)
        .then((r) => {
          needsYouCount = r.count;
        })
        .catch((err) => console.error("dashboard needs-you failed:", safeErr(err))),
      computeProfileStrength(uid)
        .then((r) => {
          profileStrength = r.percent;
        })
        .catch((err) => console.error("dashboard strength failed:", safeErr(err))),
    ]);

    // Targets: dedupe by (company, role); lists are newest first so the first row per kind is the latest.
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
    const targets = all.slice(0, MAX_TARGETS).map((t) => ({ ...t, lastActivityAt: t.lastActivityAt.toISOString() }));

    // Next tasks: incomplete steps of active roadmaps, most recently updated roadmap first.
    const nextTasks = [];
    for (const rm of roadmaps) {
      const steps = Array.isArray(rm.steps) ? rm.steps : [];
      for (const st of steps) {
        if (nextTasks.length >= MAX_TASKS) break;
        if (!st || st.completed || typeof st.title !== "string") continue;
        nextTasks.push({
          roadmapId: rm.id,
          roadmapTitle: rm.targetRole,
          stepId: Number(st.id),
          title: st.title,
          category: typeof st.category === "string" ? st.category : "",
          priority: typeof st.priority === "string" ? st.priority : "",
          href: `/roadmap/${rm.id}`,
        });
      }
      if (nextTasks.length >= MAX_TASKS) break;
    }

    return {
      firstName,
      avgAtsScore: ats.length ? Math.round(ats.reduce((s, a) => s + a.atsScore, 0) / ats.length) : null,
      counts: {
        atsScores: ats.length,
        coverLetters: letters.length,
        coldEmails: emails.length,
        roadmaps: roadmaps.length,
        assessments: assessmentCount,
        hasResume: resumeCount > 0,
      },
      targets,
      totalTargets: all.length,
      nextTasks,
      dueFollowUps,
      applications,
      needsYouCount,
      hasOffer,
      profileStrength,
    };
  } catch (error) {
    console.error("getDashboardData failed:", safeErr(error));
    throw new Error("Failed to load dashboard");
  }
}
