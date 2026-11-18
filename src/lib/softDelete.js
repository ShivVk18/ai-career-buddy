// Soft delete helpers (D60). Not a "use server" file. Every query is scoped by the caller's DB user id.
import { db } from "@/lib/prisma";
import { safeErr } from "@/lib/utils";

export const UNDO_DAYS = 7;
const PRUNE_BATCH = 50; // per model, per call

/** Rows deleted before this can no longer be restored and are hard-deleted lazily. */
export const undoCutoff = () => new Date(Date.now() - UNDO_DAYS * 24 * 60 * 60 * 1000);

/**
 * Hard-deletes this user's soft-deleted CoverLetter, ColdEmail, ATSScore and Job rows older than 7 days, at
 * most 50 per model per call (oldest first). Opportunistic (there is no job runner) and bounded; never
 * throws: a failure is logged and the request carries on. Deleting a Job also removes its Application (cascade).
 */
export async function pruneDeleted(userDbId) {
  const cutoff = undoCutoff();
  const models = [db.coverLetter, db.coldEmail, db.aTSScore, db.job];
  for (const model of models) {
    try {
      if (!model?.findMany) continue;
      const old = await model.findMany({
        where: { userId: userDbId, deletedAt: { not: null, lt: cutoff } },
        select: { id: true },
        orderBy: { deletedAt: "asc" },
        take: PRUNE_BATCH,
      });
      if (old.length === 0) continue;
      await model.deleteMany({
        where: { id: { in: old.map((r) => r.id) }, userId: userDbId, deletedAt: { not: null, lt: cutoff } },
      });
    } catch (err) {
      console.error("pruneDeleted failed:", safeErr(err));
    }
  }
}
