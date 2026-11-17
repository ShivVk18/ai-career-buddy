// Per-user daily AI cap (D21, D50). Counts today's user ACTIONS (UTC day): distinct AiUsage.actionId,
// plus legacy rows with a null actionId counted individually. Every call is still logged.
// If usage can't be read: fails CLOSED in production (D33), fails open with one warning in dev.
import { db } from "../prisma.js";

let warned = false;

export const DEFAULT_DAILY_LIMIT = 50;

/** Unset, empty or invalid => 50 (D30). "0" => cap disabled (returns null). */
export function getDailyLimit() {
  const n = Number.parseInt(process.env.AI_DAILY_LIMIT ?? "", 10);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_DAILY_LIMIT;
  return n === 0 ? null : n;
}

export const isProduction = () => process.env.NODE_ENV === "production";

/**
 * Distinct actions since `start`. Uses the (userId, createdAt) index; one aggregate, no row transfer.
 * COUNT(DISTINCT) ignores NULLs, so null-actionId (legacy) rows are added back one by one.
 */
export async function countActionsToday(userId, start) {
  const rows = await db.$queryRaw`
    SELECT COUNT(DISTINCT "actionId") + COUNT(*) FILTER (WHERE "actionId" IS NULL) AS used
    FROM "AiUsage"
    WHERE "userId" = ${userId} AND "createdAt" >= ${start}`;
  return Number(rows?.[0]?.used ?? 0);
}

/**
 * Returns "ok" | "over" | "unavailable".
 * "unavailable" only in production when usage can't be read (D33); dev fails open with a warning.
 */
export async function checkDailyLimit(userId) {
  const limit = getDailyLimit();
  if (!limit || !userId) return "ok";
  try {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const used = await countActionsToday(userId, start);
    return used >= limit ? "over" : "ok";
  } catch {
    if (isProduction()) {
      console.error("[ai] daily AI cap is active but AiUsage could not be read; blocking AI call (production)");
      return "unavailable";
    }
    if (!warned) {
      warned = true;
      console.warn("[ai] daily AI cap is active but AiUsage could not be read (migration not applied?); cap skipped (dev)");
    }
    return "ok";
  }
}

/** Returns true when the user is at or over today's limit. */
export async function isOverDailyLimit(userId) {
  return (await checkDailyLimit(userId)) === "over";
}
