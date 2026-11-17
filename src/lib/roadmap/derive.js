// Deterministic roadmap helpers (no AI, no network). Plain module so it can be self-checked in node.
import { normalizeText } from "../ai/sources.js";
import { VOCAB, hasTerm } from "../match.js";

export const MAX_TARGETS_PER_STEP = 5;
export const JD_EXCERPT_MAX = 240;

const collapse = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Group key for a skill: case, whitespace and surrounding punctuation insensitive. */
export const gapKey = (s) =>
  collapse(String(s ?? "").normalize("NFKC"))
    .toLowerCase()
    .replace(/^[\s.,;:!?\-"'()[\]]+|[\s.,;:!?\-"'()[\]]+$/g, "");

/**
 * Counts missing skills across ATS rows [{ missingSkills: string[] }]. A skill counts once per result
 * (duplicates inside one result are ignored). Returns [{ skill, count }] sorted by count desc then name; `skill`
 * is the most common original spelling (whitespace collapsed).
 */
export function countGaps(rows, limit = 50) {
  const groups = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const seen = new Set();
    for (const raw of Array.isArray(row?.missingSkills) ? row.missingSkills : []) {
      if (typeof raw !== "string") continue;
      const key = gapKey(raw);
      if (!key || key.length > 100 || seen.has(key)) continue;
      seen.add(key);
      const g = groups.get(key) ?? { count: 0, forms: new Map() };
      g.count += 1;
      const form = collapse(raw);
      g.forms.set(form, (g.forms.get(form) ?? 0) + 1);
      groups.set(key, g);
    }
  }
  return [...groups.entries()]
    .map(([key, g]) => ({
      skill: [...g.forms.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
      count: g.count,
      key,
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit)
    .map(({ skill, count }) => ({ skill, count }));
}

// canonical term -> normalized variants (canonical + aliases). Variants under 3 chars are too ambiguous.
const VARIANTS = new Map();
for (const [canon, aliases] of Object.entries(VOCAB)) {
  const v = [canon, ...aliases].map(normalizeText).filter((t) => t.length >= 3);
  if (v.length) VARIANTS.set(canon, v);
}

/** What a step names: the vocabulary skills in its skill/title, plus its whole title (normalized). */
export function stepNeedles(step) {
  const text = normalizeText([step?.skill, step?.title].filter((x) => typeof x === "string").join(" "));
  const needles = [];
  for (const variants of VARIANTS.values()) {
    if (variants.some((t) => hasTerm(text, t))) needles.push(...variants);
  }
  const title = normalizeText(step?.title);
  const whole = title.length >= 4 ? [title] : [];
  return { terms: [...new Set(needles)], whole };
}

/**
 * Does the job description name this step's skill or title? Returns the matching JD line (clipped) or null.
 * Matching is whole-term on normalizeText of both sides.
 */
export function matchStepToJd(step, jobDescription) {
  const jd = String(jobDescription ?? "").slice(0, 20000);
  if (!jd.trim()) return null;
  const { terms, whole } = stepNeedles(step);
  if (!terms.length && !whole.length) return null;
  for (const line of jd.split(/\r?\n/)) {
    const norm = normalizeText(line);
    if (!norm) continue;
    if (terms.some((t) => hasTerm(norm, t)) || whole.some((t) => norm.includes(t))) {
      return { jdExcerpt: clip(collapse(line), JD_EXCERPT_MAX) };
    }
  }
  // A title that wraps across lines: try the whole text.
  const all = normalizeText(jd);
  if (whole.some((t) => all.includes(t))) return { jdExcerpt: clip(collapse(jd), JD_EXCERPT_MAX) };
  return null;
}

/**
 * docs: [{ kind: "ats"|"coverLetter"|"coldEmail", company, role, jobDescription }] newest first.
 * Returns { [stepId]: [{ company, role, jdExcerpt, kinds }] } deduplicated by company|role (D18), at most
 * MAX_TARGETS_PER_STEP per step, only where the stored job description names the step's skill or title.
 */
export function deriveStepTargets(steps, docs) {
  const out = {};
  for (const step of Array.isArray(steps) ? steps : []) {
    if (!step || step.id === undefined || step.id === null) continue;
    const found = new Map();
    for (const d of docs) {
      const company = collapse(d.company);
      const role = collapse(d.role);
      if (!company && !role) continue;
      const m = matchStepToJd(step, d.jobDescription);
      if (!m) continue;
      const key = `${company.toLowerCase()}|${role.toLowerCase()}`;
      const t = found.get(key);
      if (t) {
        if (!t.kinds.includes(d.kind)) t.kinds.push(d.kind);
      } else if (found.size < MAX_TARGETS_PER_STEP) {
        found.set(key, { company, role, jdExcerpt: m.jdExcerpt, kinds: [d.kind] });
      }
    }
    out[String(step.id)] = [...found.values()];
  }
  return out;
}
