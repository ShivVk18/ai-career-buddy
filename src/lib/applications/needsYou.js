// "Needs you" is DERIVED from existing rows (D57, D60): nothing here is stored except the lazy follow-up due date.
// Owner-scoped (every query has the caller's DB user id), ignores deleted rows. Not a "use server" file.
import { db } from "@/lib/prisma";
import { safeErr } from "@/lib/utils";
import { normalizePipeline } from "@/lib/jobs/pipeline";
import { DAY_MS, FOLLOW_UP_DAYS, MAX_FOLLOW_UPS, followUpDueAt, interviewUpcoming } from "./derive.js";

export const MAX_ITEMS = 50;
const MAX_APPS = 100;
const DRAFT_PREFIX = '{"kind":"draft"'; // same marker as src/actions/Resume.js
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const ATS_TEXT_TTL_MS = 90 * DAY_MS; // evidence.resumeText is purged after this (D42), so fixes need a re-upload

const iso = (d) => (d instanceof Date ? d.toISOString() : d ?? null);
const label = (app) => app.job?.company || app.job?.title || "this job";

/** A weakness can be fixed in one click only when it quotes the resume (proposeAtsFix needs that quote). */
export function hasFixableWeakness(evidence, createdAt, now = Date.now()) {
  if (!evidence || typeof evidence !== "object") return false;
  if (typeof evidence.resumeText !== "string" || !evidence.resumeText) return false;
  if (!(createdAt instanceof Date) || now - createdAt.getTime() > ATS_TEXT_TTL_MS) return false;
  const weaknesses = Array.isArray(evidence.weaknesses) ? evidence.weaknesses : [];
  return weaknesses.some((w) => Array.isArray(w?.sources) && w.sources.some((s) => s?.type === "resume_quote" && typeof s.quote === "string" && s.quote));
}

/** Follow-ups are created lazily: an APPLIED application without nextActionAt gets appliedAt + 5 days written on read. */
async function ensureFollowUpDates(userDbId, apps) {
  const todo = apps.filter((a) => a.status === "APPLIED" && !a.nextActionAt && a.appliedAt && (a.followUpCount ?? 0) < MAX_FOLLOW_UPS);
  await Promise.all(
    todo.map(async (a) => {
      const due = new Date(new Date(a.appliedAt).getTime() + FOLLOW_UP_DAYS * DAY_MS);
      try {
        await db.application.updateMany({ where: { id: a.id, userId: userDbId, deletedAt: null, status: "APPLIED", nextActionAt: null }, data: { nextActionAt: due } });
        a.nextActionAt = due;
      } catch (err) {
        console.error("follow-up date failed:", safeErr(err));
      }
    })
  );
}

/** @returns {Promise<NeedsYouItem[]>} every pending item, newest first (NOT capped). */
export async function deriveNeedsYou(userDbId, now = Date.now()) {
  const apps = await db.application.findMany({
    where: { userId: userDbId, deletedAt: null, status: { not: "CLOSED" }, job: { deletedAt: null } },
    orderBy: { updatedAt: "desc" },
    take: MAX_APPS,
    select: {
      id: true, jobId: true, status: true, appliedAt: true, interviewAt: true, nextActionAt: true,
      followUpCount: true, prepSessionId: true, pipeline: true, updatedAt: true,
      job: { select: { id: true, title: true, company: true } },
    },
  });
  if (apps.length === 0) return [];
  await ensureFollowUpDates(userDbId, apps);

  const pipes = new Map(apps.map((a) => [a.id, normalizePipeline(a.pipeline)]));
  const pending = (a, step) => {
    const st = pipes.get(a.id).steps[step];
    return st.status === "done" && st.needsYou === true ? st : null;
  };
  const ids = { draft: [], letter: [], email: [] };
  for (const a of apps) {
    const t = pending(a, "TAILOR");
    const w = pending(a, "WRITER");
    const c = pending(a, "CONNECTOR");
    if (t?.ids?.draftId) ids.draft.push(t.ids.draftId);
    if (w?.ids?.coverLetterId) ids.letter.push(w.ids.coverLetterId);
    if (c?.ids?.coldEmailId) ids.email.push(c.ids.coldEmailId);
  }
  const checkerApps = apps.filter((a) => {
    const st = pipes.get(a.id).steps.CHECKER;
    return st.status === "done" && st.fixDismissed !== true && st.ids?.atsScoreId;
  });
  const prepIds = apps.filter((a) => a.prepSessionId).map((a) => a.prepSessionId);

  const followUpJobIds = apps.map((a) => a.jobId);
  const [drafts, letters, emails, scores, preps, followDrafts] = await Promise.all([
    ids.draft.length
      ? db.resumeVersion.findMany({
          where: { id: { in: ids.draft }, resume: { userId: userDbId }, tailoredContent: { startsWith: DRAFT_PREFIX }, createdAt: { gte: new Date(now - DRAFT_TTL_MS) } },
          select: { id: true, createdAt: true },
        })
      : [],
    ids.letter.length ? db.coverLetter.findMany({ where: { id: { in: ids.letter }, userId: userDbId, deletedAt: null }, select: { id: true, createdAt: true } }) : [],
    ids.email.length ? db.coldEmail.findMany({ where: { id: { in: ids.email }, userId: userDbId, deletedAt: null }, select: { id: true, createdAt: true } }) : [],
    checkerApps.length
      ? db.aTSScore.findMany({
          where: { userId: userDbId, deletedAt: null, jobId: { in: checkerApps.map((a) => a.jobId) } },
          orderBy: { createdAt: "desc" },
          take: 200,
          select: { id: true, jobId: true, createdAt: true, evidence: true },
        })
      : [],
    // A prep session stops being a to-do once at least one of its answers is scored.
    prepIds.length ? db.interviewAnswer.findMany({ where: { sessionId: { in: prepIds }, userId: userDbId, overall: { not: null } }, select: { sessionId: true }, distinct: ["sessionId"] }) : [],
    // Follow-up drafts (createFollowUpDraft): waiting for the user to approve and copy (they send it themselves).
    db.coldEmail.findMany({
      where: { userId: userDbId, deletedAt: null, status: "draft", jobId: { in: followUpJobIds }, sources: { path: ["template"], equals: "follow_up" } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, jobId: true, subject: true, content: true, createdAt: true },
    }),
  ]);
  const followByJob = new Map();
  for (const f of followDrafts) if (!followByJob.has(f.jobId)) followByJob.set(f.jobId, f); // newest per job
  const byId = (rows) => new Map(rows.map((r) => [r.id, r]));
  const draftMap = byId(drafts);
  const letterMap = byId(letters);
  const emailMap = byId(emails);
  const prepSet = new Set(preps.map((p) => p.sessionId));
  const latestScore = new Map();
  for (const s of scores) if (!latestScore.has(s.jobId)) latestScore.set(s.jobId, s); // newest first

  const items = [];
  const base = (a) => ({ applicationId: a.id, jobId: a.jobId, company: a.job?.company ?? null, jobTitle: a.job?.title ?? null, dueAt: null });
  for (const a of apps) {
    const p = pipes.get(a.id);

    const t = pending(a, "TAILOR");
    const draft = t?.ids?.draftId && draftMap.get(t.ids.draftId);
    if (draft) {
      items.push({ ...base(a), id: `TAILOR_DRAFT:${draft.id}`, type: "TAILOR_DRAFT", title: `Review resume edits for ${label(a)}`, refId: draft.id, href: `/needs-you?item=${encodeURIComponent(`TAILOR_DRAFT:${draft.id}`)}`, createdAt: iso(draft.createdAt) });
    }
    const w = pending(a, "WRITER");
    const letter = w?.ids?.coverLetterId && letterMap.get(w.ids.coverLetterId);
    if (letter) {
      items.push({ ...base(a), id: `COVER_LETTER:${letter.id}`, type: "COVER_LETTER", title: `Review your cover letter for ${label(a)}`, refId: letter.id, href: `/cover-letter/${letter.id}`, createdAt: iso(letter.createdAt) });
    }
    const c = pending(a, "CONNECTOR");
    const email = c?.ids?.coldEmailId && emailMap.get(c.ids.coldEmailId);
    if (email) {
      items.push({ ...base(a), id: `COLD_EMAIL:${email.id}`, type: "COLD_EMAIL", title: `Review your cold email for ${label(a)}`, refId: email.id, href: `/cold-email/${email.id}`, createdAt: iso(email.createdAt) });
    }

    const ck = p.steps.CHECKER;
    const latest = latestScore.get(a.jobId);
    if (ck.status === "done" && ck.fixDismissed !== true && latest && latest.id === ck.ids?.atsScoreId && hasFixableWeakness(latest.evidence, latest.createdAt, now)) {
      items.push({ ...base(a), id: `ATS_FIX:${latest.id}`, type: "ATS_FIX", title: `Fix resume gaps found for ${label(a)}`, refId: latest.id, href: "/resume-parser", createdAt: iso(latest.createdAt) });
    }

    const fd = followByJob.get(a.jobId);
    if (fd && a.status === "APPLIED") {
      items.push({ ...base(a), id: `FOLLOW_UP_DRAFT:${fd.id}`, type: "FOLLOW_UP_DRAFT", title: `Send your follow-up to ${label(a)}`, refId: fd.id, href: `/cold-email/${fd.id}`, draft: { subject: fd.subject ?? "", text: fd.content }, createdAt: iso(fd.createdAt) });
    }

    const due = followUpDueAt(a);
    if (due && due.getTime() <= now) {
      items.push({ ...base(a), id: `FOLLOW_UP:${a.id}`, type: "FOLLOW_UP", title: `Follow up on your application to ${label(a)}`, refId: a.id, href: `/jobs/${a.jobId}`, dueAt: iso(due), createdAt: iso(due) });
    }

    if (a.status === "INTERVIEWING" && interviewUpcoming(a, now) && !(a.prepSessionId && prepSet.has(a.prepSessionId))) {
      items.push({ ...base(a), id: `PREP_INTERVIEW:${a.id}`, type: "PREP_INTERVIEW", title: `Prepare for your interview at ${label(a)}`, refId: a.id, href: a.prepSessionId ? `/interview/practice?session=${encodeURIComponent(a.prepSessionId)}` : `/jobs/${a.jobId}`, dueAt: iso(a.interviewAt), createdAt: iso(a.updatedAt) });
    }
  }
  return items.sort((x, y) => Date.parse(y.createdAt) - Date.parse(x.createdAt));
}

/** { count, items (max 50) } */
export async function computeNeedsYou(userDbId, now = Date.now()) {
  const all = await deriveNeedsYou(userDbId, now);
  return { count: all.length, items: all.slice(0, MAX_ITEMS) };
}
