"use server";

import { z } from "zod";
import { db } from "@/lib/prisma";
import { safeErr } from "@/lib/utils";
import { fail, requireUser, NO_PROFILE_MSG } from "@/lib/jobs/common";
import { compareOffers, negotiationDraft, normalizeOffer, NO_MARKET_DATA } from "@/lib/applications/offer";

const MAX_MONEY = 100_000_000;
const money = z.number().finite().min(0).max(MAX_MONEY);
const offerSchema = z
  .object({ base: money.optional(), bonus: money.optional(), equity: money.optional(), other: money.optional(), currency: z.string().trim().min(1).max(8).optional() })
  .strict();
const idSchema = z.string().trim().min(1).max(100);

const NOT_FOUND_APP = () => fail("NOT_FOUND", "We couldn't find that application.");
const NOT_OFFER = () => fail("NOT_OFFER", "Move this application to Offer first.");

async function loadOffer(applicationId, userDbId) {
  return db.application.findFirst({
    where: { id: applicationId, userId: userDbId, deletedAt: null, job: { deletedAt: null } },
    select: { id: true, status: true, offer: true, job: { select: { company: true, title: true } } },
  });
}

async function otherOffers(userDbId, exceptId) {
  const rows = await db.application.findMany({
    where: { userId: userDbId, deletedAt: null, id: { not: exceptId }, status: "OFFER", job: { deletedAt: null } },
    select: { id: true, offer: true, job: { select: { company: true, title: true } } },
    take: 10,
  });
  return rows.filter((r) => r.offer).map((r) => ({ applicationId: r.id, company: r.job?.company, title: r.job?.title, offer: r.offer }));
}

/**
 * Saves the offer the user typed (any of base, bonus, equity, other as numbers per year; currency optional) and compares
 * it with their target base pay and their other saved offers. Pure arithmetic on THEIR numbers: no market data exists, and
 * the result says so. The application must be in Offer status. Calling it again replaces the saved offer.
 * Returns { applicationId, offer:{base,bonus,equity,other,currency,total}, vsTarget:{targetBase,diff,pct,meets}|null,
 * others:[{applicationId,company,title,base,bonus,equity,other,currency,total,baseDiff,totalDiff}], marketData:null, notes:string[] }
 * or { error, code: INVALID | NOT_FOUND | NOT_OFFER | FAILED }.
 */
export async function compareOffer(applicationId, input) {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  const id = idSchema.safeParse(applicationId);
  const parsed = offerSchema.safeParse(input ?? {});
  if (!id.success || !parsed.success) return fail("INVALID", "Enter amounts as numbers (0 or more).");
  try {
    const app = await loadOffer(id.data, user.id);
    if (!app) return NOT_FOUND_APP();
    if (app.status !== "OFFER") return NOT_OFFER();
    const given = Object.values(parsed.data).some((v) => v !== undefined && typeof v === "number");
    let offer = normalizeOffer(app.offer);
    if (given) {
      offer = normalizeOffer({ ...parsed.data });
      await db.application.updateMany({ where: { id: app.id, userId: user.id }, data: { offer: { ...offer, savedAt: new Date().toISOString() } } });
    }
    const me = await db.user.findUnique({ where: { id: user.id }, select: { targetBase: true } });
    const others = await otherOffers(user.id, app.id);
    return { applicationId: app.id, ...compareOffers({ offer, targetBase: me?.targetBase ?? null, others }) };
  } catch (error) {
    console.error("compareOffer failed:", safeErr(error));
    return fail("FAILED", "We couldn't compare that offer. Please try again.");
  }
}

/**
 * Editable negotiation draft (template, no AI) from the saved offer, the user's target base and the job. It never claims a
 * market rate. Nothing is sent. Returns { subject, text, basedOn:{ hasOffer, hasTarget, otherOffers }, notes } or
 * { error, code: INVALID | NOT_FOUND | NOT_OFFER | FAILED }.
 */
export async function draftNegotiation(applicationId) {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  const id = idSchema.safeParse(applicationId);
  if (!id.success) return fail("INVALID", "Missing application id.");
  try {
    const app = await loadOffer(id.data, user.id);
    if (!app) return NOT_FOUND_APP();
    if (app.status !== "OFFER") return NOT_OFFER();
    const me = await db.user.findUnique({ where: { id: user.id }, select: { targetBase: true } });
    const others = await otherOffers(user.id, app.id);
    const offer = normalizeOffer(app.offer);
    const hasOffer = [offer.base, offer.bonus, offer.equity, offer.other].some((v) => v !== null);
    const d = negotiationDraft({ company: app.job?.company, title: app.job?.title, offer, targetBase: me?.targetBase ?? null, name: user.name, otherOfferCount: others.length });
    const notes = [NO_MARKET_DATA];
    if (!hasOffer) notes.unshift("You haven't entered the offer amounts, so this draft has no numbers. Add them with the compare step to personalise it.");
    return { ...d, basedOn: { hasOffer, hasTarget: !!me?.targetBase, otherOffers: others.length }, notes };
  } catch (error) {
    console.error("draftNegotiation failed:", safeErr(error));
    return fail("FAILED", "We couldn't write the draft. Please try again.");
  }
}

/** Sets (number) or clears (null) the user's target base pay used by compareOffer. Returns { targetBase } or { error, code }. */
export async function setTargetSalary(targetBase) {
  const { user } = await requireUser();
  if (!user) return fail("NOT_FOUND", NO_PROFILE_MSG);
  const v = z.union([z.null(), z.number().int().min(1).max(MAX_MONEY)]).safeParse(targetBase);
  if (!v.success) return fail("INVALID", "Enter your target base pay as a whole number.");
  try {
    await db.user.update({ where: { id: user.id }, data: { targetBase: v.data } });
    return { targetBase: v.data };
  } catch (error) {
    console.error("setTargetSalary failed:", safeErr(error));
    return fail("FAILED", "We couldn't save that. Please try again.");
  }
}
