// Pipeline engine (checker -> tailor -> writer -> connector). Plain module: no session needed, so the
// server runner (after(), resume-on-visit, cron) and the browser actions share one code path.
import { randomUUID } from "node:crypto";
import { db } from "@/lib/prisma";
import { currentAiAction, withAiAction } from "@/lib/ai/action";
import { resumeToText } from "@/lib/match";
import { scoreResume, stripRec } from "@/lib/ats/score";
import { inventedNumbers } from "@/lib/ai/numberCheck";
import { safeErr } from "@/lib/utils";
import { STEPS, normalizePipeline, nextStep, publicPipeline, TERMINAL, backoffSec, activeBackoff } from "@/lib/jobs/pipeline";
import { runAsUser } from "@/lib/runAsUser";
import { createNotification } from "@/lib/notifications/create";
import { tailorResume } from "@/actions/Resume";
import { generateCoverLetter } from "@/actions/CoverLetter";
import { generateColdEmail } from "@/actions/ColdEmail";

const CAS_TRIES = 5;
const MIN_RESUME_TEXT = 60;

export const APP_INCLUDE = { job: { select: { id: true, title: true, company: true, jdText: true, deletedAt: true } } };

export async function loadApp(applicationId, userDbId) {
  const app = await db.application.findFirst({ where: { id: applicationId, userId: userDbId, deletedAt: null }, include: APP_INCLUDE });
  return app && !app.job?.deletedAt ? app : null;
}

/** Compare-and-swap on updatedAt: succeeds only if nobody changed the row since we read it. */
export async function casPipeline(app, userDbId, pipeline) {
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
    const attempts = result.status === "failed" ? (keep.attempts ?? 0) + 1 : 0;
    let error = result.status === "failed" ? result.error : null;
    if (error && (error.code === "RATE_LIMITED" || error.code === "PROVIDER_DOWN")) {
      const sec = backoffSec(attempts, error.providerRetryAfterSec);
      const { providerRetryAfterSec: _p, ...rest } = error;
      error = { ...rest, retryAfterSec: sec, retryAt: new Date(Date.now() + sec * 1000).toISOString() };
    } else if (error) {
      const { providerRetryAfterSec: _p, ...rest } = error;
      error = rest;
    }
    p.steps[step] = {
      ...keep,
      attempts,
      status: result.status,
      finishedAt: now,
      reason: result.reason ?? null,
      error,
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
const failed = (code, error, extra = {}) => ok("failed", { error: { code, error, ...extra } });
const fromError = (e) => failed(e.code ?? "FAILED", e.error ?? "This step failed. Try again.");

const RATE_MSG = "The AI service is busy right now. We'll be able to retry shortly.";
const DOWN_MSG = "The AI service is temporarily unavailable. Please try again in a moment.";

/** Maps a provider outage (AI_UNAVAILABLE) to RATE_LIMITED or PROVIDER_DOWN using what runAI noted; other codes pass through. */
function classifyFailure(result, lastFailure) {
  if (result.status !== "failed" || result.error?.code !== "AI_UNAVAILABLE") return result;
  const limited = lastFailure?.rateLimited === true;
  return failed(limited ? "RATE_LIMITED" : "PROVIDER_DOWN", limited ? RATE_MSG : DOWN_MSG, { providerRetryAfterSec: lastFailure?.retryAfterSec ?? null });
}

// Step bodies. Each returns { status, output?, ids?, reason?, error?, needsYou? } and never throws for expected cases.

async function stepChecker({ user, job, authUserId }) {
  const resume = await db.resume.findUnique({ where: { userId: user.id, deletedAt: null } });
  const resumeText = resume ? resumeToText(resume).slice(0, 30000) : "";
  if (!resume || resumeText.trim().length < MIN_RESUME_TEXT) {
    return skipped("NO_RESUME");
  }
  const jdText = job.jdText.slice(0, 20000);
  // Match %, ATS score and gaps all come from the ONE ATS analysis (never the keyword matcher), so the chips agree.
  const summaryOf = (a) => ({
    source: "ats",
    matchPercent: Number.isFinite(a.matchPercentage) ? Math.round(a.matchPercentage) : null,
    matched: Array.isArray(a.relevantSkills) ? a.relevantSkills.slice(0, 12) : [],
    missing: Array.isArray(a.missingSkills) ? a.missingSkills.slice(0, 12) : null,
  });

  // Adopt an ATS score already linked to this job (a crash after creating it, or the user ran the ATS tool for it).
  const existing = await db.aTSScore.findFirst({ where: { userId: user.id, jobId: job.id, deletedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, atsScore: true, matchPercentage: true, relevantSkills: true, missingSkills: true } });
  if (existing) return ok("done", { output: { ...summaryOf(existing), atsScore: existing.atsScore, atsScoreId: existing.id }, ids: { atsScoreId: existing.id } });

  const scored = await scoreResume({ userId: authUserId, resumeText, jobDescription: jdText, jobTitle: job.title ?? "", companyName: job.company ?? "" });
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
    select: { id: true, atsScore: true, matchPercentage: true, relevantSkills: true, missingSkills: true },
  });
  return ok("done", { output: { ...summaryOf(row), atsScore: row.atsScore, atsScoreId: row.id }, ids: { atsScoreId: row.id } });
}

const inputFor = (job) => ({ jobTitle: job.title ?? "", companyName: job.company ?? "", jobDescription: job.jdText.slice(0, 20000), jobId: job.id });

async function stepTailor({ user, job }) {
  const existing = await db.resumeVersion.findFirst({ where: { jobId: job.id, resume: { userId: user.id } }, orderBy: { createdAt: "desc" }, select: { id: true } });
  if (existing) return ok("done", { output: { draftId: existing.id, proposalCount: null, inventedCount: null }, ids: { draftId: existing.id }, needsYou: true });
  const r = await tailorResume(inputFor(job));
  if (r?.error) return r.code === "NOT_FOUND" ? skipped("NO_RESUME") : fromError(r);
  // numberCheck again on what we are about to show: numbers in a rewrite must come from the bullet or the job text.
  const inventedCount = r.proposals.reduce((n, p) => n + inventedNumbers(String(p.proposed ?? ""), `${p.original ?? ""}\n${job.jdText}`).length, 0);
  return ok("done", {
    output: { draftId: r.draftId, proposalCount: r.proposals.length, inventedCount, matchPercent: r.matchBefore?.percent ?? null },
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
 * Claims and runs the NEXT unfinished step. Needs no session: callers pass the verified user.
 * Returns the pipeline state plus `ran: step | null` (and `error`, `code`, `step` when the step failed), `busy: true`
 * when another worker holds a fresh claim, or null when the application is gone.
 */
export async function runStepFor({ applicationId, user, authUserId }) {
  const app = await loadApp(applicationId, user.id);
  if (!app) return null;
  const p = normalizePipeline(app.pipeline);
  const nxt = nextStep(p);
  if (nxt.complete || nxt.busy) return withState(app, app.pipeline, { ran: null, busy: nxt.busy === true });

  // A provider failure sets a backoff; do not burn another call until it has elapsed.
  const wait = activeBackoff(p);
  if (wait) {
    const e = p.steps[wait.step].error;
    return { ...withState(app, app.pipeline, { ran: null }), error: e.error, code: "RATE_LIMITED", retryAfterSec: wait.retryAfterSec, step: wait.step };
  }

  const step = nxt.step;
  const claimId = randomUUID();
  const now = new Date().toISOString();
  p.run = p.run ?? { actionId: randomUUID(), capChecked: false, startedAt: now };
  if (p.run.finishedAt) delete p.run.finishedAt; // retry after a failure re-opens the run
  p.steps[step] = { status: "running", claimId, startedAt: now, attempts: p.steps[step].attempts ?? 0 };
  if (!(await casPipeline(app, user.id, p))) {
    const fresh = (await loadApp(applicationId, user.id)) ?? app;
    return withState(fresh, fresh.pipeline, { ran: null, busy: true });
  }

  let result;
  let capChecked = false;
  let failure = null;
  try {
    const out = await runAsUser(authUserId, () =>
      withAiAction(
        async () => {
          const ctx = currentAiAction();
          try {
            const r = await RUNNERS[step]({ user, authUserId, job: app.job });
            return { r: classifyFailure(r, ctx?.lastFailure), capChecked: ctx?.capChecked === true };
          } finally {
            failure = ctx?.lastFailure ?? null; // also when the step throws
          }
        },
        p.run
      )
    );
    result = out.r;
    capChecked = out.capChecked;
  } catch (e) {
    console.error(`pipeline ${step} failed:`, safeErr(e));
    result =
      e?.code === "AI_LIMIT"
        ? failed("AI_LIMIT", "Daily AI limit reached. Please try again tomorrow.")
        : e?.code === "AI_UNAVAILABLE"
          ? classifyFailure(failed("AI_UNAVAILABLE", ""), failure)
          : failed("FAILED", "This step failed. Please try again.");
  }
  await finishStep(app.id, user.id, step, claimId, result, capChecked);
  const after = (await loadApp(applicationId, user.id)) ?? app;
  const state = withState(after, after.pipeline, { ran: step });
  if (result.status !== "failed") return state;
  const retryAfterSec = state.steps.find((x) => x.step === step)?.error?.retryAfterSec;
  return { ...state, error: result.error.error, code: result.error.code, step, ...(retryAfterSec > 0 ? { retryAfterSec } : {}) };
}

const hasFailed = (p) => STEPS.some((s) => p.steps[s].status === "failed");

/**
 * Exactly-once in-app notification per outcome (done / failed): the CAS on run.notified decides who writes it.
 * Safe to call after every step; does nothing until the run is complete or a step failed.
 */
export async function notifyIfSettled({ applicationId, user }) {
  for (let i = 0; i < CAS_TRIES; i++) {
    const app = await loadApp(applicationId, user.id);
    if (!app) return null;
    const p = normalizePipeline(app.pipeline);
    const failedStep = STEPS.find((s) => p.steps[s].status === "failed");
    const complete = STEPS.every((s) => TERMINAL.has(p.steps[s].status));
    const outcome = failedStep ? "failed" : complete ? "done" : null;
    if (!outcome || !p.run || p.run.notified === outcome) return null;
    p.run.notified = outcome;
    if (!(await casPipeline(app, user.id, p))) continue; // someone else changed the row; re-read
    const who = [app.job?.title, app.job?.company].filter(Boolean).join(" at ") || "your job";
    const needsYou = STEPS.some((s) => p.steps[s].needsYou === true);
    await createNotification(user.id, {
      type: outcome === "done" ? "pipeline_done" : "pipeline_failed",
      title: outcome === "done" ? `Your drafts for ${who} are ready` : `A step stopped for ${who}`,
      body:
        outcome === "done"
          ? needsYou ? "Review the tailored resume, cover letter and email before anything is sent." : "Your application checks finished."
          : p.steps[failedStep].error?.error ?? "Open the job to retry.",
      href: `/jobs/${app.jobId}`,
    });
    return outcome;
  }
  return null;
}

const RUN_BUDGET_MS = 240 * 1000; // stop starting new steps after this; the next visit or the cron continues

/**
 * Drives one application's pipeline forward until it is complete, a step fails (not retried automatically),
 * another worker holds the claim, or the time budget is spent. Idempotent: finished steps never run again.
 * Never throws.
 */
export async function advanceRun({ applicationId, user, authUserId, budgetMs = RUN_BUDGET_MS }) {
  const started = Date.now();
  try {
    for (let i = 0; i < STEPS.length + 1; i++) {
      if (Date.now() - started > budgetMs) break;
      const r = await runStepFor({ applicationId, user, authUserId });
      if (!r || r.busy || r.complete || r.ran === null || r.error) break;
    }
    return await notifyIfSettled({ applicationId, user });
  } catch (e) {
    console.error("advanceRun failed:", safeErr(e));
    return null;
  }
}

export const RESUME_AFTER_MS = 30 * 1000; // a run untouched this long with work left is "stalled"

/** True when the run was started, has work left, nothing failed, and nobody holds a fresh claim. */
export function isStalled(app, now = Date.now()) {
  const p = normalizePipeline(app.pipeline);
  if (!p.run || hasFailed(p)) return false;
  const nxt = nextStep(p, now);
  if (nxt.complete || nxt.busy) return false;
  return now - new Date(app.updatedAt).getTime() > RESUME_AFTER_MS;
}

/** Continues this user's stalled runs (resume-on-visit). Call inside after(). Never throws. */
export async function resumeStalledForUser({ user, authUserId, limit = 3 }) {
  try {
    const apps = await db.application.findMany({
      where: { userId: user.id, deletedAt: null, job: { deletedAt: null }, pipeline: { not: null }, status: { not: "CLOSED" } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, updatedAt: true, pipeline: true },
    });
    const todo = apps.filter((a) => isStalled(a)).slice(0, limit);
    for (const a of todo) await advanceRun({ applicationId: a.id, user, authUserId });
    return todo.length;
  } catch (e) {
    console.error("resumeStalledForUser failed:", safeErr(e));
    return 0;
  }
}

/** Cron: stalled runs across all users (needs no session). Returns how many it advanced. */
export async function resumeStalledAll({ limit = 10 } = {}) {
  const cutoff = new Date(Date.now() - RESUME_AFTER_MS);
  // Only runs that were started and never finished (JSON filter in SQL so finished runs never crowd the scan).
  const ids = await db.$queryRaw`
    SELECT "id" FROM "Application"
    WHERE "deletedAt" IS NULL AND "status" <> 'CLOSED' AND "updatedAt" < ${cutoff}
      AND "pipeline" #> '{run}' IS NOT NULL AND "pipeline" #> '{run,finishedAt}' IS NULL
    ORDER BY "updatedAt" ASC LIMIT 200`;
  const rows = await db.application.findMany({
    where: { id: { in: ids.map((r) => r.id) }, job: { deletedAt: null } },
    select: { id: true, updatedAt: true, pipeline: true, user: { select: { id: true, name: true } } },
  });
  const todo = rows.filter((a) => a.user && isStalled(a)).slice(0, limit);
  let n = 0;
  for (const a of todo) {
    await advanceRun({ applicationId: a.id, user: { id: a.user.id, name: a.user.name }, authUserId: a.user.id });
    n++;
  }
  return n;
}
