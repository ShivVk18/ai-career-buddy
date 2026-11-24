import { ensureEntryIds } from "@/lib/entryIds";

const norm = (t) => String(t ?? "").replace(/^\s*(?:[-*•]\s*)?/, "").replace(/\s+/g, " ").trim();

function findEntry(resume, entryId) {
  if (!resume) return null;
  const safe = ensureEntryIds(resume);
  const [kind, ...rest] = String(entryId).split(":");
  const list = kind === "exp" ? safe.experience : kind === "proj" ? safe.projects : null;
  return Array.isArray(list) ? list.find((e) => e && String(e.id) === rest.join(":")) || null : null;
}

const sourceText = (p) => {
  const src = (Array.isArray(p.sources) ? p.sources : []).slice(0, 3).map((s) => (s.excerpt ? `${s.label}: "${s.excerpt.length > 110 ? `${s.excerpt.slice(0, 110)}...` : s.excerpt}"` : s.label));
  return [p.reason, ...src].filter(Boolean).join(" · ") || "from your resume and the job description";
};

/**
 * Proposals + saved resume -> TrackedChangeDoc lines. Untouched bullets around a change are "keep" lines;
 * a keep line that contains a matched term gets the highlight sweep.
 * Without a resume, only the changes are listed.
 */
export function buildReviewLines(proposals, resume, matchedTerms = []) {
  const terms = matchedTerms.filter((t) => typeof t === "string" && t.length > 2);
  const seen = new Set();
  const out = [];
  const hlFor = (text) => {
    const low = text.toLowerCase();
    const t = terms.find((x) => low.includes(x.toLowerCase()));
    if (!t) return undefined;
    const i = low.indexOf(t.toLowerCase());
    return text.slice(i, i + t.length);
  };
  proposals.forEach((p, k) => {
    const entry = findEntry(resume, p.entryId);
    if (entry && !seen.has(p.entryId)) {
      seen.add(p.entryId);
      const changed = new Set(proposals.filter((x) => x.entryId === p.entryId).map((x) => norm(x.original)));
      const keeps = String(entry.description ?? "").split("\n").map(norm).filter((b) => b && !changed.has(b));
      keeps.slice(0, 2).forEach((text, i) => out.push({ id: `keep:${p.entryId}:${i}`, kind: "keep", text, hl: hlFor(text) }));
    }
    out.push({ id: p.proposalId, kind: "change", before: p.original, after: p.proposed, source: { n: k + 1, text: sourceText(p) } });
  });
  return out;
}
