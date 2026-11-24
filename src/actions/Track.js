"use server";

import { z } from "zod";
import { db } from "@/lib/prisma";
import { safeErr } from "@/lib/utils";
import { fail, requireUser, NO_PROFILE_MSG } from "@/lib/jobs/common";
import { nextMondayAt9, validTimeZone } from "@/lib/applications/schedule";
import { makeUndoToken } from "@/lib/undo";

const NOT_FOUND = () => fail("NOT_FOUND", "We couldn't find that.");
const FOLLOW_UP_PREFIX = "FOLLOW_UP_DRAFT:";

const itemSchema = z.string().trim().min(1).max(120);

/**
 * The single action behind a FOLLOW_UP_DRAFT needs-you item ("approve & copy"). Marks the draft approved and records the
 * follow-up as sent by the user (status "sent", sources.sentByUser, the application's last activity resets the quiet
 * counter), and returns the text to copy. It never sends anything. Idempotent: calling it again returns the same text with
 * alreadyApproved: true. Returns { success: true, itemId, text, subject, applicationId, approvedAt, alreadyApproved }
 * or { error, code: INVALID | NOT_FOUND | FAILED }.
 */
export async function approveAndCopy(itemId) {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  const parsed = itemSchema.safeParse(itemId);
  if (!parsed.success || !parsed.data.startsWith(FOLLOW_UP_PREFIX)) return fail("INVALID", "That item can't be approved and copied.");
  const emailId = parsed.data.slice(FOLLOW_UP_PREFIX.length);
  if (!emailId) return fail("INVALID", "That item can't be approved and copied.");
  try {
    const row = await db.coldEmail.findFirst({
      where: { id: emailId, userId: user.id, deletedAt: null },
      select: { id: true, jobId: true, status: true, content: true, subject: true, sources: true },
    });
    const src = row?.sources && typeof row.sources === "object" ? row.sources : null;
    if (!row || src?.template !== "follow_up") return NOT_FOUND();
    const out = (approvedAt, already, undoToken) => ({ success: true, itemId: parsed.data, text: row.content, subject: row.subject ?? "", applicationId: appId ?? null, approvedAt, alreadyApproved: already, ...(undoToken ? { undoToken } : {}) });
    const app = row.jobId ? await db.application.findFirst({ where: { jobId: row.jobId, userId: user.id, deletedAt: null }, select: { id: true, lastActivityAt: true } }) : null;
    const appId = app?.id;
    if (row.status !== "draft") return out(typeof src.approvedAt === "string" ? src.approvedAt : null, true);

    const approvedAt = new Date();
    const claim = await db.coldEmail.updateMany({
      where: { id: row.id, userId: user.id, status: "draft" },
      data: { status: "sent", sources: { ...src, approvedAt: approvedAt.toISOString(), sentByUser: true, prevActivityAt: app?.lastActivityAt ? new Date(app.lastActivityAt).toISOString() : null } },
    });
    if (claim.count === 0) return out(null, true); // a double click: the other call won
    if (appId) await db.application.updateMany({ where: { id: appId, userId: user.id }, data: { lastActivityAt: approvedAt } });
    return out(approvedAt.toISOString(), false, makeUndoToken("followup_approve", row.id));
  } catch (error) {
    console.error("approveAndCopy failed:", safeErr(error));
    return fail("FAILED", "We couldn't save that. Please try again.");
  }
}

/**
 * The undo of approveAndCopy for a FOLLOW_UP_DRAFT item. Puts the draft back to "draft", clears sources.approvedAt/sentByUser
 * and restores the application's previous lastActivityAt (so the quiet counter returns). Idempotent: an item that is still a
 * draft returns { success: true }. Returns { success: true } or { error, code: INVALID | NOT_FOUND | FAILED }.
 */
export async function unapproveFollowUp(itemId) {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  const parsed = itemSchema.safeParse(itemId);
  if (!parsed.success || !parsed.data.startsWith(FOLLOW_UP_PREFIX)) return fail("INVALID", "That item can't be undone.");
  const emailId = parsed.data.slice(FOLLOW_UP_PREFIX.length);
  if (!emailId) return fail("INVALID", "That item can't be undone.");
  try {
    const row = await db.coldEmail.findFirst({
      where: { id: emailId, userId: user.id, deletedAt: null },
      select: { id: true, jobId: true, status: true, sources: true },
    });
    const src = row?.sources && typeof row.sources === "object" ? row.sources : null;
    if (!row || src?.template !== "follow_up") return NOT_FOUND();
    if (row.status === "draft") return { success: true };
    if (src.sentByUser !== true) return NOT_FOUND(); // sent some other way: not ours to reverse
    const { approvedAt: _a, sentByUser: _s, prevActivityAt, ...rest } = src;
    const claim = await db.coldEmail.updateMany({ where: { id: row.id, userId: user.id, status: "sent" }, data: { status: "draft", sources: rest } });
    if (claim.count === 0) return { success: true }; // a double click: the other call won
    if (row.jobId && prevActivityAt !== undefined) {
      const app = await db.application.findFirst({ where: { jobId: row.jobId, userId: user.id, deletedAt: null }, select: { id: true } });
      if (app) {
        const when = typeof prevActivityAt === "string" && !Number.isNaN(new Date(prevActivityAt).getTime()) ? new Date(prevActivityAt) : null;
        await db.application.updateMany({ where: { id: app.id, userId: user.id }, data: { lastActivityAt: when } });
      }
    }
    return { success: true };
  } catch (error) {
    console.error("unapproveFollowUp failed:", safeErr(error));
    return fail("FAILED", "We couldn't undo that. Please try again.");
  }
}

const weakSpotSchema = z.object({
  applicationId: z.string().trim().min(1).max(100).optional(),
  skill: z.string().trim().min(1).max(80),
  note: z.string().trim().max(500).optional(),
  timeZone: z.string().max(64).optional(),
});

/**
 * Saves a weak spot from interview practice as a task dated next Monday 09:00 (in `timeZone` when it's a valid IANA name,
 * else the server's zone). It shows in getHomeState().tasks (kind "task"). One task per skill per week: saving the same skill
 * again for that Monday returns the existing task (created: false). Returns { task: { taskId, title, note, dueAt, applicationId },
 * created } or { error, code: INVALID | NOT_FOUND | FAILED }.
 */
export async function saveWeakSpot(input) {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  const p = weakSpotSchema.safeParse(input ?? {});
  if (!p.success) return fail("INVALID", "Add the skill you want to work on (up to 80 characters).");
  const { applicationId, skill, note, timeZone } = p.data;
  try {
    if (applicationId) {
      const app = await db.application.findFirst({ where: { id: applicationId, userId: user.id, deletedAt: null }, select: { id: true } });
      if (!app) return NOT_FOUND();
    }
    const dueAt = nextMondayAt9(Date.now(), validTimeZone(timeZone) ?? undefined);
    const key = `weak:${skill.toLowerCase()}:${dueAt.toISOString().slice(0, 10)}`;
    const existing = await db.task.findFirst({ where: { userId: user.id, key }, select: { id: true, title: true, note: true, dueAt: true, applicationId: true } });
    const shape = (t, created) => ({ task: { taskId: t.id, title: t.title, note: t.note ?? null, dueAt: t.dueAt.toISOString(), applicationId: t.applicationId ?? null }, created });
    if (existing) return shape(existing, false);
    const row = await db.task.create({
      data: { userId: user.id, applicationId: applicationId ?? null, title: `Practise ${skill}`, note: note || null, source: "weak_spot", key, dueAt },
      select: { id: true, title: true, note: true, dueAt: true, applicationId: true },
    });
    return shape(row, true);
  } catch (error) {
    console.error("saveWeakSpot failed:", safeErr(error));
    return fail("FAILED", "We couldn't save that. Please try again.");
  }
}

/** Marks one of the user's tasks done (or not done again: done = false). Returns { success: true } or { error, code }. */
export async function completeTask(taskId, done = true) {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  const id = z.string().trim().min(1).max(100).safeParse(taskId);
  if (!id.success) return fail("INVALID", "Missing task id.");
  try {
    const r = await db.task.updateMany({ where: { id: id.data, userId: user.id }, data: { doneAt: done === false ? null : new Date() } });
    return r.count ? { success: true } : NOT_FOUND();
  } catch (error) {
    console.error("completeTask failed:", safeErr(error));
    return fail("FAILED", "We couldn't save that. Please try again.");
  }
}
