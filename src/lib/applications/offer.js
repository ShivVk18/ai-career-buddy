// Pure offer math and the negotiation template (no I/O, no AI). Honest by design: only numbers the user typed
// are used; there is no market salary data in this app, so nothing is compared with "the market".
export const NO_MARKET_DATA = "We have no market salary data, so we can't tell you how this offer compares with the market.";

const num = (v) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : null);

/** Normalises a stored/typed offer to numbers or null. */
export function normalizeOffer(o) {
  const x = o && typeof o === "object" ? o : {};
  return { base: num(x.base), bonus: num(x.bonus), equity: num(x.equity), other: num(x.other), currency: typeof x.currency === "string" && x.currency ? x.currency : null };
}

/** Sum of the parts the user entered (equity and other are the yearly values THEY gave). null when nothing was entered. */
export function offerTotal(o) {
  const parts = [o.base, o.bonus, o.equity, o.other].filter((v) => v !== null);
  return parts.length ? parts.reduce((a, b) => a + b, 0) : null;
}

const pct = (diff, of) => (of ? Math.round((diff / of) * 100) : null);

/**
 * Compares this offer with the user's target base and their other offers.
 * others: [{ applicationId, company, title, offer }] (already owner-scoped by the caller).
 */
export function compareOffers({ offer, targetBase, others }) {
  const o = normalizeOffer(offer);
  const total = offerTotal(o);
  const notes = [];
  let vsTarget = null;
  if (targetBase && o.base !== null) {
    const diff = o.base - targetBase;
    vsTarget = { targetBase, diff, pct: pct(diff, targetBase), meets: diff >= 0 };
  } else if (!targetBase) {
    notes.push("You haven't set a target base pay, so there's nothing to compare the base against.");
  } else {
    notes.push("Add a base amount to compare it with your target.");
  }
  const rows = [];
  for (const x of others) {
    const oo = normalizeOffer(x.offer);
    const t = offerTotal(oo);
    rows.push({
      applicationId: x.applicationId, company: x.company ?? null, title: x.title ?? null, ...oo, total: t,
      baseDiff: o.base !== null && oo.base !== null ? oo.base - o.base : null,
      totalDiff: total !== null && t !== null ? t - total : null,
    });
  }
  if (rows.length === 0) notes.push("You haven't entered another offer, so there's nothing else to compare with.");
  const currencies = new Set([o.currency, ...rows.map((r) => r.currency)].filter(Boolean));
  if (currencies.size > 1) notes.push("These offers use different currencies, so the differences between them are not converted.");
  if (o.equity !== null) notes.push("Equity is the yearly value you entered. We can't value it for you.");
  notes.push(NO_MARKET_DATA);
  return { offer: { ...o, total }, vsTarget, others: rows, marketData: null, notes };
}

const money = (n, cur) => `${Math.round(n).toLocaleString("en-US")}${cur ? ` ${cur}` : ""}`;

/**
 * Editable negotiation draft from facts the user gave: company, role, the offer they typed and their own target.
 * Never claims a market rate or a competing offer.
 */
export function negotiationDraft({ company, title, offer, targetBase, name, otherOfferCount = 0 }) {
  const o = normalizeOffer(offer);
  const where = [title && `the ${title} role`, company && `at ${company}`].filter(Boolean).join(" ") || "the role";
  const lines = ["Hi,", "", `Thank you for the offer for ${where}. I'm excited about the team and the work, and I'd like to make this work.`];
  if (o.base !== null) {
    lines.push("", `The offer lists a base of ${money(o.base, o.currency)}.`);
    if (targetBase && targetBase > o.base) {
      lines.push(`I was hoping for a base closer to ${money(targetBase, o.currency)}. Is there room to move on the base?`);
    } else {
      lines.push("Is there any flexibility on the base, or on the bonus, equity or other parts of the package?");
    }
  } else {
    lines.push("", "Is there any flexibility on the base, bonus, equity or other parts of the package?");
  }
  if (otherOfferCount > 0) lines.push("", "I'm also weighing another offer and want to give you a fair answer, so I'd appreciate your help with the details.");
  lines.push("", "Thank you again. I'm happy to talk this through whenever suits you.", "", `Best regards${name ? `,\n${name}` : ""}`);
  return {
    subject: `Re: offer for ${[title, company].filter(Boolean).join(" at ") || "the role"}`.slice(0, 200),
    text: lines.join("\n"),
  };
}
