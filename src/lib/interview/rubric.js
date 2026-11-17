// Open interview rubric (D46). Plain module with NO imports, so the server and the UI share the same weights.
// The model scores each criterion 0-10; the server recomputes the overall 0-100 from these weights and
// never trusts an overall sent by the model.

export const RUBRIC_WEIGHTS = { clarity: 30, depth: 40, evidence: 30 }; // sums to 100
export const RUBRIC_CRITERIA = ["clarity", "depth", "evidence"];
export const CRITERION_SCORE_MAX = 10;
export const ANSWER_MIN_CHARS = 20;
export const ANSWER_MAX_CHARS = 5000;
export const OPEN_QUESTION_COUNT = { min: 3, max: 10, default: 5 };
export const WEAK_AREA_MIN_ANSWERS = 2;

export const RUBRIC_LABELS = {
  clarity: "Clarity",
  depth: "Depth",
  evidence: "Evidence",
};

/**
 * Overall 0-100 (integer) from criteria [{ name, score }] with score 0-10. Unknown names are ignored,
 * scores are clamped to 0-10, and a missing criterion counts as 0.
 */
export function computeOverall(criteria) {
  const byName = new Map();
  for (const c of Array.isArray(criteria) ? criteria : []) {
    if (c && RUBRIC_WEIGHTS[c.name] !== undefined && !byName.has(c.name)) byName.set(c.name, c.score);
  }
  let total = 0;
  for (const name of RUBRIC_CRITERIA) {
    const raw = Number(byName.get(name));
    const s = Number.isFinite(raw) ? Math.min(CRITERION_SCORE_MAX, Math.max(0, raw)) : 0;
    total += (s / CRITERION_SCORE_MAX) * RUBRIC_WEIGHTS[name];
  }
  return Math.round(total);
}
