"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { db } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { hashPassword, dummyWork, PASSWORD_MIN, PASSWORD_MAX } from "@/lib/auth/password";
import { hashToken, issueResetToken } from "@/lib/auth/tokens";
import { allow, clientIp } from "@/lib/auth/rateLimit";
import { emailReady, sendPasswordResetEmail } from "@/lib/auth/email";
import { normalizeEmail } from "@/lib/auth/email-address";
import { defer } from "@/lib/auth/defer";
import { safeErr } from "@/lib/utils";

const fail = (code, error) => ({ error, code });

// Same text whether or not the email already has an account.
const NEUTRAL = "Check your email. If you already have an account we've sent a link to set your password; otherwise you can sign in now.";
const RESET_NEUTRAL = "If that email has an account, we've sent a link to set a new password. It works once and expires in 30 minutes.";
const EMAIL_NOT_READY = "Email sending isn't set up on the server yet, so we can't complete this. Please try again later.";
const TOO_MANY = "Too many attempts. Please wait a while and try again.";

const emailField = z.string().trim().min(3, "Enter a valid email address.").max(254, "Enter a valid email address.").email("Enter a valid email address.").transform(normalizeEmail);
const passwordField = z.string().min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`).max(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters.`);

const signUpSchema = z.object({ name: z.string().trim().max(100).optional().nullable(), email: emailField, password: passwordField });
const requestSchema = z.object({ email: emailField });
const resetSchema = z.object({ token: z.string().min(20).max(200), password: passwordField });

const firstIssue = (p) => p.error.issues[0]?.message || "Please check your details and try again.";

/**
 * Creates an account with email + password. An email that already exists is NEVER attached: the response is identical
 * and a set-password link is emailed to that address instead (the only way to claim an existing account).
 * Does not sign in; the caller follows with signInWithPassword.
 * Returns { success: true, message } or { error, code: INVALID | RATE_LIMITED | EMAIL_NOT_CONFIGURED | FAILED }.
 */
export async function signUp(input) {
  const parsed = signUpSchema.safeParse(input ?? {});
  if (!parsed.success) return fail("INVALID", firstIssue(parsed));
  const { name, email, password } = parsed.data;
  if (!emailReady()) return fail("EMAIL_NOT_CONFIGURED", EMAIL_NOT_READY); // before any branch, so it can't reveal existence
  try {
    if (!(await allow("signUp", { ip: await clientIp(), email }))) return fail("RATE_LIMITED", TOO_MANY);

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      await dummyWork(); // match the cost of hashing a new password
      const token = await issueResetToken(db, existing.id);
      await defer(() => sendPasswordResetEmail(email, token));
      return { success: true, message: NEUTRAL };
    }
    const passwordHash = await hashPassword(password);
    try {
      await db.user.create({ data: { email, name: name || null, passwordHash, skills: [] } });
    } catch (e) {
      if (e?.code !== "P2002") throw e; // lost a race with another sign-up for the same email: treat as existing, attach nothing
    }
    return { success: true, message: NEUTRAL };
  } catch (e) {
    console.error("signUp failed:", safeErr(e));
    return fail("FAILED", "We couldn't create your account. Please try again.");
  }
}

/**
 * Emails a single-use set/reset-password link (30 min). Same response whether or not the email has an account.
 * Returns { success: true, message } or { error, code: INVALID | EMAIL_NOT_CONFIGURED | FAILED }.
 */
export async function requestPasswordReset(input) {
  const parsed = requestSchema.safeParse(input ?? {});
  if (!parsed.success) return fail("INVALID", "Enter a valid email address.");
  const { email } = parsed.data;
  if (!emailReady()) return fail("EMAIL_NOT_CONFIGURED", EMAIL_NOT_READY);
  try {
    if (!(await allow("reset", { ip: await clientIp(), email }))) return { success: true, message: RESET_NEUTRAL }; // limited: still neutral
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      const token = await issueResetToken(db, user.id);
      await defer(() => sendPasswordResetEmail(email, token));
    } else {
      await dummyWork();
    }
    return { success: true, message: RESET_NEUTRAL };
  } catch (e) {
    console.error("requestPasswordReset failed:", safeErr(e));
    return fail("FAILED", "We couldn't send the email. Please try again.");
  }
}

/**
 * Sets a new password from an emailed token. Single use, 30 min. For an existing (Clerk-era) user this is how the account
 * is claimed: proving email ownership attaches the password to that same user row, so all their data is kept.
 * Returns { success: true, email } or { error, code: INVALID | INVALID_TOKEN | RATE_LIMITED | FAILED }. The UI signs them in with that email.
 */
export async function resetPassword(input) {
  const parsed = resetSchema.safeParse(input ?? {});
  if (!parsed.success) return fail("INVALID", firstIssue(parsed));
  const { token, password } = parsed.data;
  try {
    if (!(await allow("resetSubmit", { ip: await clientIp() }))) return fail("RATE_LIMITED", TOO_MANY);
    const passwordHash = await hashPassword(password);
    const now = new Date();
    const ok = await db.$transaction(async (tx) => {
      const row = await tx.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) }, select: { id: true, userId: true } });
      if (!row) return false;
      // Atomic claim: only one caller can flip usedAt from null while the token is unexpired.
      const claimed = await tx.passwordResetToken.updateMany({ where: { id: row.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
      if (claimed.count !== 1) return false;
      const user = await tx.user.update({ where: { id: row.userId }, data: { passwordHash }, select: { email: true } });
      await tx.passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: now } });
      return user;
    });
    if (!ok) return fail("INVALID_TOKEN", "This link is invalid or has expired. Request a new one.");
    // The token proved ownership, so returning the email lets the page sign in without asking for it again.
    return { success: true, email: ok.email };
  } catch (e) {
    console.error("resetPassword failed:", safeErr(e));
    return fail("FAILED", "We couldn't set your password. Please try again.");
  }
}

/**
 * Signs in (sets the session cookie). Rate limited per IP and email inside the Auth.js authorize step.
 * Returns { success: true } or { error, code: INVALID_CREDENTIALS | INVALID }.
 */
export async function signInWithPassword(input) {
  const parsed = z.object({ email: z.string().max(254), password: z.string().min(1).max(200) }).safeParse(input ?? {});
  if (!parsed.success) return fail("INVALID", "Enter your email and password.");
  try {
    await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirect: false });
    return { success: true };
  } catch (e) {
    if (e instanceof AuthError) return fail("INVALID_CREDENTIALS", "Email or password is incorrect.");
    throw e;
  }
}

/** Clears the session and redirects to `/`. */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
