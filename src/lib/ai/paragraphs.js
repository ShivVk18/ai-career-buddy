// Shared by cover letters and cold emails (D27/D28): structured paragraphs, every body paragraph
// must cite at least one catalog id. Unsourced body paragraphs are dropped after one retry.
import { runAIStructured } from "./index.js";
import { paragraphsSchema, emailParagraphsSchema } from "./schemas.js";
import { validateSourceIds, snapshot } from "./sources.js";
import { inventedNumbers } from "./numberCheck.js";
import { paragraphHash } from "../entryIds.js";

export class NoSourcesError extends Error {
  constructor() {
    super("No sourced paragraphs");
    this.name = "NoSourcesError";
    this.code = "NO_SOURCES";
  }
}

const RETRY_NOTE =
  "\n\nIMPORTANT: your previous answer had body paragraphs without valid sourceIds. Every body paragraph MUST list at least one id copied exactly from the SOURCES list, and must only state facts found in those sources.";

// `allowedText`: every number in the output must appear in it (inventedNumbers). A body paragraph that
// fails is treated as unsourced (retry, then dropped). A greeting/closing is never dropped for an unbacked
// number: it is replaced with a safe default ("Hello," / "Best regards," + name).
function clean(parsed, catalog, allowedText, userName) {
  return parsed.paragraphs
    .map((p) => {
      const text = p.text.replace(/\r/g, "").replace(/\n{2,}/g, "\n").trim();
      const bad = allowedText != null && inventedNumbers(text, allowedText).length > 0;
      if (bad && p.kind === "greeting") return { kind: p.kind, text: "Hello,", ids: [] };
      if (bad && p.kind === "closing") {
        const name = String(userName ?? "").replace(/\s+/g, " ").trim();
        return { kind: p.kind, text: name ? `Best regards,\n${name}` : "Best regards,", ids: [] };
      }
      return { kind: p.kind, text, ids: bad ? [] : validateSourceIds(p.sourceIds, catalog) };
    })
    .filter((p) => p && p.text);
}

const SUBJECT_MAX = 80;
// Unsourced marketing/performance claims are never allowed in a subject.
const SUBJECT_CLAIM = /%|open[- ]?rate|guarantee|#\s?1|\bfree\b|\bwin\b|act now|urgent|re:|fwd:/i;

/** A subject is kept only with >= 1 valid source id, no claims, no invented numbers. */
function cleanSubject(subject, catalog, allowedText) {
  if (!subject) return null;
  const text = String(subject.text ?? "").replace(/\s+/g, " ").trim().replace(/^["']|["']$/g, "");
  if (!text || text.length > SUBJECT_MAX || SUBJECT_CLAIM.test(text)) return null;
  if (allowedText != null && inventedNumbers(text, allowedText).length > 0) return null;
  const ids = validateSourceIds(subject.sourceIds, catalog);
  return ids.length ? { text, ids } : null;
}

/** A greeting is only valid as the first paragraph and a closing as the last; extras count as body. */
function normalizeShape(ps) {
  return ps.map((p, i) => {
    if (p.kind === "greeting" && i !== 0) return { ...p, kind: "body" };
    if (p.kind === "closing" && i !== ps.length - 1) return { ...p, kind: "body" };
    return p;
  });
}

const unsourced = (ps) => ps.filter((p) => p.kind === "body" && p.ids.length === 0).length;

/**
 * @param {object} o
 * @param {string} o.prompt
 * @param {Array} o.catalog
 * @param {string} o.userId
 * @param {string} [o.allowedText] when set, numbers in the output must appear in it (inventedNumbers)
 * @param {string} [o.userName] used in the default closing when a closing has an unbacked number
 * @param {boolean} [o.withSubject] cold email: also read and verify a `subject`
 * @returns {{ content: string, sources: object, subject: {text: string, sources: object[]} | null }}
 * content = paragraphs joined by a blank line; sources = { version: 1, paragraphs: [{ kind, hash, sources }] } (hash = paragraphHash of the paragraph text).
 * @throws NoSourcesError when no body paragraph can be sourced.
 */
export async function generateSourcedParagraphs({ prompt, catalog, userId, allowedText, withSubject = false, userName = null }) {
  const schema = withSubject ? emailParagraphsSchema : paragraphsSchema;
  const run = async (note) => {
    const parsed = await runAIStructured("write", schema, () => [["user", prompt + note]], { userId });
    return {
      ps: normalizeShape(clean(parsed, catalog, allowedText, userName)),
      subject: withSubject ? cleanSubject(parsed.subject, catalog, allowedText) : null,
    };
  };

  let { ps, subject } = await run("");
  if (unsourced(ps) > 0) {
    try {
      const retry = await run(RETRY_NOTE);
      if (unsourced(retry.ps) <= unsourced(ps)) {
        ps = retry.ps;
        subject = retry.subject ?? subject;
      }
    } catch {
      // keep the first attempt's usable paragraphs
    }
  }
  ps = ps.filter((p) => p.kind !== "body" || p.ids.length > 0);
  if (!ps.some((p) => p.kind === "body")) throw new NoSourcesError();

  return {
    content: ps.map((p) => p.text).join("\n\n"),
    sources: {
      version: 1,
      paragraphs: ps.map((p) => ({ kind: p.kind, hash: paragraphHash(p.text), sources: snapshot(p.ids, catalog) })),
    },
    subject: subject ? { text: subject.text, sources: snapshot(subject.ids, catalog) } : null,
  };
}

/** Text that backs the numbers in a generated letter/email: the whole catalog plus caller-given strings. */
export function allowedNumberText(catalog, ...extra) {
  return [...catalog.map((c) => c.text), ...extra.filter(Boolean)].join("\n");
}

/**
 * After shorten: returns `sources` with the hash refreshed for every paragraph whose text was rewritten.
 * Source ids/snapshots are never touched, and paragraphs that had no hash (older letters) stay without one.
 */
export function withUpdatedHashes(sources, oldParas, newParas) {
  const list = sources?.paragraphs;
  if (!Array.isArray(list)) return sources;
  return {
    ...sources,
    paragraphs: list.map((p, i) =>
      p && typeof p === "object" && typeof p.hash === "string" && newParas[i] !== oldParas[i]
        ? { ...p, hash: paragraphHash(newParas[i]) }
        : p
    ),
  };
}
