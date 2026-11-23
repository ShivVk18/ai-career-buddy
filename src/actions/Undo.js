"use server";

import { auth } from "@clerk/nextjs/server";
import { makeUndoToken, parseUndoToken } from "@/lib/undo";
import { restoreResumeVersion, restoreDeletedResume } from "@/actions/Resume";
import { restoreCareerRoadmap } from "@/actions/CareerRoadmap";

const fail = (code, error) => ({ error, code });

/**
 * Accepts a saved tailored version into the main resume (the current resume is backed up first).
 * Returns { success: true, undoToken, versionId } or { error, code }. Undo = undo(undoToken).
 */
export async function acceptTailoredVersion(versionId) {
  const r = await restoreResumeVersion(versionId);
  if (r?.error) return r;
  return { success: true, versionId, undoToken: makeUndoToken("resume_restore", r.undoVersionId) };
}

/** Token for an existing delete action's undoId (deleteResume -> resume_delete, deleteCareerRoadmap -> roadmap_delete). */
export async function undoTokenFor(kind, id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (kind !== "resume_delete" && kind !== "roadmap_delete") return fail("INVALID", "Nothing to undo.");
  try {
    return { undoToken: makeUndoToken(kind, id) };
  } catch {
    return fail("INVALID", "Nothing to undo.");
  }
}

/**
 * Runs one undo. Returns { success: true, kind, redoToken? } or { error, code }.
 * For resume_restore, redoToken undoes the undo (restoring again snapshots the current state).
 */
export async function undo(token) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const t = parseUndoToken(token);
  if (!t) return fail("INVALID", "Nothing to undo.");
  switch (t.kind) {
    case "resume_restore": {
      const r = await restoreResumeVersion(t.id);
      if (r?.error) return r;
      return { success: true, kind: t.kind, redoToken: makeUndoToken("resume_restore", r.undoVersionId) };
    }
    case "resume_delete": {
      const r = await restoreDeletedResume(t.id);
      return r?.error ? r : { success: true, kind: t.kind };
    }
    case "roadmap_delete": {
      const r = await restoreCareerRoadmap(t.id);
      return r?.error ? r : { success: true, kind: t.kind };
    }
    default:
      return fail("INVALID", "Nothing to undo.");
  }
}
