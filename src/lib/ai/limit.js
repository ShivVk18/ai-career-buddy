// Per-user daily AI cap (D21). Counts today's AiUsage rows (UTC day) for a user.
// Fails open: if the table is missing or the count fails, the cap is skipped with one warning.
import { db } from "../prisma.js";

let warned = false;

export const DEFAULT_DAILY_LIMIT = 50;

/** Unset, empty or invalid => 50 (D30). "0" => cap disabled (returns null). */
export function getDailyLimit() {
  const n = Number.parseInt(process.env.AI_DAILY_LIMIT ?? "", 10);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_DAILY_LIMIT;
  return n === 0 ? null : n;
}

/** Returns true when the user is at or over today's limit. */
export async function isOverDailyLimit(userId) {
  const limit = getDailyLimit();
  if (!limit || !userId) return false;
  try {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const used = await db.aiUsage.count({ where: { userId, createdAt: { gte: start } } });
    return used >= limit;
  } catch {
    if (!warned) {
      warned = true;
      console.warn("[ai] daily AI cap is active but AiUsage could not be read (migration not applied?); cap skipped");
    }
    return false;
  }
}
