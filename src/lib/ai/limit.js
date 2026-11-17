// Per-user daily AI cap (D21). Counts today's AiUsage rows (UTC day) for a user.
// Fails open: if the table is missing or the count fails, the cap is skipped with one warning.
import { db } from "../prisma.js";

let warned = false;

export function getDailyLimit() {
  const n = Number.parseInt(process.env.AI_DAILY_LIMIT ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : null;
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
      console.warn("[ai] AI_DAILY_LIMIT is set but AiUsage could not be read (migration not applied?); cap skipped");
    }
    return false;
  }
}
