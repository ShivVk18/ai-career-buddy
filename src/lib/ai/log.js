// Redacted logger + AiUsage persistence. Only metadata is ever logged.
// Content is logged only when AI_DEBUG=1 and NODE_ENV !== "production".
import { db } from "../prisma.js";

const debugOn = () => process.env.AI_DEBUG === "1" && process.env.NODE_ENV !== "production";

export function logAttempt({ userId, actionId, task, provider, model, ok, latencyMs, errorCode }) {
  console.log(
    `[ai] task=${task} provider=${provider} model=${model} ok=${ok} ms=${latencyMs}` +
      (errorCode ? ` error=${errorCode}` : "")
  );
  // Fire and forget: usage logging must never break a request.
  db.aiUsage
    .create({
      data: { userId: userId || null, actionId: actionId || null, task, provider, model, ok, latencyMs, errorCode: errorCode || null },
    })
    .catch(() => console.warn("[ai] failed to write AiUsage row"));
}

export function debugLog(label, content) {
  if (debugOn()) console.log(`[ai:debug] ${label}:`, content);
}
