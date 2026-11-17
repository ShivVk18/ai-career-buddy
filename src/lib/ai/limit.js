// Per-user daily AI cap (D21). Counts today's AiUsage rows (UTC day) for a user.
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
 * Returns "ok" | "over" | "unavailable".
 * "unavailable" only in production when usage can't be read (D33); dev fails open with a warning.
 */
export async function checkDailyLimit(userId) {
  const limit = getDailyLimit();
  if (!limit || !userId) return "ok";
  try {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const used = await db.aiUsage.count({ where: { userId, createdAt: { gte: start } } });
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
