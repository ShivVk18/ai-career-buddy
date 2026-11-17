// One id per user action (D50). Every runAI call made inside withAiAction() shares the same actionId,
// and the daily cap is checked once, lazily, right before the first call of the action.
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

const storage = new AsyncLocalStorage();

/**
 * Run `fn` as ONE user action. Nested withAiAction calls join the outer action (same id).
 * Call it once at the entry of each AI-using server action / route.
 */
export function withAiAction(fn) {
  if (storage.getStore()) return fn();
  return storage.run({ actionId: randomUUID(), capChecked: false }, fn);
}

/** Current action context ({ actionId, capChecked }) or undefined outside withAiAction. */
export const currentAiAction = () => storage.getStore();
