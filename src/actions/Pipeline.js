"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { currentAiAction, withAiAction } from "@/lib/ai/action";
import { matchText, resumeToText } from "@/lib/match";
import { scoreResume, stripRec } from "@/lib/ats/score";
import { safeErr } from "@/lib/utils";
import { fail, requireUser, NO_PROFILE_MSG } from "@/lib/jobs/common";
import { STEPS, normalizePipeline, nextStep, publicPipeline } from "@/lib/jobs/pipeline";
import { tailorResume } from "@/actions/Resume";
import { generateCoverLetter } from "@/actions/CoverLetter";
import { generateColdEmail } from "@/actions/ColdEmail";

const idSchema = z.string().trim().min(1).max(100);
const CAS_TRIES = 5;
const MIN_RESUME_TEXT = 60;

const APP_INCLUDE = { job: { select: { id: true, title: true, company: true, jdText: true, deletedAt: true } } };

async function loadApp(applicationId, userDbId) {
  const app = await db.application.findFirst({ where: { id: applicationId, userId: userDbId, deletedAt: null }, include: APP_INCLUDE });
  return app && !app.job?.deletedAt ? app : null;
}

/** Compare-and-swap on updatedAt: succeeds only if nobody changed the row since we read it. */
async function casPipeline(app, userDbId, pipeline) {
  const res = await db.application.updateMany({
    where: { id: app.id, userId: userDbId, deletedAt: null, updatedAt: app.updatedAt },
    data: { pipeline },
  });
  return res.count === 1;
}

/** Re-reads and rewrites the pipeline while we still own the claim. false = we lost the claim. */
async function finishStep(applicationId, userDbId, step, claimId, result, capChecked) {
  for (let i = 0; i < CAS_TRIES; i++) {
    const app = await loadApp(applicationId, userDbId);
    if (!app) return false;
    const p = normalizePipeline(app.pipeline);
    if (p.steps[step].claimId !== claimId || p.steps[step].status !== "running") return false;
    const now = new Date().toISOString();
    const { claimId: _drop, ...keep } = p.steps[step];
    p.steps[step] = {
      ...keep,
      status: result.status,
      finishedAt: now,
      reason: result.reason ?? null,
      error: result.status === "failed" ? result.error : null,
      output: result.output ?? null,
      ids: result.ids ?? {},
      needsYou: result.status === "done" && result.needsYou === true,
    };
    if (p.run) {
      if (capChecked) p.run.capChecked = true;
      if (STEPS.every((s) => ["done", "skipped"].includes(p.steps[s].status))) p.run.finishedAt = now;
    }
    if (await casPipeline(app, userDbId, p)) return true;
  }
  return false;
}

const ok = (status, extra = {}) => ({ status, ...extra });
const skipped = (reason) => ok("skipped", { reason });
const failed = (code, error) => ok("failed", { error: { code, error } });
const fromError = (e) => failed(e.code ?? "FAILED", e.error ?? "This step failed. Try again.");

// Step bodies. Each returns { status, output?, ids?, reason?, error?, needsYou? } and never throws for expected cases.

async function stepChecker({ user, job, clerkUserId }) {
  const resume = await db.resume.findUnique({ where: { userId: user.id } });
  const resumeText = resume ? resumeToText(resume).slice(0, 30000) : "";
  if (!resume || resumeText.trim().length < MIN_RESUME_TEXT) {
    return skipped("NO_RESUME");
  }
  const jdText = job.jdText.slice(0, 20000);
  const match = matchText(jdText, resumeText); // no AI, same function computeMatch uses
  const summary = { matchPercent: match.percent, matched: match.matched.slice(0, 12), missing: match.missing.slice(0, 12), termCount: match.termCount };

  // Adopt an ATS score already linked to this job (a crash after creating it, or the user ran the ATS tool for it).
  const existing = await db.aTSScore.findFirst({ where: { userId: user.id, jobId: job.id, deletedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, atsScore: true } });
  if (existing) return ok("done", { output: { ...summary, atsScore: existing.atsScore, atsScoreId: existing.id }, ids: { atsScoreId: existing.id } });

  const scored = await scoreResume({ userId: clerkUserId, resumeText, jobDescription: jdText, jobTitle: job.title ?? "", companyName: job.company ?? "" });
  if (scored.empty) return failed("NO_SOURCES", "We couldn't back the analysis with evidence from your resume and this job description.");
  const { result, raw, evidence } = scored;
  const row = await db.aTSScore.create({
    data: {
      userId: user.id,
      jobId: job.id,
      atsScore: raw.atsScore,
      matchPercentage: raw.matchPercentage,
      strengths: result.strengths.map((x) => x.text),
      weaknesses: result.weaknesses.map((x) => x.text),
      improvements: raw.improvements,
      relevantSkills: raw.relevantSkills,
      missingSkills: raw.missingSkills,
      recommendations: result.recommendations.map(stripRec).map(({ text, ...r }) => r),
      evidence,
      finalSummary: raw.finalSummary,
      analyzedBy: "AI",
      jobTitle: job.title ?? "",
      companyName: job.company ?? "",
      jobDescription: jdText,
    },
    select: { id: true, atsScore: true },
  });
  return ok("done", { output: { ...summary, atsScore: row.atsScore, atsScoreId: row.id }, ids: { atsScoreId: row.id } });
}

const inputFor = (job) => ({ jobTitle: job.title ?? "", companyName: job.company ?? "", jobDescription: job.jdText.slice(0, 20000), jobId: job.id });

async function stepTailor({ user, job }) {
  const existing = await db.resumeVersion.findFirst({ where: { jobId: job.id, resume: { userId: user.id } }, orderBy: { createdAt: "desc" }, select: { id: true } });
  if (existing) return ok("done", { output: { draftId: existing.id, proposalCount: null }, ids: { draftId: existing.id }, needsYou: true });
  const r = await tailorResume(inputFor(job));
  if (r?.error) return r.code === "NOT_FOUND" ? skipped("NO_RESUME") : fromError(r);
  return ok("done", {
    output: { draftId: r.draftId, proposalCount: r.proposals.length, matchPercent: r.matchBefore?.percent ?? null },
    ids: { draftId: r.draftId },
    needsYou: true,
  });
}

async function stepWriter({ user, job }) {
  const existing = await db.coverLetter.findFirst({ where: { userId: user.id, jobId: job.id, deletedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true } });
  if (existing) return ok("done", { output: { coverLetterId: existing.id }, ids: { coverLetterId: existing.id }, needsYou: true });
  const r = await generateCoverLetter(inputFor(job));
  if (r?.error) return fromError(r);
  return ok("done", { output: { coverLetterId: r.id }, ids: { coverLetterId: r.id }, needsYou: true });
}

async function stepConnector({ user, job }) {
  const existing = await db.coldEmail.findFirst({ where: { userId: user.id, jobId: job.id, deletedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true } });
  if (existing) return ok("done", { output: { coldEmailId: existing.id }, ids: { coldEmailId: existing.id }, needsYou: true });
  // D34: no recipient name, role or email is ever passed (or invented). The user adds them by hand.
  const r = await generateColdEmail(inputFor(job));
  if (r?.error) return fromError(r);
  return ok("done", { output: { coldEmailId: r.id }, ids: { coldEmailId: r.id }, needsYou: true });
}

const RUNNERS = { CHECKER: stepChecker, TAILOR: stepTailor, WRITER: stepWriter, CONNECTOR: stepConnector };

const withState = (app, raw, extra = {}) => ({ ...publicPipeline(app, raw), ...extra });

/**
 * Runs the NEXT unfinished step (CHECKER, TAILOR, WRITER, CONNECTOR) of an application's pipeline and stores
 * it in Application.pipeline. Safe to call repeatedly and from several tabs:
 *  - a finished step (done or skipped) is never run again, so nothing is duplicated;
 *  - the step is claimed with a compare-and-swap on the row; a second caller gets `busy: true`;
 *  - a claim older than 3 minutes (closed tab) can be taken over; outputs already linked to the job are adopted.
 * The whole run shares ONE actionId (D50), kept in pipeline.run; the daily cap is checked only until the first
 * AI call of the run passes it.
 * Returns the pipeline (see getPipeline) plus `ran: step | null`, or the same plus `{ error, code, step }` when
 * the step failed (it stays "failed" and the next call retries it), or `{ error, code }` for INVALID | NOT_FOUND.
 */
export async function runNextStep(applicationId) {
  const { clerkUserId, user } = await requireUser();
  const id = idSchema.safeParse(applicationId);
  if (!id.success) return fail("INVALID", "Missing application id.");
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  try {
    const app = await loadApp(id.data, user.id);
    if (!app) return fail("NOT_FOUND", "We couldn't find that application.");
    const p = normalizePipeline(app.pipeline);
    const nxt = nextStep(p);
    if (nxt.complete) return withState(app, app.pipeline, { ran: null });
    if (nxt.busy) return withState(app, app.pipeline, { ran: null });

    // Claim the step.
    const step = nxt.step;
    const claimId = randomUUID();
    const now = new Date().toISOString();
    p.run = p.run ?? { actionId: randomUUID(), capChecked: false, startedAt: now };
    p.steps[step] = { status: "running", claimId, startedAt: now };
    if (!(await casPipeline(app, user.id, p))) {
      const fresh = (await loadApp(id.data, user.id)) ?? app;
      return withState(fresh, fresh.pipeline, { ran: null, busy: true });
    }

    // Run it inside the run's single action id.
    let result;
    let capChecked = false;
    try {
      const out = await withAiAction(
        async () => {
          const r = await RUNNERS[step]({ user, clerkUserId, job: app.job });
          return { r, capChecked: currentAiAction()?.capChecked === true };
        },
        p.run
      );
      result = out.r;
      capChecked = out.capChecked;
    } catch (e) {
      console.error(`pipeline ${step} failed:`, safeErr(e));
      result =
        e?.code === "AI_LIMIT"
          ? failed("AI_LIMIT", "Daily AI limit reached. Please try again tomorrow.")
          : e?.code === "AI_UNAVAILABLE"
            ? failed("AI_UNAVAILABLE", "AI is temporarily unavailable. Please try again later.")
            : failed("FAILED", "This step failed. Please try again.");
    }
    await finishStep(app.id, user.id, step, claimId, result, capChecked);
    const after = (await loadApp(id.data, user.id)) ?? app;
    const state = withState(after, after.pipeline, { ran: step });
    return result.status === "failed" ? { ...state, error: result.error.error, code: result.error.code, step } : state;
  } catch (error) {
    console.error("runNextStep failed:", safeErr(error));
    return fail("FAILED", "We couldn't run the next step. Please try again.");
  }
}

/**
 * Read-only status of the four steps for one application:
 * { applicationId, jobId, steps: [{ step, status: pending|running|done|skipped|failed, reason, error, output, ids, needsYou,
 *   startedAt, finishedAt }], next: step | null, busy, complete, completedCount } or { error, code }.
 */
export async function getPipeline(applicationId) {
  const { user } = await requireUser();
  const id = idSchema.safeParse(applicationId);
  if (!id.success) return fail("INVALID", "Missing application id.");
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  try {
    const app = await loadApp(id.data, user.id);
    if (!app) return fail("NOT_FOUND", "We couldn't find that application.");
    return publicPipeline(app, app.pipeline);
  } catch (error) {
    console.error("getPipeline failed:", safeErr(error));
    return fail("FAILED", "We couldn't load the progress. Please try again.");
  }
}
