// Server-side checks for open interview scoring. Plain module (self-checkable in node).
import { normalizeText } from "../ai/sources.js";
import { inventedNumbers } from "../ai/numberCheck.js";

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

/**
 * A quote is valid only if it appears verbatim in the answer after normalizeText on both sides.
 * Returns { quote, range } or null. `quote` is the exact substring of the original answer when it can be
 * located (whitespace-flexible, case-insensitive), with `range` = [start, end) into the original answer;
 * otherwise (match only through normalization, e.g. hyphenation) the model's quote with range null.
 */
export function verifyQuote(quote, answerText) {
  const q = String(quote ?? "").trim();
  if (!q) return null;
  const nq = normalizeText(q);
  if (!nq || (nq.split(" ").length < 3 && q.length < 12)) return null; // too short to count as evidence
  if (!normalizeText(answerText).includes(nq)) return null;
  const parts = q.split(/\s+/).map(escapeRe);
  const m = new RegExp(parts.join("\\s+"), "i").exec(String(answerText));
  if (m) return { quote: m[0], range: [m.index, m.index + m[0].length] };
  return { quote: q, range: null };
}

/** Split into sentences, keeping the text (no trailing-space loss). */
const sentences = (t) => String(t ?? "").match(/[^.!?\n]+(?:[.!?]+|$)\s*/g) ?? [];

/**
 * Drops the sentences of `text` that contain a number the `allowed` text does not back.
 * Returns the cleaned text ("" when nothing is left).
 */
export function stripInventedSentences(text, allowed) {
  if (!text) return "";
  if (inventedNumbers(text, allowed).length === 0) return String(text).trim();
  return sentences(text)
    .filter((s) => inventedNumbers(s, allowed).length === 0)
    .join("")
    .trim();
}

/** Lowercase, whitespace-collapsed key for grouping skills / topics. */
export const normKey = (s) => String(s ?? "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
