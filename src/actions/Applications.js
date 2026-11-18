"use server";

import { z } from "zod";
import { db } from "@/lib/prisma";
import { withAiAction } from "@/lib/ai/action";
import { safeErr } from "@/lib/utils";
import { fail, requireUser, NO_PROFILE_MSG, APPLICATION_SELECT, iso } from "@/lib/jobs/common";
import { normalizePipeline } from "@/lib/jobs/pipeline";
import { pruneDeleted } from "@/lib/softDelete";
import {
  DAY_MS, FOLLOW_UP_DAYS, MAX_FOLLOW_UPS, STATUSES, followUpDueAt, gapSteps, parseDateInput, publicApplication, uniqueSkills,
} from "@/lib/applications/derive";
import { computeNeedsYou } from "@/lib/applications/needsYou";
import { generateOpenQuestions } from "@/actions/Practice";

const idSchema = z.string().trim().min(1).max(100);
const statusSchema = z.enum(STATUSES);
const MAX_GAP_TASKS = 10;
const CAS_TRIES = 5;
const MAX_LIST = 200;

const APP_INCLUDE = { job: { select: { id: true, title: true, company: true, location: true, url: true, jdText: true } } };

/** The caller's application (not deleted, job not deleted) with its job. */
async function loadApp(id, userDbId) {
  return db.application.findFirst({ where: { id, userId: userDbId, deletedAt: null, job: { deletedAt: null } }, include: APP_INCLUDE });
}

const freshApplication = (id, userDbId) => db.application.findFirst({ where: { id, userId: userDbId, deletedAt: null }, select: APPLICATION_SELECT });
const outApplication = (a) => ({
  id: a.id, status: a.status, appliedAt: iso(a.appliedAt), interviewAt: iso(a.interviewAt), nextActionAt: iso(a.nextActionAt),
  followUpCount: a.followUpCount ?? 0, closedReason: a.closedReason ?? null,
});

/** Opens a request: input check, then the caller. Returns { err } or { user }. */
async function begin(rawId) {
  const { user } = await requireUser(); // signed-out THROWS Error("Unauthorized")
  const id = idSchema.safeParse(rawId);
  if (!id.success) return { err: fail("INVALID", "Missing application id.") };
  if (!user) return { err: fail("NOT_FOUND", NO_PROFILE_MSG) };
  return { user, id: id.data };
}

const NOT_FOUND_APP = () => fail("NOT_FOUND", "We couldn't find that application.");

// ---------------------------------------------------------------------------------------------------------
// Needs you

/**
 * Everything waiting for the user, derived from existing rows (nothing is stored but the lazy follow-up date):
 * { count, items: NeedsYouItem[] (max 50, newest first) } or { error, code }. See API-CONTRACT 11.5.
 */
export async function getNeedsYou() {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  try {
    return await computeNeedsYou(user.id);
  } catch (error) {
    console.error("getNeedsYou failed:", safeErr(error));
    return fail("FAILED", "We couldn't load your list. Please try again.");
  }
}

const approveSchema = z.object({ step: z.enum(["CHECKER", "TAILOR", "WRITER", "CONNECTOR"]) });

/**
 * Marks one pipeline output as reviewed (it leaves "needs you"). TAILOR | WRITER | CONNECTOR clear `needsYou`;
 * CHECKER dismisses the ATS fix suggestion. Idempotent. Nothing is applied or sent. Returns { success: true } or { error, code }.
 */
export async function approveNeedsYou(applicationId, step) {
  const b = await begin(applicationId);
  if (b.err) return b.err;
  const s = approveSchema.safeParse({ step });
  if (!s.success) return fail("INVALID", "Unknown step.");
  try {
    for (let i = 0; i < CAS_TRIES; i++) {
      const app = await loadApp(b.id, b.user.id);
      if (!app) return NOT_FOUND_APP();
      const p = normalizePipeline(app.pipeline);
      const st = p.steps[s.data.step];
      if (s.data.step === "CHECKER") {
        if (st.fixDismissed === true) return { success: true };
        st.fixDismissed = true;
      } else {
        if (st.needsYou !== true) return { success: true };
        st.needsYou = false;
      }
      const res = await db.application.updateMany({
        where: { id: app.id, userId: b.user.id, deletedAt: null, updatedAt: app.updatedAt },
        data: { pipeline: p },
      });
      if (res.count === 1) return { success: true };
    }
    return fail("FAILED", "We couldn't save that. Please try again.");
  } catch (error) {
    console.error("approveNeedsYou failed:", safeErr(error));
    return fail("FAILED", "We couldn't save that. Please try again.");
  }
}

// ---------------------------------------------------------------------------------------------------------
// Status changes

/** Column values for moving `app` to `status` (also used by Undo, which calls it with the previous status). */
function statusData(app, status, now) {
  const data = { status };
  if (status !== "CLOSED") Object.assign(data, { closedAt: null, closedReason: null });
  switch (status) {
    case "SAVED":
      Object.assign(data, { appliedAt: null, nextActionAt: null });
      break;
    case "APPLIED": {
      const appliedAt = app.status === "SAVED" || !app.appliedAt ? now : app.appliedAt;
      data.appliedAt = appliedAt;
      if (app.status !== "APPLIED") {
        data.nextActionAt = (app.followUpCount ?? 0) < MAX_FOLLOW_UPS ? new Date(appliedAt.getTime() + FOLLOW_UP_DAYS * DAY_MS) : null;
      }
      break;
    }
    case "CLOSED":
      Object.assign(data, { closedAt: now, nextActionAt: null });
      break;
    default: // INTERVIEWING, OFFER: no follow-up is owed any more
      data.nextActionAt = null;
  }
  return data;
}

async function changeStatus(app, userDbId, status, extra = {}) {
  const data = { ...statusData(app, status, new Date()), ...extra };
  const res = await db.application.updateMany({ where: { id: app.id, userId: userDbId, deletedAt: null }, data });
  if (res.count === 0) return null;
  return freshApplication(app.id, userDbId);
}

/**
 * Moves an application to a status. Returns { application, previousStatus }: call it again with previousStatus
 * to Undo. Errors: INVALID | NOT_FOUND | FAILED.
 */
export async function setApplicationStatus(id, status) {
  const b = await begin(id);
  if (b.err) return b.err;
  const st = statusSchema.safeParse(status);
  if (!st.success) return fail("INVALID", "Choose Saved, Applied, Interviewing, Offer or Closed.");
  try {
    const app = await loadApp(b.id, b.user.id);
    if (!app) return NOT_FOUND_APP();
    if (app.status === st.data) return { application: outApplication(app), previousStatus: app.status };
    const fresh = await changeStatus(app, b.user.id, st.data);
    if (!fresh) return NOT_FOUND_APP();
    return { application: outApplication(fresh), previousStatus: app.status };
  } catch (error) {
    console.error("setApplicationStatus failed:", safeErr(error));
    return fail("FAILED", "We couldn't update that application. Please try again.");
  }
}

/** One tap "I applied": APPLIED + appliedAt (the follow-up clock starts). Same return shape as setApplicationStatus. */
export async function markApplied(id) {
  return setApplicationStatus(id, "APPLIED");
}

const dateSchema = z.string().trim().min(8).max(40);

/**
 * "I got an interview": sets INTERVIEWING + interviewAt (date-only input is stored as 00:00 UTC of that day)
 * and creates (or keeps) the interview prep session from the job description (ONE cap-counted action; the
 * date is saved even if prep fails). Returns { application, previousStatus, prepSessionId: string | null, prepError? }.
 */
export async function setInterviewDate(id, date) {
  return withAiAction(() => setInterviewDateImpl(id, date));
}

async function setInterviewDateImpl(id, date) {
  const b = await begin(id);
  if (b.err) return b.err;
  const d = dateSchema.safeParse(date);
  const when = d.success ? parseDateInput(d.data) : null;
  const now = Date.now();
  if (!when || when.getTime() < now - 365 * DAY_MS || when.getTime() > now + 2 * 365 * DAY_MS) {
    return fail("INVALID", "Choose a valid interview date.");
  }
  try {
    const app = await loadApp(b.id, b.user.id);
    if (!app) return NOT_FOUND_APP();
    let fresh = await changeStatus(app, b.user.id, "INTERVIEWING", { interviewAt: when });
    if (!fresh) return NOT_FOUND_APP();

    const prep = await ensurePrep(app, b.user.id);
    if (prep.sessionId && prep.sessionId !== app.prepSessionId) fresh = (await freshApplication(app.id, b.user.id)) ?? fresh;
    return {
      application: outApplication(fresh),
      previousStatus: app.status,
      prepSessionId: prep.sessionId,
      ...(prep.sessionId ? {} : { prepError: prep.code }),
    };
  } catch (error) {
    console.error("setInterviewDate failed:", safeErr(error));
    return fail("FAILED", "We couldn't save the interview date. Please try again.");
  }
}

/** Keeps a prep session that still exists, otherwise creates one from the job description and links it. */
async function ensurePrep(app, userDbId) {
  if (app.prepSessionId) {
    const existing = await db.quizSession.findFirst({ where: { id: app.prepSessionId, userId: userDbId }, select: { id: true } });
    if (existing) return { sessionId: existing.id };
  }
  const jd = String(app.job?.jdText ?? "").slice(0, 20000);
  const r = await generateOpenQuestions({ jobDescription: jd });
  if (!r || r.error || !r.sessionId) return { sessionId: null, code: r?.code ?? "FAILED" };
  await db.application.updateMany({ where: { id: app.id, userId: userDbId, deletedAt: null }, data: { prepSessionId: r.sessionId } });
  return { sessionId: r.sessionId };
}

/**
 * Retry for the PREP_INTERVIEW item when setInterviewDate could not create the session (one cap-counted
 * action). Returns { prepSessionId } or { error, code }.
 */
export async function createInterviewPrep(applicationId) {
  return withAiAction(async () => {
    const b = await begin(applicationId);
    if (b.err) return b.err;
    try {
      const app = await loadApp(b.id, b.user.id);
      if (!app) return NOT_FOUND_APP();
      const prep = await ensurePrep(app, b.user.id);
      if (!prep.sessionId) return fail(prep.code, "We couldn't create your interview practice right now. Please try again.");
      return { prepSessionId: prep.sessionId };
    } catch (error) {
      console.error("createInterviewPrep failed:", safeErr(error));
      return fail("FAILED", "We couldn't create your interview practice right now. Please try again.");
    }
  });
}

// ---------------------------------------------------------------------------------------------------------
// Follow-up draft (only on click, never sent)

const plainDate = (d) => new Date(d).toISOString().slice(0, 10);

/**
 * The user clicked a FOLLOW_UP item: writes ONE cold email draft (no recipient, nothing is sent) from facts
 * the user already has (company, role, the date they applied), no AI. Counts a follow-up (max 2) and moves the
 * next one 5 days out. Returns { coldEmailId, href, followUpCount } or { error, code: INVALID | NOT_FOUND | NOT_DUE | FAILED }.
 */
export async function createFollowUpDraft(applicationId) {
  const b = await begin(applicationId);
  if (b.err) return b.err;
  try {
    const app = await loadApp(b.id, b.user.id);
    if (!app) return NOT_FOUND_APP();
    const now = Date.now();
    const due = followUpDueAt(app);
    if (!due || due.getTime() > now) return fail("NOT_DUE", "There's no follow-up due for this application yet.");

    // Claim the follow-up first (compare-and-swap on the count) so a double click writes one draft.
    const count = app.followUpCount ?? 0;
    const claim = await db.application.updateMany({
      where: { id: app.id, userId: b.user.id, deletedAt: null, status: "APPLIED", followUpCount: count },
      data: { followUpCount: count + 1, nextActionAt: count + 1 < MAX_FOLLOW_UPS ? new Date(now + FOLLOW_UP_DAYS * DAY_MS) : null },
    });
    if (claim.count === 0) return fail("NOT_DUE", "There's no follow-up due for this application yet.");

    const company = app.job?.company || "";
    const role = app.job?.title || "";
    const target = [role && `the ${role} role`, company && `at ${company}`].filter(Boolean).join(" ") || "the role I applied for";
    const body = `I applied for ${target}${app.appliedAt ? ` on ${plainDate(app.appliedAt)}` : ""} and wanted to follow up on my application. I'm still very interested and would be glad to share anything else that would help.`;
    const content = ["Hi there,", body, "Thank you for your time.", "Best regards"].join("\n\n");
    const snap = (id, kind, label, text) => ({ id, kind, label, excerpt: text });
    const jobSources = [company && snap("job:company", "job", "Job: company", company), role && snap("job:title", "job", "Job: title", role)].filter(Boolean);
    try {
      const row = await db.coldEmail.create({
        data: {
          userId: b.user.id,
          jobId: app.jobId,
          content,
          companyName: company,
          jobTitle: role,
          status: "draft",
          subject: `Following up on ${role ? `the ${role} role` : "my application"}${company ? ` at ${company}` : ""}`.slice(0, 200),
          // Template text built only from the user's own job record; no AI, no recipient (D34).
          sources: {
            version: 1,
            template: "follow_up",
            paragraphs: [
              { kind: "greeting", sources: [] },
              { kind: "body", sources: jobSources },
              { kind: "body", sources: [] },
              { kind: "closing", sources: [] },
            ],
          },
        },
        select: { id: true },
      });
      return { coldEmailId: row.id, href: `/cold-email/${row.id}`, followUpCount: count + 1 };
    } catch (err) {
      // Give the follow-up back so the user can click again.
      await db.application.updateMany({ where: { id: app.id, userId: b.user.id, followUpCount: count + 1 }, data: { followUpCount: count, nextActionAt: due } }).catch(() => {});
      throw err;
    }
  } catch (error) {
    console.error("createFollowUpDraft failed:", safeErr(error));
    return fail("FAILED", "We couldn't write the follow-up. Please try again.");
  }
}

// ---------------------------------------------------------------------------------------------------------
// Closing: ATS gaps become roadmap tasks (no AI)

const closeSchema = z.string().trim().max(300);

/**
 * Closes an application (reason 0-300 chars). The missing skills of THIS job's ATS results (not deleted) are
 * added once (gapTasksAddedAt) as tasks of the user's most recently updated active roadmap. Deterministic.
 * Returns { application, previousStatus, tasksAdded } or { error, code }. No active roadmap: tasksAdded is 0.
 */
export async function closeApplication(id, reason) {
  const b = await begin(id);
  if (b.err) return b.err;
  const r = closeSchema.safeParse(reason ?? "");
  if (!r.success) return fail("INVALID", "Keep the reason under 300 characters.");
  try {
    const app = await loadApp(b.id, b.user.id);
    if (!app) return NOT_FOUND_APP();
    const fresh = await changeStatus(app, b.user.id, "CLOSED", { closedReason: r.data || null });
    if (!fresh) return NOT_FOUND_APP();

    let tasksAdded = 0;
    try {
      tasksAdded = await addGapTasks(app, b.user.id);
    } catch (err) {
      console.error("gap tasks failed:", safeErr(err)); // the application is closed either way
    }
    return { application: outApplication((await freshApplication(app.id, b.user.id)) ?? fresh), previousStatus: app.status, tasksAdded };
  } catch (error) {
    console.error("closeApplication failed:", safeErr(error));
    return fail("FAILED", "We couldn't close that application. Please try again.");
  }
}

async function addGapTasks(app, userDbId) {
  if (app.gapTasksAddedAt) return 0;
  const path = await db.careerPath.findFirst({ where: { userId: userDbId, status: "active" }, orderBy: { updatedAt: "desc" } });
  if (!path) return 0; // NO_ROADMAP: not an error; a later close can still add them
  const scores = await db.aTSScore.findMany({
    where: { userId: userDbId, jobId: app.jobId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { missingSkills: true },
  });
  const skills = uniqueSkills(scores.map((s) => s.missingSkills), MAX_GAP_TASKS);

  // Claim once (compare-and-swap on gapTasksAddedAt) so a double close adds nothing twice.
  const claim = await db.application.updateMany({ where: { id: app.id, userId: userDbId, gapTasksAddedAt: null }, data: { gapTasksAddedAt: new Date() } });
  if (claim.count === 0) return 0;
  if (skills.length === 0) return 0;

  try {
    for (let i = 0; i < CAS_TRIES; i++) {
      const cur = i === 0 ? path : await db.careerPath.findFirst({ where: { id: path.id, userId: userDbId } });
      if (!cur) break;
      const steps = Array.isArray(cur.steps) ? cur.steps : [];
      const added = gapSteps(skills, steps, { company: app.job?.company, title: app.job?.title, jobId: app.jobId });
      if (added.length === 0) return 0;
      const all = [...steps, ...added];
      const progress = (all.filter((s) => s && s.completed).length / all.length) * 100;
      const res = await db.careerPath.updateMany({
        where: { id: cur.id, userId: userDbId, updatedAt: cur.updatedAt },
        data: { steps: all, progress },
      });
      if (res.count === 1) return added.length;
    }
  } catch (err) {
    console.error("gap tasks save failed:", safeErr(err));
  }
  // Could not save: release the claim so the next close tries again.
  await db.application.updateMany({ where: { id: app.id, userId: userDbId }, data: { gapTasksAddedAt: null } }).catch(() => {});
  return 0;
}

// ---------------------------------------------------------------------------------------------------------
// Board

/**
 * All the caller's applications (not deleted), newest activity first, for the board and home:
 * { applications: [{ id, status, job:{id,company,title,location,url}, appliedAt, interviewAt, nextActionAt,
 *   nextAction:{label,href}|null, updatedAt }] } or { error, code }.
 */
export async function getApplications() {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  try {
    await pruneDeleted(user.id);
    const rows = await db.application.findMany({
      where: { userId: user.id, deletedAt: null, job: { deletedAt: null } },
      orderBy: { updatedAt: "desc" },
      take: MAX_LIST,
      include: { job: { select: { id: true, title: true, company: true, location: true, url: true } } },
    });
    return { applications: rows.map((r) => publicApplication(r)) };
  } catch (error) {
    console.error("getApplications failed:", safeErr(error));
    return fail("FAILED", "We couldn't load your applications. Please try again.");
  }
}
