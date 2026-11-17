// Shared writing rules for cover letters and cold emails (D40). Plain JS, no AI, no server-only
// imports: used by the generator prompts, the server actions and the UI, so they always agree.

/** The ONE cover letter word range (prompt and UI word count). */
export const COVER_LETTER_WORDS = { min: 250, max: 350 };

/** Cold email: prompt asks for min-max; the UI shows `target` inside that range. */
export const COLD_EMAIL_WORDS = { min: 100, max: 140, target: 120 };

export const COVER_LETTER_TONES = ["stiff", "confident", "eager"];
export const DEFAULT_TONE = "confident";
export const COVER_LETTER_FORMALITY = ["standard", "formal"];

export const TONE_LABELS = {
  stiff: "stiff (formal)",
  confident: "confident (solution-focused)",
  eager: "eager (startup energy)",
};

/** Prompt instruction per tone. */
export const TONE_PROMPTS = {
  stiff: "Formal and reserved: precise, respectful wording, no slang, no exclamation marks.",
  confident: "Confident and solution-focused: direct, specific, positions the candidate as the answer to the company's needs.",
  eager: "Warm and energetic with startup energy: enthusiastic but still professional, no exclamation overload.",
};

/** Curated, lowercase. Deliberately plain phrases that recruiters see constantly. */
export const CLICHES = [
  "i am writing to express my interest",
  "i am writing to apply",
  "i am excited to apply",
  "i am thrilled to apply",
  "i am thrilled to",
  "i am passionate about",
  "i am a hard worker",
  "hard-working",
  "hardworking",
  "team player",
  "go-getter",
  "self-starter",
  "detail-oriented",
  "results-driven",
  "think outside the box",
  "out-of-the-box",
  "synergy",
  "dynamic environment",
  "fast-paced environment",
  "proven track record",
  "perfect fit",
  "perfect candidate",
  "great communication skills",
  "excellent communication skills",
  "work well in teams",
  "work well under pressure",
  "jack of all trades",
  "hit the ground running",
  "take it to the next level",
  "i believe i would be a great asset",
  "great asset",
  "to whom it may concern",
  "i hope this email finds you well",
  "i hope you're doing well",
  "i hope you are doing well",
  "references available upon request",
  "thank you for your time and consideration",
  "i look forward to hearing from you",
];

/** Words in a text (whitespace separated). */
export function countWords(text) {
  const t = typeof text === "string" ? text.trim() : "";
  return t ? t.split(/\s+/).length : 0;
}

const norm = (s) => s.toLowerCase().replace(/[‘’]/g, "'");

/**
 * Deterministic cliche check (no AI). Returns [{ phrase, start, end }] sorted by start, non-overlapping
 * (the longest phrase wins at the same position). Offsets index into the ORIGINAL text.
 */
export function findCliches(text) {
  if (typeof text !== "string" || !text) return [];
  const hay = norm(text); // same length as text: only 1-char replacements
  const hits = [];
  for (const phrase of [...CLICHES].sort((a, b) => b.length - a.length)) {
    let from = 0;
    for (;;) {
      const i = hay.indexOf(phrase, from);
      if (i === -1) break;
      from = i + 1;
      const end = i + phrase.length;
      const before = i === 0 ? "" : hay[i - 1];
      const after = end >= hay.length ? "" : hay[end];
      if (/[a-z0-9]/.test(before) || /[a-z0-9]/.test(after)) continue; // whole phrase only
      hits.push({ phrase, start: i, end });
    }
  }
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const out = [];
  let last = -1;
  for (const h of hits) {
    if (h.start < last) continue;
    out.push(h);
    last = h.end;
  }
  return out;
}
