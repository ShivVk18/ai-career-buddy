// Classifies the home input: a job link, pasted job text, or a question for chat (D55, D62).
// Pure, no AI, no network. Safe to import anywhere.

const URL_RE = /\bhttps?:\/\/[^\s<>"']+/i;
const BARE_URL_RE = /^(?:www\.)[^\s]+\.[^\s]+$/i;
const QUESTION_START =
  /^(what|whats|what's|how|why|when|where|which|who|whom|can|could|should|would|will|do|does|did|is|are|am|was|were|have|has|help|tell|explain|give|show|suggest|recommend|write|draft|compare|review|find)\b/i;

// Words that show up in job descriptions and almost never in a question to a coach.
const JOB_WORDS = [
  /\bresponsibilit(?:y|ies)\b/i,
  /\brequirements?\b/i,
  /\bqualifications?\b/i,
  /\bwhat you(?:'|’)?ll (?:do|need|bring)\b/i,
  /\bwho you are\b/i,
  /\babout (?:the|this) (?:role|job|position|team)\b/i,
  /\bwe(?:'|’)?re (?:looking|hiring)\b|\bwe are (?:looking|hiring)\b/i,
  /\b(?:apply|applicants?|candidates?)\b/i,
  /\byears? of (?:professional )?experience\b/i,
  /\b(?:full|part)[- ]time\b|\bcontract\b|\bpermanent\b/i,
  /\bsalary\b|\bcompensation\b|\bbenefits\b|\bequal opportunity\b/i,
  /\b(?:nice|good|great) to have\b|\bpreferred\b|\bminimum\b/i,
  /\b(?:hybrid|on-?site|remote)\b/i,
  /\bjob (?:description|title|summary)\b/i,
];

export const countJobWords = (text) => JOB_WORDS.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);

/** True when text reads like a job posting (used for fetched pages). */
export function looksLikeJob(text) {
  const t = String(text ?? "").trim();
  return t.length >= 150 && countJobWords(t) >= 2;
}

export const MIN_JOB_TEXT = 40;

/**
 * classifyInput(input) -> { kind: "url", url } | { kind: "text", text } | { kind: "question", text } | { kind: "empty" }
 *
 * - URL: the whole input is a link, or a link plus a few words (at most 80 other characters).
 * - Job text: three or more job-description phrases from 150 characters up; or one phrase from 400;
 *   or very long (1200+). A trailing "?" or a leading question word only wins when fewer than 3 phrases.
 * - Everything else is a question for chat (no AI call here).
 */
export function classifyInput(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return { kind: "empty" };

  const m = raw.match(URL_RE);
  if (m) {
    const url = m[0].replace(/[),.;:!?]+$/, "");
    if (raw.replace(m[0], "").trim().length <= 80) return { kind: "url", url };
  } else if (!/\s/.test(raw) && BARE_URL_RE.test(raw)) {
    return { kind: "url", url: `https://${raw}` };
  }

  const hits = countJobWords(raw);
  const len = raw.length;
  if (hits >= 3 && len >= 150) return { kind: "text", text: raw };
  const isQuestion = raw.endsWith("?") || QUESTION_START.test(raw);
  if (isQuestion && len <= 600) return { kind: "question", text: raw };
  if ((len >= 400 && hits >= 1) || len >= 1200) return { kind: "text", text: raw };
  return { kind: "question", text: raw };
}
