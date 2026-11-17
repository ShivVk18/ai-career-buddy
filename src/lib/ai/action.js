// One id per user action (D50). Every runAI call made inside withAiAction() shares the same actionId,
// and the daily cap is checked once, lazily, right before the first call of the action.
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

const storage = new AsyncLocalStorage();

/**
 * Run `fn` as ONE user action. Nested withAiAction calls join the outer action (same id).
 * Call it once at the entry of each AI-using server action / route.
 */
export function withAiAction(fn, existing) {
  if (storage.getStore()) return fn();
  // `existing` ({ actionId, capChecked }) lets a multi-request run (the job pipeline, D57) keep ONE actionId
  // across requests, and skip the cap check once the run's first step has passed it (D50).
  const id = typeof existing?.actionId === "string" && existing.actionId ? existing.actionId : randomUUID();
  return storage.run({ actionId: id, capChecked: existing?.capChecked === true }, fn);
}

/** Current action context ({ actionId, capChecked }) or undefined outside withAiAction. */
export const currentAiAction = () => storage.getStore();
