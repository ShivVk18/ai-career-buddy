"use server";

import { db } from "@/lib/prisma";
import { z } from "zod";
import { withAiAction } from "@/lib/ai";
import { safeErr } from "@/lib/utils";
import { JOB_FIELDS, cleanFieldValue } from "@/lib/jobs/meta";
import { intakeJobImpl } from "@/lib/jobs/intake";
import { APPLICATION_SELECT, NO_PROFILE_MSG, fail, publicJob, requireUser } from "@/lib/jobs/common";

const UNDO_DAYS = 7;

const idSchema = z.string().trim().min(1).max(100);

/**
 * Pasted text or a link becomes a Job plus an Application(SAVED), atomically.
 * Returns:
 *   { kind: "question", text }                       no AI call, nothing stored (send it to chat)
 *   { kind: "job", job, applicationId, notice }      notice: null | "AI_LIMIT" | "AI_UNAVAILABLE" | "EXTRACT_FAILED"
 *   { error, code: INVALID | NOT_FOUND | URL_BLOCKED | FETCH_FAILED | PASTE_NEEDED | NOT_A_JOB | FAILED, url? }
 * One cap-counted action (D50): the single `fast` call. Chips read from a JSON-LD header need none.
 */
export async function intakeJob(data) {
  return withAiAction(() => intakeJobImpl(data));
}

/** The caller's job (not deleted) with its application and the job description. */
export async function getJob(id) {
  const { user } = await requireUser();
  const pid = idSchema.safeParse(id);
  if (!pid.success) return fail("INVALID", "Missing job id.");
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  try {
    const row = await db.job.findFirst({
      where: { id: pid.data, userId: user.id, deletedAt: null },
      include: { application: { select: APPLICATION_SELECT } },
    });
    if (!row) return fail("NOT_FOUND", "We couldn't find that job.");
    return publicJob(row, { withText: true });
  } catch (error) {
    console.error("getJob failed:", safeErr(error));
    return fail("FAILED", "We couldn't load that job. Please try again.");
  }
}

const fieldSchema = z.object({
  id: idSchema,
  field: z.enum(JOB_FIELDS),
  // "" or null clears the chip.
  value: z.string().max(400).nullable(),
});

/**
 * Inline chip edit (save on Enter / blur). The user's own value has no job-description source: its
 * sources are cleared and its origin becomes "user". Returns the updated job (no jdText) or { error, code }.
 */
export async function updateJobField(id, field, value) {
  const { user } = await requireUser();
  const parsed = fieldSchema.safeParse({ id, field, value });
  if (!parsed.success) return fail("INVALID", "That value isn't valid. Use up to 200 characters.");
  const clean = cleanFieldValue(parsed.data.value);
  if (parsed.data.value && parsed.data.value.trim().length > 0 && /[\r\n]/.test(parsed.data.value.trim())) {
    return fail("INVALID", "Use a single line.");
  }
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  try {
    const row = await db.job.findFirst({ where: { id: parsed.data.id, userId: user.id, deletedAt: null } });
    if (!row) return fail("NOT_FOUND", "We couldn't find that job.");
    const prev = row.sources && typeof row.sources === "object" ? row.sources : {};
    const sources = { ...prev, [parsed.data.field]: [], origin: { ...(prev.origin ?? {}), [parsed.data.field]: clean ? "user" : null } };
    const res = await db.job.updateMany({
      where: { id: row.id, userId: user.id, deletedAt: null },
      data: { [parsed.data.field]: clean || null, sources },
    });
    if (res.count === 0) return fail("NOT_FOUND", "We couldn't find that job.");
    const fresh = await db.job.findFirst({
      where: { id: row.id, userId: user.id },
      include: { application: { select: APPLICATION_SELECT } },
    });
    return publicJob(fresh);
  } catch (error) {
    console.error("updateJobField failed:", safeErr(error));
    return fail("FAILED", "We couldn't save that change. Please try again.");
  }
}

/** Soft delete (D60): the job and its application get deletedAt. Undo with restoreJob (kept 7 days). */
export async function deleteJob(id) {
  const { user } = await requireUser();
  const pid = idSchema.safeParse(id);
  if (!pid.success) return fail("INVALID", "Missing job id.");
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  try {
    const now = new Date();
    const [res] = await db.$transaction([
      db.job.updateMany({ where: { id: pid.data, userId: user.id, deletedAt: null }, data: { deletedAt: now } }),
      db.application.updateMany({ where: { jobId: pid.data, userId: user.id, deletedAt: null }, data: { deletedAt: now } }),
    ]);
    if (res.count === 0) return fail("NOT_FOUND", "We couldn't find that job.");
    return { success: true, id: pid.data };
  } catch (error) {
    console.error("deleteJob failed:", safeErr(error));
    return fail("FAILED", "We couldn't delete that job. Please try again.");
  }
}

/** Undo for deleteJob. Works for 7 days after the delete. */
export async function restoreJob(id) {
  const { user } = await requireUser();
  const pid = idSchema.safeParse(id);
  if (!pid.success) return fail("INVALID", "Missing job id.");
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  try {
    const cutoff = new Date(Date.now() - UNDO_DAYS * 24 * 60 * 60 * 1000);
    const [res] = await db.$transaction([
      db.job.updateMany({ where: { id: pid.data, userId: user.id, deletedAt: { not: null, gte: cutoff } }, data: { deletedAt: null } }),
      db.application.updateMany({ where: { jobId: pid.data, userId: user.id, deletedAt: { not: null, gte: cutoff } }, data: { deletedAt: null } }),
    ]);
    if (res.count === 0) return fail("NOT_FOUND", "That job can't be restored any more.");
    return { success: true, id: pid.data };
  } catch (error) {
    console.error("restoreJob failed:", safeErr(error));
    return fail("FAILED", "We couldn't restore that job. Please try again.");
  }
}
