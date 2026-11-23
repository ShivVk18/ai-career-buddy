// Pure helpers for the home screen (no I/O, safe to unit test). Not a "use server" file.
import { normalizePipeline, STEPS, STALE_CLAIM_MS, TERMINAL } from "../jobs/pipeline.js";

export const STAGES = ["dawn", "noon", "sunset", "night"];

/**
 * Progress stage of the whole search, from the statuses of the live (not deleted) applications:
 * night = an offer, sunset = interviewing, noon = applied somewhere, dawn = nothing sent yet.
 */
export function progressStage(statuses) {
  const set = new Set(Array.isArray(statuses) ? statuses : []);
  if (set.has("OFFER")) return "night";
  if (set.has("INTERVIEWING")) return "sunset";
  if (set.has("APPLIED")) return "noon";
  return "dawn";
}

/**
 * Bot status of one application: { state, step, completedCount, total }.
 * state: "running" (fresh claim) | "failed" | "needs_you" (done, waiting for review) | "done" | "idle" (not started / paused).
 */
export function botStatusFor(row, now = Date.now()) {
  const p = normalizePipeline(row.pipeline);
  const sts = STEPS.map((s) => ({ s, ...p.steps[s] }));
  const completedCount = sts.filter((x) => TERMINAL.has(x.status)).length;
  const running = sts.find((x) => x.status === "running" && now - Date.parse(x.startedAt ?? 0) < STALE_CLAIM_MS);
  const base = { completedCount, total: STEPS.length };
  if (running) return { ...base, state: "running", step: running.s };
  const failed = sts.find((x) => x.status === "failed");
  if (failed) return { ...base, state: "failed", step: failed.s };
  if (completedCount === STEPS.length) {
    return { ...base, state: sts.some((x) => x.needsYou === true) ? "needs_you" : "done", step: null };
  }
  if (completedCount === 0 && !p.run) return { ...base, state: "idle", step: null };
  return { ...base, state: "idle", step: sts.find((x) => !TERMINAL.has(x.status))?.s ?? null };
}

/** Roll-up for the home bot strip. */
export function summarizeBots(items) {
  const count = (st) => items.filter((b) => b.state === st).length;
  return {
    running: count("running"),
    failed: count("failed"),
    needsYou: count("needs_you"),
    done: count("done"),
    items,
  };
}
