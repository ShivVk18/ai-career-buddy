// Small helpers shared by the job and pipeline actions. Not a "use server" file.
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const fail = (code, error) => ({ error, code });
export const NO_PROFILE_MSG = "We couldn't find your profile. Please finish onboarding first.";
export const AI_LIMIT_MSG = "Daily AI limit reached. Please try again tomorrow.";
export const AI_UNAVAILABLE_MSG = "AI is temporarily unavailable. Please try again later.";

/** Signed-out THROWS Error("Unauthorized"); a missing DB user returns { user: null }. */
export async function requireUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true, name: true } });
  return { clerkUserId: userId, user };
}

export const iso = (d) => (d instanceof Date ? d.toISOString() : d ?? null);

/** Shape returned to the browser for a Job row (and its optional application). */
export function publicJob(row, { withText = false } = {}) {
  if (!row) return row;
  const s = row.sources && typeof row.sources === "object" ? row.sources : {};
  const app = row.application ?? null;
  return {
    id: row.id,
    url: row.url ?? null,
    company: row.company ?? null,
    title: row.title ?? null,
    location: row.location ?? null,
    sources: { company: s.company ?? [], title: s.title ?? [], location: s.location ?? [] },
    origin: { company: s.origin?.company ?? null, title: s.origin?.title ?? null, location: s.origin?.location ?? null },
    ...(withText ? { jdText: row.jdText } : {}),
    createdAt: iso(row.createdAt),
    application: app
      ? {
          id: app.id,
          status: app.status,
          appliedAt: iso(app.appliedAt),
          interviewAt: iso(app.interviewAt),
          prepSessionId: app.prepSessionId ?? null,
          nextActionAt: iso(app.nextActionAt),
          followUpCount: app.followUpCount ?? 0,
          closedReason: app.closedReason ?? null,
        }
      : null,
  };
}

export const APPLICATION_SELECT = {
  id: true,
  status: true,
  appliedAt: true,
  interviewAt: true,
  prepSessionId: true,
  nextActionAt: true,
  followUpCount: true,
  closedReason: true,
};
