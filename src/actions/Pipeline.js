"use server";

import { z } from "zod";
import { after } from "next/server";
import { db } from "@/lib/prisma";
import { safeErr } from "@/lib/utils";
import { fail, requireUser, NO_PROFILE_MSG } from "@/lib/jobs/common";
import { publicPipeline, normalizePipeline } from "@/lib/jobs/pipeline";
import { pipelineStatus } from "@/lib/jobs/chips";
import { loadApp, runStepFor, advanceRun, isStalled } from "@/lib/jobs/runner";

const idSchema = z.string().trim().min(1).max(100);

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
    const state = await runStepFor({ applicationId: id.data, user, clerkUserId });
    if (!state) return fail("NOT_FOUND", "We couldn't find that application.");
    return state;
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

/**
 * Polling read for the bot UI: { applicationId, jobId, run: idle|running|needs_you|done|failed, completedCount, total,
 * steps: [{ id: "checker"|"tailor"|"writer"|"connector", step, label, task, status, chips: [{ label, value, tone }],
 * ids, needsYou, error, startedAt, finishedAt }] } or { error, code }.
 * Also the resume-on-visit hook: if the run stalled (server restarted, function timed out), it is continued in the
 * background after this response. Failed steps are not retried here (use retryPipeline).
 */
export async function getPipelineStatus(applicationId) {
  const { clerkUserId, user } = await requireUser();
  const id = idSchema.safeParse(applicationId);
  if (!id.success) return fail("INVALID", "Missing application id.");
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  try {
    const app = await loadApp(id.data, user.id);
    if (!app) return fail("NOT_FOUND", "We couldn't find that application.");
    if (isStalled(app)) after(() => advanceRun({ applicationId: app.id, user, clerkUserId }));
    return pipelineStatus(app);
  } catch (error) {
    console.error("getPipelineStatus failed:", safeErr(error));
    return fail("FAILED", "We couldn't load the progress. Please try again.");
  }
}

/**
 * Retry after a failed step (or start a run for an application that has none). Returns at once;
 * the run continues on the server. { started: boolean } or { error, code }.
 */
export async function retryPipeline(applicationId) {
  const { clerkUserId, user } = await requireUser();
  const id = idSchema.safeParse(applicationId);
  if (!id.success) return fail("INVALID", "Missing application id.");
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  try {
    const app = await loadApp(id.data, user.id);
    if (!app) return fail("NOT_FOUND", "We couldn't find that application.");
    const p = normalizePipeline(app.pipeline);
    const hasWork = Object.values(p.steps).some((s) => !["done", "skipped"].includes(s.status));
    if (!hasWork) return { started: false };
    after(() => advanceRun({ applicationId: app.id, user, clerkUserId }));
    return { started: true };
  } catch (error) {
    console.error("retryPipeline failed:", safeErr(error));
    return fail("FAILED", "We couldn't restart that. Please try again.");
  }
}
