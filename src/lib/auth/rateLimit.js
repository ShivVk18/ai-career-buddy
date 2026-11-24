import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/prisma";

// Fixed-window counters in Postgres (table AuthRateLimit), so limits hold across serverless instances.
// Keys: "<action>:ip:<ip>" and "<action>:email:<sha256(email)>" (emails are never stored in clear).

const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 32);

/** Client IP from the proxy headers ("unknown" when absent). Behind your own proxy, make sure it overwrites x-forwarded-for. */
export function ipFromHeaders(h) {
  const xff = h?.get?.("x-forwarded-for");
  return (xff ? xff.split(",")[0].trim() : h?.get?.("x-real-ip")) || "unknown";
}

export async function clientIp() {
  try {
    return ipFromHeaders(await headers());
  } catch {
    return "unknown";
  }
}

/** Counts one hit. Returns true when the caller is still within `limit` hits per `windowMs`. */
export async function hit(key, limit, windowMs) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowMs);
  const rows = await db.$queryRaw`
    INSERT INTO "AuthRateLimit" ("key", "count", "windowStart") VALUES (${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "AuthRateLimit"."windowStart" < ${cutoff} THEN 1 ELSE "AuthRateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "AuthRateLimit"."windowStart" < ${cutoff} THEN ${now} ELSE "AuthRateLimit"."windowStart" END
    RETURNING "count"`;
  return Number(rows?.[0]?.count ?? 1) <= limit;
}

export const LIMITS = {
  signIn: { ip: [30, 15 * 60_000], email: [8, 15 * 60_000] },
  signUp: { ip: [10, 60 * 60_000], email: [5, 60 * 60_000] },
  reset: { ip: [10, 60 * 60_000], email: [3, 60 * 60_000] },
  resetSubmit: { ip: [20, 60 * 60_000], email: [20, 60 * 60_000] },
};

/** Checks the per-IP and per-email limits for an action. Both counters are always incremented. Returns true if allowed. */
export async function allow(action, { ip, email }) {
  const [ipLimit, ipWin] = LIMITS[action].ip;
  const [emLimit, emWin] = LIMITS[action].email;
  const a = await hit(`${action}:ip:${sha(ip || "unknown")}`, ipLimit, ipWin);
  const b = email ? await hit(`${action}:email:${sha(email)}`, emLimit, emWin) : true;
  return a && b;
}
