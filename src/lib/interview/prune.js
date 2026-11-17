import { db } from "@/lib/prisma";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_PER_PART = 200;
const isOpenSession = (questions) => Array.isArray(questions) && questions.some((q) => q?.type === "open");

/**
 * Best-effort housekeeping for one user's unsubmitted QuizSessions older than 7 days. The two parts are independent:
 * - MCQ sessions (no item with type "open") are always pruned, even if the InterviewAnswer table does not exist yet.
 * - Open sessions are pruned only when they have no SCORED answers; that needs the answer table, so a failure there
 *   (e.g. migration not applied) just skips this part.
 * Open sessions with scored answers are kept (history and weak areas depend on them).
 */
export async function pruneOldSessions(userId) {
  const where = { userId, submittedAt: null, createdAt: { lt: new Date(Date.now() - WEEK_MS) } };
  try {
    // Each part has its own bound (take: 200 per run).
    const old = await db.quizSession.findMany({ where, select: { id: true, questions: true }, orderBy: { createdAt: "asc" }, take: MAX_PER_PART });
    const ids = old.filter((s) => !isOpenSession(s.questions)).map((s) => s.id);
    if (ids.length) await db.quizSession.deleteMany({ where: { id: { in: ids }, userId, submittedAt: null } });
  } catch {
    /* best effort */
  }
  try {
    const old = await db.quizSession.findMany({
      where: { ...where, answers: { none: { overall: { not: null } } } }, // kept (scored) sessions never use up this bound
      select: { id: true, questions: true, _count: { select: { answers: { where: { overall: { not: null } } } } } },
      orderBy: { createdAt: "asc" },
      take: MAX_PER_PART,
    });
    const ids = old.filter((s) => isOpenSession(s.questions) && s._count.answers === 0).map((s) => s.id);
    // Re-check "no scored answers" in the delete itself, so an answer scored since the read keeps its session.
    if (ids.length) await db.quizSession.deleteMany({ where: { id: { in: ids }, userId, submittedAt: null, answers: { none: { overall: { not: null } } } } });
  } catch {
    /* answer table missing or other error: skip open-session pruning only */
  }
}
