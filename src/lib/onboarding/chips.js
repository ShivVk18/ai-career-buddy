// Verification of resume chips (D59, D26). Pure: no I/O. Every chip must quote the resume text; anything the
// server cannot find in the extracted text is dropped. Reuses normalizeText (the same matcher as the ATS quotes).
import { normalizeText } from "../ai/sources.js";
import { inventedNumbers } from "../ai/numberCheck.js";
import { fnv1a } from "../entryIds.js";

export const MAX_ROLES = 8;
export const MAX_PROJECTS = 8;
export const MAX_SKILLS = 30;
const QUOTE_MAX = 300;
const LABEL_MAX = { role: 100, project: 100, skill: 50 };
const DETAIL_MAX = 200;

const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const chipId = (kind, label) => `c_${fnv1a(`${kind}|${String(label).toLowerCase()}`)}`;

/** Builds the matchers for one resume text. */
function matchers(text) {
  const norm = normalizeText(text);
  const contains = (s) => {
    const n = normalizeText(s);
    return n.length >= 2 && norm.includes(n);
  };
  // Whole-word (so "Go" does not match "going"; "c++" and "c#" work).
  const hasWord = (s) => {
    const n = normalizeText(s);
    return n.length >= 1 && new RegExp(`(?<![a-z0-9])${escapeRe(n)}(?![a-z0-9])`).test(norm);
  };
  return { contains, hasWord };
}

/**
 * raw = the model's resumeChipsSchema output; text = the extracted PDF text.
 * Returns { chips, suggestedTargetRole, suggestedIndustry, years } with only verified items.
 */
export function verifyChips(raw, text) {
  const { contains, hasWord } = matchers(text);
  const quoteOk = (quote, mustContain) => {
    const q = clean(quote, QUOTE_MAX);
    if (q.length < 3 || !contains(q)) return null;
    if (mustContain && !normalizeText(q).includes(normalizeText(mustContain))) return null;
    return q;
  };

  const chips = [];
  const seen = new Set();
  const counts = { role: 0, project: 0, skill: 0 };
  const caps = { role: MAX_ROLES, project: MAX_PROJECTS, skill: MAX_SKILLS };
  for (const c of raw?.chips ?? []) {
    const label = clean(c.label, LABEL_MAX[c.kind] ?? 100);
    if (!label || !(c.kind in caps) || counts[c.kind] >= caps[c.kind]) continue;
    const key = `${c.kind}|${label.toLowerCase()}`;
    if (seen.has(key)) continue;
    if (!hasWord(label)) continue; // the label itself must be in the resume
    const quote = quoteOk(c.quote, label); // and the quote must contain it
    if (!quote) continue;
    // A detail (employer, project blurb) is kept only when it is also in the text; otherwise dropped.
    let detail = clean(c.detail, DETAIL_MAX);
    if (detail && !(c.kind === "role" ? hasWord(detail) : contains(detail) && inventedNumbers(detail, text).length === 0)) detail = "";
    seen.add(key);
    counts[c.kind]++;
    chips.push({ id: chipId(c.kind, label), kind: c.kind, label, ...(detail ? { detail } : {}), source: { quote } });
  }

  // Years must be written in the text (digits or words), and in the quote that backs them.
  let years = null;
  const y = raw?.years;
  if (y && Number.isInteger(Number(y.value)) && Number(y.value) >= 0 && Number(y.value) <= 60) {
    const n = Number(y.value);
    const quote = quoteOk(y.quote);
    if (quote && inventedNumbers(String(n), text).length === 0 && inventedNumbers(String(n), quote).length === 0 && /year|yr/i.test(quote)) {
      years = n;
      chips.push({ id: chipId("years", String(n)), kind: "years", label: n === 1 ? "1 year" : `${n} years`, source: { quote } });
    }
  }

  let suggestedTargetRole = null;
  const t = raw?.suggestedTargetRole;
  if (t) {
    const value = clean(t.value, 100);
    if (value && hasWord(value) && quoteOk(t.quote, value)) suggestedTargetRole = value;
  }
  let suggestedIndustry = null;
  const i = raw?.suggestedIndustry;
  if (i) {
    const value = clean(i.value, 60);
    if (value && quoteOk(i.quote)) suggestedIndustry = value;
  }
  return { chips, suggestedTargetRole, suggestedIndustry, years };
}
