// Server helper (not a server action, not callable from the browser): bots/pipeline call this to notify a user in-app.
import { db } from "@/lib/prisma";
import { safeErr } from "@/lib/utils";

/** Never throws. userDbId is the DB user id. Returns the row id or null. */
export async function createNotification(userDbId, { type, title, body = null, href = null }) {
  try {
    const n = await db.notification.create({
      data: { userId: userDbId, type: String(type).slice(0, 40), title: String(title).slice(0, 200), body: body ? String(body).slice(0, 500) : null, href: href ? String(href).slice(0, 300) : null },
      select: { id: true },
    });
    return n.id;
  } catch (error) {
    console.error("createNotification failed:", safeErr(error));
    return null;
  }
}
