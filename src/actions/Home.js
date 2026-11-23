"use server";

import { after } from "next/server";
import { db } from "@/lib/prisma";
import { safeErr } from "@/lib/utils";
import { fail, requireUser, iso } from "@/lib/jobs/common";
import { publicApplication } from "@/lib/applications/derive";
import { computeNeedsYou } from "@/lib/applications/needsYou";
import { isStalled, resumeStalledForUser } from "@/lib/jobs/runner";
import { progressStage, botStatusFor, summarizeBots } from "@/lib/home/state";

const MAX_APPS = 20;
const MAX_TASKS = 7;

/** Incomplete steps of active roadmaps that are due this week (no due dates exist, so: the next ones, newest roadmap first). */
function weekTasks(roadmaps, dated = []) {
  // Dated tasks (weak spots, rejection gaps) come first, soonest first; then roadmap steps.
  const out = dated.slice(0, MAX_TASKS).map((t) => ({
    kind: "task", taskId: t.id, applicationId: t.applicationId ?? null, title: t.title, note: t.note ?? null, source: t.source, dueAt: iso(t.dueAt),
    roadmapId: null, roadmapTitle: null, stepId: null, category: t.source === "weak_spot" ? "Weak spot" : "Skill gap", priority: "", href: t.source === "weak_spot" ? "/interview/practice" : "/applications",
  }));
  for (const rm of roadmaps) {
    for (const st of Array.isArray(rm.steps) ? rm.steps : []) {
      if (out.length >= MAX_TASKS) return out;
      if (!st || st.completed || typeof st.title !== "string") continue;
      out.push({ kind: "roadmap", dueAt: null, roadmapId: rm.id, roadmapTitle: rm.targetRole, stepId: Number(st.id), title: st.title, category: typeof st.category === "string" ? st.category : "", priority: typeof st.priority === "string" ? st.priority : "", href: `/roadmap/${rm.id}` });
    }
  }
  return out;
}

/**
 * Everything the home screen needs in one call. Needs-you is derived once here.
 * Returns {
 *   stage: "dawn"|"noon"|"sunset"|"night",
 *   needsYou: { count, items[] },
 *   applications: [{ id, status, job:{id,company,title,location,url}, appliedAt, interviewAt, prepSessionId, nextActionAt, nextAction:{label,href}|null, quietDays:number|null, isQuiet:boolean, updatedAt, bot:{state,step,completedCount,total} }],
 *   tasks: [{ kind:"task"|"roadmap", dueAt:ISO|null, taskId?, applicationId?, note?, source?, roadmapId, roadmapTitle, stepId, title, category, priority, href }],
 *   bots: { running, failed, needsYou, done, items:[{ applicationId, company, title, state, step, completedCount, total }] },
 *   unreadNotifications: number,
 *   generatedAt: ISO string
 * } or { error, code }. Signed-out throws "Unauthorized".
 */
export async function getHomeState() {
  const { clerkUserId, user } = await requireUser();
  if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
  const uid = user.id;
  try {
    const now = Date.now();
    const [rows, statusGroups, needsYou, roadmaps, unread, datedTasks] = await Promise.all([
      db.application.findMany({
        where: { userId: uid, deletedAt: null, job: { deletedAt: null } },
        orderBy: { updatedAt: "desc" },
        take: MAX_APPS,
        include: { job: { select: { id: true, title: true, company: true, location: true, url: true } } },
      }),
      db.application.groupBy({ by: ["status"], where: { userId: uid, deletedAt: null, job: { deletedAt: null } } }),
      computeNeedsYou(uid, now),
      db.careerPath.findMany({ where: { userId: uid, status: "active", deletedAt: null }, orderBy: { updatedAt: "desc" }, select: { id: true, targetRole: true, steps: true } }),
      db.notification.count({ where: { userId: uid, readAt: null } }),
      db.task.findMany({ where: { userId: uid, doneAt: null }, orderBy: { dueAt: "asc" }, take: MAX_TASKS }),
    ]);
    // Resume-on-visit (D-HF1): a run that stalled (restart, timeout) continues in the background after this response.
    if (rows.some((r) => r.status !== "CLOSED" && isStalled(r, now))) {
      try {
        after(() => resumeStalledForUser({ user, clerkUserId }));
      } catch (e) {
        console.error("resume schedule failed:", safeErr(e));
      }
    }
    const live = rows.filter((r) => r.status !== "CLOSED");
    const applications = rows.map((r) => ({ ...publicApplication(r, now), bot: botStatusFor(r, now) }));
    const botItems = live
      .map((r) => ({ applicationId: r.id, company: r.job?.company ?? null, title: r.job?.title ?? null, ...botStatusFor(r, now) }))
      .filter((b) => b.state !== "idle" || b.completedCount > 0);
    return {
      stage: progressStage(statusGroups.map((g) => g.status)),
      needsYou,
      applications,
      tasks: weekTasks(roadmaps, datedTasks),
      bots: summarizeBots(botItems),
      unreadNotifications: unread,
      generatedAt: iso(new Date(now)),
    };
  } catch (error) {
    console.error("getHomeState failed:", safeErr(error));
    return fail("FAILED", "We couldn't load your home. Please try again.");
  }
}
