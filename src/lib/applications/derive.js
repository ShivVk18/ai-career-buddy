// Pure helpers for applications and "needs you" (D57-D60). No I/O: safe to unit test and to import anywhere.
import { normalizePipeline, STEPS } from "../jobs/pipeline.js";

export const FOLLOW_UP_DAYS = 5; // quiet days after appliedAt (or the last follow-up) before a follow-up is due
export const MAX_FOLLOW_UPS = 2;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const STATUSES = ["SAVED", "APPLIED", "INTERVIEWING", "OFFER", "CLOSED"];

const iso = (d) => (d instanceof Date ? d.toISOString() : d ?? null);

export const startOfTodayUTC = (now = Date.now()) => {
  const d = new Date(now);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/** When the next follow-up is due: nextActionAt when set, else appliedAt + 5 days. null when none is owed. */
export function followUpDueAt(app) {
  if (app.status !== "APPLIED" || (app.followUpCount ?? 0) >= MAX_FOLLOW_UPS) return null;
  if (app.nextActionAt) return new Date(app.nextActionAt);
  if (app.appliedAt) return new Date(new Date(app.appliedAt).getTime() + FOLLOW_UP_DAYS * DAY_MS);
  return null;
}

/** An interview date counts as upcoming from the start of that day (date pickers give no time). */
export const interviewUpcoming = (app, now = Date.now()) =>
  !!app.interviewAt && new Date(app.interviewAt).getTime() >= startOfTodayUTC(now).getTime();

/** "YYYY-MM-DD" -> 00:00 UTC of that day; a full ISO-8601 string -> that instant; otherwise null. */
export function parseDateInput(input) {
  if (typeof input !== "string") return null;
  const t = input.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const dt = new Date(Date.UTC(y, mo - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d ? dt : null;
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(t)) return null;
  const dt = new Date(t);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

const jobHref = (jobId) => `/jobs/${jobId}`;

/**
 * The ONE next action for an application card (deterministic): { label, href } or null (closed).
 * `row` needs status, interviewAt, prepSessionId, followUpCount, appliedAt, nextActionAt, pipeline, job.id.
 */
export function nextAction(row, now = Date.now()) {
  const href = jobHref(row.job?.id ?? row.jobId);
  const p = normalizePipeline(row.pipeline);
  switch (row.status) {
    case "SAVED": {
      if (STEPS.some((s) => p.steps[s].needsYou === true)) return { label: "Review your drafts", href: "/needs-you" };
      if (!STEPS.every((s) => ["done", "skipped"].includes(p.steps[s].status))) return { label: "Finish preparing", href };
      return { label: "Mark as applied", href };
    }
    case "APPLIED": {
      const due = followUpDueAt(row);
      if (due && due.getTime() <= now) return { label: "Follow up", href: "/needs-you" };
      return { label: "Waiting for a reply", href };
    }
    case "INTERVIEWING":
      if (interviewUpcoming(row, now)) {
        return row.prepSessionId ? { label: "Practice for your interview", href: `/interview/practice?session=${encodeURIComponent(row.prepSessionId)}` } : { label: "Prepare for your interview", href };
      }
      if (!row.interviewAt) return { label: "Add your interview date", href };
      return { label: "Add the result", href };
    case "OFFER":
      return { label: "Review your offer", href };
    default:
      return null;
  }
}

/** Browser shape of one application (getApplications / dashboard). */
export function publicApplication(row, now = Date.now()) {
  return {
    id: row.id,
    status: row.status,
    job: {
      id: row.job?.id ?? row.jobId,
      company: row.job?.company ?? null,
      title: row.job?.title ?? null,
      location: row.job?.location ?? null,
      url: row.job?.url ?? null,
    },
    appliedAt: iso(row.appliedAt),
    interviewAt: iso(row.interviewAt),
    prepSessionId: row.prepSessionId ?? null,
    nextActionAt: iso(row.nextActionAt),
    nextAction: nextAction(row, now),
    updatedAt: iso(row.updatedAt),
  };
}

/** Dedupes ATS missing skills (case-insensitive, trimmed) and keeps the first spelling. */
export function uniqueSkills(lists, max = 10) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const raw of Array.isArray(list) ? list : []) {
      const s = String(raw ?? "").replace(/\s+/g, " ").trim();
      const k = s.toLowerCase();
      if (!s || s.length > 80 || seen.has(k)) continue;
      seen.add(k);
      out.push(s);
      if (out.length >= max) return out;
    }
  }
  return out;
}

/** Roadmap steps to add for skill gaps: skipped when a step with that skill in its title already exists. */
export function gapSteps(skills, steps, { company, title, jobId }) {
  const existing = Array.isArray(steps) ? steps : [];
  const have = existing.map((s) => String(s?.title ?? "").toLowerCase());
  let nextId = existing.reduce((m, s) => (Number.isFinite(Number(s?.id)) ? Math.max(m, Number(s.id)) : m), 0);
  const where = [title, company].filter(Boolean).join(" at ");
  const out = [];
  for (const skill of skills) {
    const k = skill.toLowerCase();
    if (have.some((t) => t.includes(k))) continue;
    nextId += 1;
    out.push({
      id: nextId,
      title: `Learn ${skill}`,
      description: `This skill was missing from your resume in your ATS check${where ? ` for ${where}` : ""}.`,
      category: "Skill gap",
      priority: "medium",
      resources: [],
      completed: false,
      sourceIds: [],
      origin: { kind: "ats_gap", jobId: jobId ?? null },
    });
  }
  return out;
}
