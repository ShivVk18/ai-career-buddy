"use server";

import { z } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { safeErr } from "@/lib/utils";

const fail = (code, error) => ({ error, code });
const DATA_PHRASE = "DELETE MY DATA";
const ACCOUNT_PHRASE = "DELETE MY ACCOUNT";

// `confirmation` is the contract name; `confirm` is accepted as an alias.
const inputSchema = z.object({ confirmation: z.string().max(100).optional(), confirm: z.string().max(100).optional() });
const phraseOk = (input, phrase) => {
  const p = inputSchema.safeParse(input ?? {});
  if (!p.success) return false;
  return (p.data.confirmation ?? p.data.confirm ?? "").trim() === phrase;
};

/**
 * Every row the user owns, in dependency order (children before parents), as ONE transaction. Scoped by the
 * caller's DB user id (AiUsage by the Clerk id it is logged with). `keepUsageSince` keeps recent AiUsage rows so
 * "delete my data" cannot reset the daily AI limit.
 */
function deletions(uid, clerkId, { withUser, keepUsageSince }) {
  const own = { where: { userId: uid } };
  const ops = [
    db.interviewAnswer.deleteMany(own), // before QuizSession
    db.quizSession.deleteMany(own),
    db.assessment.deleteMany(own),
    db.application.deleteMany(own), // before Job
    db.job.deleteMany(own),
    db.coverLetter.deleteMany(own),
    db.coldEmail.deleteMany(own),
    db.aTSScore.deleteMany(own),
    db.resumeVersion.deleteMany({ where: { resume: { userId: uid } } }), // before Resume
    db.resume.deleteMany(own),
    db.careerPath.deleteMany(own),
    db.careerGoal.deleteMany(own),
    db.skillGapAnalysis.deleteMany(own),
    db.mockInterview.deleteMany(own),
    db.practiceSession.deleteMany(own),
    db.aiUsage.deleteMany({ where: { userId: clerkId, ...(keepUsageSince ? { createdAt: { lt: keepUsageSince } } : {}) } }),
  ];
  ops.push(
    withUser
      ? db.user.deleteMany({ where: { id: uid } })
      : db.user.updateMany({
          where: { id: uid },
          data: { industry: null, experience: null, bio: null, skills: [], targetRole: null, jobSearchStage: null },
        })
  );
  return ops;
}

/**
 * Deletes ALL of the caller's data (documents, jobs, resume and versions, roadmaps, goals, sessions, assessments)
 * and resets the profile fields; the account stays. Needs { confirmation: "DELETE MY DATA" }.
 * Returns { success: true } or { error, code: CONFIRMATION_REQUIRED | NOT_FOUND | FAILED }.
 */
export async function deleteAllMyData(input) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (!phraseOk(input, DATA_PHRASE)) return fail("CONFIRMATION_REQUIRED", `Type ${DATA_PHRASE} to confirm.`);
  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile.");
    await db.$transaction(deletions(user.id, userId, { withUser: false, keepUsageSince: new Date(Date.now() - 24 * 60 * 60 * 1000) }));
    return { success: true };
  } catch (error) {
    console.error("deleteAllMyData failed:", safeErr(error));
    return fail("FAILED", "We couldn't delete your data. Nothing was changed. Please try again.");
  }
}

/**
 * Deletes everything above plus the user row, then the Clerk user (only after the database rows are gone).
 * Needs { confirmation: "DELETE MY ACCOUNT" }. If Clerk fails the data is already deleted: returns
 * { error, code: "CLERK_FAILED" } and calling it again retries only the Clerk deletion.
 * Returns { success: true } or { error, code: CONFIRMATION_REQUIRED | CLERK_FAILED | FAILED }. The UI signs the user out.
 */
export async function deleteAccount(input) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (!phraseOk(input, ACCOUNT_PHRASE)) return fail("CONFIRMATION_REQUIRED", `Type ${ACCOUNT_PHRASE} to confirm.`);
  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (user) await db.$transaction(deletions(user.id, userId, { withUser: true }));
  } catch (error) {
    console.error("deleteAccount failed:", safeErr(error));
    return fail("FAILED", "We couldn't delete your account. Nothing was changed. Please try again.");
  }
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
    return { success: true };
  } catch (error) {
    console.error("deleteAccount clerk step failed:", safeErr(error));
    return fail("CLERK_FAILED", "Your data was deleted, but we couldn't remove your sign-in account. Please try again in a moment.");
  }
}
