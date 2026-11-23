"use server";

import { z } from "zod";
import { db } from "@/lib/prisma";
import { safeErr } from "@/lib/utils";
import { fail, requireUser, NO_PROFILE_MSG, iso } from "@/lib/jobs/common";

const idSchema = z.string().trim().min(1).max(100);
const out = (n) => ({ id: n.id, type: n.type, title: n.title, body: n.body ?? null, href: n.href ?? null, read: !!n.readAt, createdAt: iso(n.createdAt) });

/** { items (newest first, max `limit` default 30), unreadCount } or { error, code }. Signed-out throws. */
export async function listNotifications({ limit = 30, unreadOnly = false } = {}) {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  const take = Math.min(Math.max(Number.isInteger(limit) ? limit : 30, 1), 100);
  try {
    const [rows, unreadCount] = await Promise.all([
      db.notification.findMany({ where: { userId: user.id, ...(unreadOnly ? { readAt: null } : {}) }, orderBy: { createdAt: "desc" }, take }),
      db.notification.count({ where: { userId: user.id, readAt: null } }),
    ]);
    return { items: rows.map(out), unreadCount };
  } catch (error) {
    console.error("listNotifications failed:", safeErr(error));
    return fail("FAILED", "We couldn't load your notifications.");
  }
}

/** Marks one notification read. Returns { success: true } or { error, code }. */
export async function markNotificationRead(id) {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  const nid = idSchema.safeParse(id);
  if (!nid.success) return fail("INVALID", "Missing notification id.");
  try {
    const r = await db.notification.updateMany({ where: { id: nid.data, userId: user.id, readAt: null }, data: { readAt: new Date() } });
    return { success: true, updated: r.count };
  } catch (error) {
    console.error("markNotificationRead failed:", safeErr(error));
    return fail("FAILED", "We couldn't update that notification.");
  }
}

/** Marks every unread notification read. Returns { success: true, updated }. */
export async function markAllNotificationsRead() {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  try {
    const r = await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
    return { success: true, updated: r.count };
  } catch (error) {
    console.error("markAllNotificationsRead failed:", safeErr(error));
    return fail("FAILED", "We couldn't update your notifications.");
  }
}
