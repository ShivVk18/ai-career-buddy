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

// Words that are too generic to count as a target on their own, or to start/end/sit inside a phrase.
const STOP = new Set(
  (
    "the and for with from into onto over under that this these those your you our their its are was were been being have has had " +
    "will can may use using used build building built learn learning study practice complete create make get set take work working " +
    "skills skill experience project projects team teams knowledge basics basic fundamentals understanding understand improve " +
    "develop developing development tools tool concepts concept advanced intermediate beginner introduction intro start " +
    "master mastering apply applying prepare preparing review explore week weeks month months day days step steps " +
    "about each every more most other some such than then them they what when where which while who how why also any all not but"
  ).split(" ")
);
const GENERIC_SINGLE = new Set([...STOP, "software", "engineering", "engineer", "technical", "technology", "general", "management", "design", "data", "system", "systems", "application", "applications", "code", "coding", "problem", "solving", "communication", "leadership", "career", "job", "role", "company"]);

/** Runs of 2-3 consecutive non-stopword tokens (>= 3 chars) from normalized text. */
export function titlePhrases(title) {
  const tokens = normalizeText(title).split(" ").filter(Boolean);
  const out = new Set();
  let run = [];
  const flush = () => {
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i + n <= run.length; i++) out.add(run.slice(i, i + n).join(" "));
    }
    run = [];
  };
  for (const t of tokens) {
    if (t.length >= 3 && !STOP.has(t)) run.push(t);
    else flush();
  }
  flush();
  return [...out];
}

const usableSingle = (t) => t.length >= 3 && !GENERIC_SINGLE.has(t);

/** Candidate terms from the step's stored source snapshots: profile skills (comma list) and vocabulary terms in excerpts. */
export function sourceTerms(step) {
  const out = new Set();
  for (const src of Array.isArray(step?.sources) ? step.sources : []) {
    if (!src || typeof src.excerpt !== "string") continue;
    if (src.kind === "profile" && src.id === "profile:skills") {
      for (const part of src.excerpt.split(",")) {
        const t = normalizeText(part);
        if (!t || t.split(" ").length > 3) continue;
        if (t.includes(" ") ? t.length >= 3 : usableSingle(t)) out.add(t);
      }
    } else if (src.kind === "jd") {
      const text = normalizeText(src.excerpt);
      for (const variants of VARIANTS.values()) {
        if (variants.some((t) => hasTerm(text, t))) for (const v of variants) out.add(v);
      }
    }
  }
  return [...out];
}

/**
 * What a step names: vocabulary skills in its skill/title, terms from its stored sources, multi-word phrases of
 * its title, plus its whole title (normalized). `stepNeedles` keeps the vocabulary + source + phrase terms in `terms`.
 */
export function stepNeedles(step) {
  const text = normalizeText([step?.skill, step?.title].filter((x) => typeof x === "string").join(" "));
  const needles = [];
  for (const variants of VARIANTS.values()) {
    if (variants.some((t) => hasTerm(text, t))) needles.push(...variants);
  }
  needles.push(...sourceTerms(step), ...titlePhrases(step?.title));
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
