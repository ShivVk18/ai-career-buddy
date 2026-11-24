import { regenerateCoverLetter, shortenCoverLetter } from "@/actions/CoverLetter";

// The cover-letter rewrite switches. None of them asks for confirmation: the server keeps the previous text
// (sources.previous), and the caller shows a 5 s Undo that calls undoLetterChange.
export const LETTER_SWITCHES = [
  { key: "shorten", label: "shorter", done: "Letter shortened" },
  { key: "formal", label: "more formal", done: "Letter made more formal" },
  { key: "warmer", label: "warmer", done: "Letter made warmer" },
];

export function runLetterSwitch(id, key, tone) {
  if (key === "shorten") return shortenCoverLetter(id);
  if (key === "formal") return regenerateCoverLetter(id, { formality: "formal" });
  if (key === "warmer") return regenerateCoverLetter(id, { tone: "warmer" });
  return regenerateCoverLetter(id, tone ? { tone } : {});
}
