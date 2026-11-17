// Scoring weights per candidate level. The ATS prompt AND the UI both read this file, so the
// weights shown to the user always match what the model was told (D32).

export const CANDIDATE_LEVELS = ["Student", "Fresher", "Junior", "Mid", "Senior"];

export const WEIGHT_GROUPS = {
  early: {
    label: "Student / Fresher",
    levels: ["Student", "Fresher"],
    weights: [
      { key: "Skills Match", value: 50 },
      { key: "Projects", value: 25 },
      { key: "Internship", value: 15 },
      { key: "Format", value: 10 },
    ],
  },
  junior: {
    label: "Junior (0-2 yrs)",
    levels: ["Junior"],
    weights: [
      { key: "Skills", value: 40 },
      { key: "Experience", value: 40 },
      { key: "Format", value: 20 },
    ],
  },
  senior: {
    label: "Mid / Senior",
    levels: ["Mid", "Senior"],
    weights: [
      { key: "Experience", value: 50 },
      { key: "Skills", value: 30 },
      { key: "Format", value: 20 },
    ],
  },
};

/** Maps free-text candidateLevel from the model to a canonical level, or null if unknown. */
export function normalizeLevel(raw) {
  const t = String(raw ?? "").toLowerCase();
  if (!t.trim()) return null;
  if (t.includes("student")) return "Student";
  if (t.includes("fresher") || t.includes("entry") || t.includes("intern") || t.includes("graduate")) return "Fresher";
  if (t.includes("junior")) return "Junior";
  if (t.includes("senior") || t.includes("lead") || t.includes("principal") || t.includes("staff")) return "Senior";
  if (t.includes("mid")) return "Mid";
  return null;
}

/** The weight group for a level (raw or canonical), or null when the level is unknown. */
export function weightsForLevel(raw) {
  const level = normalizeLevel(raw);
  if (!level) return null;
  const group = Object.values(WEIGHT_GROUPS).find((g) => g.levels.includes(level));
  return group ? { level, label: group.label, weights: group.weights } : null;
}

/** The "STEP 3" weights text for the ATS prompt, generated from the same data the UI shows. */
export function weightsPromptText() {
  return Object.values(WEIGHT_GROUPS)
    .map(
      (g) =>
        `IF ${g.levels.join("/")}${g.levels.length === 1 ? ` (${g.label.replace(/^[^(]*\(?/, "").replace(/\)$/, "")})` : ""}:\n` +
        g.weights.map((w) => `- ${w.key} → ${w.value}`).join("\n")
    )
    .join("\n\n");
}
