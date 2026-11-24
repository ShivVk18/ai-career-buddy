import { createHash, randomBytes } from "node:crypto";

export const RESET_TTL_MS = 30 * 60 * 1000;

export const hashToken = (token) => createHash("sha256").update(String(token)).digest("hex");

/** Fresh random token (32 bytes, base64url) and the hash that is stored. The raw token only goes in the email link. */
export function newResetToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

/**
 * Invalidates the user's unused tokens and stores a new one. Returns the raw token (never stored, never logged in production).
 */
export async function issueResetToken(db, userId, now = new Date()) {
  const { token, tokenHash } = newResetToken();
  await db.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
  await db.passwordResetToken.create({ data: { userId, tokenHash, expiresAt: new Date(now.getTime() + RESET_TTL_MS) } });
  return token;
}
