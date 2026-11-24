// State helpers for the resumable job pipeline (D57). Pure: no I/O, safe to unit test.
// Application.pipeline JSON:
//   { v: 1,
//     run: { actionId, capChecked, startedAt, finishedAt? },          // ONE actionId for the whole run (D50)
//     steps: { CHECKER|TAILOR|WRITER|CONNECTOR: { status, claimId?, startedAt?, finishedAt?, reason?,
//                                                 error?: { code, error }, output?, ids?, needsYou? } } }
export const STEPS = ["CHECKER", "TAILOR", "WRITER", "CONNECTOR"];
export const STALE_CLAIM_MS = 3 * 60 * 1000; // a "running" claim older than this can be taken over
export const TERMINAL = new Set(["done", "skipped"]);

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

/** Always returns a well-formed pipeline object (tolerates null / junk). */
export function normalizePipeline(raw) {
  const src = isObj(raw) ? raw : {};
  const steps = {};
  for (const s of STEPS) steps[s] = isObj(src.steps?.[s]) ? { ...src.steps[s] } : { status: "pending" };
  return { v: 1, run: isObj(src.run) ? { ...src.run } : null, steps };
}

const claimIsFresh = (st, now) => st.status === "running" && now - Date.parse(st.startedAt ?? 0) < STALE_CLAIM_MS;

/**
 * What to do next: { step } to run (pending, failed or a stale claim), { busy: true } when another tab holds a
 * fresh claim on the next step, or { complete: true } when every step is done or skipped.
 */
export function nextStep(pipeline, now = Date.now()) {
  for (const s of STEPS) {
    const st = pipeline.steps[s];
    if (TERMINAL.has(st.status)) continue;
    if (claimIsFresh(st, now)) return { busy: true, step: s };
    return { step: s };
  }
  return { complete: true };
}

/** Failed-step error for the browser: { code, error, retryAfterSec } (seconds still to wait, 0 = retry now). */
export function publicError(st, now = Date.now()) {
  const e = st.error ?? { code: "FAILED", error: "This step failed. Try again." };
  return { code: e.code, error: e.error, retryAfterSec: retryWaitSec(st, now) };
}

/** Browser shape. A stale "running" claim is shown as "pending" (call runNextStep again). */
export function publicPipeline(app, pipelineRaw, now = Date.now()) {
  const p = normalizePipeline(pipelineRaw);
  const steps = STEPS.map((s) => {
    const st = p.steps[s];
    const status = st.status === "running" && !claimIsFresh(st, now) ? "pending" : st.status;
    return {
      step: s,
      status,
      reason: st.reason ?? null,
      error: status === "failed" ? publicError(st) : null,
      output: st.output ?? null,
      ids: st.ids ?? {},
      needsYou: st.needsYou === true,
      startedAt: st.startedAt ?? null,
      finishedAt: st.finishedAt ?? null,
    };
  });
  const nxt = nextStep(p, now);
  return {
    applicationId: app.id,
    jobId: app.jobId,
    steps,
    next: nxt.complete ? null : nxt.step,
    busy: nxt.busy === true,
    complete: nxt.complete === true,
    completedCount: steps.filter((x) => TERMINAL.has(x.status)).length,
  };
}

export const BACKOFF_BASE_SEC = 30;
export const BACKOFF_MAX_SEC = 600;

/** Wait before the next try: the provider's Retry-After if it sent one, else 30 s doubling per failed attempt (max 10 min). */
export function backoffSec(attempts, providerSec = null) {
  if (Number.isFinite(providerSec) && providerSec > 0) return Math.min(Math.ceil(providerSec), BACKOFF_MAX_SEC);
  return Math.min(BACKOFF_BASE_SEC * 2 ** Math.max(0, attempts - 1), BACKOFF_MAX_SEC);
}

/** Seconds left of a step's backoff (0 when none or elapsed). */
export function retryWaitSec(step, now = Date.now()) {
  if (step?.status !== "failed") return 0;
  const at = Date.parse(step.error?.retryAt ?? "");
  return Number.isFinite(at) && at > now ? Math.ceil((at - now) / 1000) : 0;
}

/** First failed step still inside its backoff: { step, retryAfterSec } or null. */
export function activeBackoff(pipeline, now = Date.now()) {
  for (const s of STEPS) {
    const w = retryWaitSec(pipeline.steps[s], now);
    if (w > 0) return { step: s, retryAfterSec: w };
  }
  return null;
}
