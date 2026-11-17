// Source catalog for Phase 3 (D26-D28). Server-only helpers: build a catalog of things the
// user actually provided, let the model cite ids from it, and verify every cited id here.
import { randomUUID } from "node:crypto";

const EXCERPT_MAX = 200;
const JD_MAX_CHARS = 20000; // matches the input limit, so a maximum-size JD fits fully
const JD_CHUNK_MAX = 400;
const PROMPT_TEXT_MAX = 400;

const clip = (s, n) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/**
 * Normalize for matching resume quotes against extracted PDF text: NFKC (ligatures etc.), smart
 * quotes and dashes to ASCII, soft hyphens removed, "-\n" hyphenation joined, whitespace
 * collapsed, lowercase. Apply to both sides.
 */
export function normalizeText(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .replace(/\u00ad/g, "")
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/(\w)-\s*\r?\n\s*(\w)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Split text into pieces of at most `max` chars, on sentence boundaries, else word boundaries. */
function chunkText(text, max) {
  const out = [];
  let rest = text.trim();
  while (rest.length > max) {
    const win = rest.slice(0, max + 1);
    let cut = -1;
    const re = /[.!?;](?=\s)/g;
    let m;
    while ((m = re.exec(win))) cut = m.index + 1;
    if (cut < max * 0.4) cut = win.lastIndexOf(" ");
    if (cut < max * 0.4) cut = max; // no usable boundary: hard split
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

function entryItems(entries, prefix, kindLabel, kind) {
  if (!Array.isArray(entries)) return [];
  const out = [];
  entries.forEach((e, i) => {
    if (!e || typeof e !== "object") return;
    const title = String(e.title ?? "").trim();
    const org = String(e.organization ?? "").trim();
    const desc = String(e.description ?? "").trim();
    if (!title && !org && !desc) return;
    // Entries saved before Phase 3 have no id; fall back to a position id (not stable across edits).
    const id = `${prefix}:${e.id ? String(e.id) : `i${i}`}`;
    const dates = [e.startDate, e.current ? "Present" : e.endDate].filter(Boolean).join(" - ");
    const label = `${kindLabel}: ${[title, org].filter(Boolean).join(" at ")}`.trim();
    out.push({ id, kind, label, text: [title, org, dates, desc].filter(Boolean).join(". ") });
  });
  return out;
}

/**
 * buildSources({ profile, resume, jobDescription, extra }) -> [{ id, kind, label, text }]
 * ids: exp:<entryId>, edu:<entryId>, proj:<entryId>, profile:skills|bio|experience|industry,
 * resume:summary, resume:skills, jd:<lineNo> (1-based line of the job description; lines over 400
 * chars are split into jd:<lineNo>.<n> chunks, n from 1).
 * `extra` appends caller-defined items (e.g. input:current, input:targetRole).
 */
export function buildSources({ profile, resume, jobDescription, extra } = {}) {
  const cat = [];
  if (profile) {
    if (profile.industry) cat.push({ id: "profile:industry", kind: "profile", label: "Profile: industry", text: String(profile.industry) });
    if (Array.isArray(profile.skills) && profile.skills.length)
      cat.push({ id: "profile:skills", kind: "profile", label: "Profile: skills", text: profile.skills.join(", ") });
    if (profile.bio && String(profile.bio).trim())
      cat.push({ id: "profile:bio", kind: "profile", label: "Profile: background", text: String(profile.bio).trim() });
    if (profile.experience !== null && profile.experience !== undefined && profile.experience !== "")
      cat.push({ id: "profile:experience", kind: "profile", label: "Profile: years of experience", text: `${profile.experience} years of experience` });
  }
  if (resume) {
    if (resume.summary && String(resume.summary).trim())
      cat.push({ id: "resume:summary", kind: "resume", label: "Resume: summary", text: String(resume.summary).trim() });
    if (resume.skills && String(resume.skills).trim())
      cat.push({ id: "resume:skills", kind: "resume", label: "Resume: skills", text: String(resume.skills).trim() });
    cat.push(...entryItems(resume.experience, "exp", "Experience", "experience"));
    cat.push(...entryItems(resume.education, "edu", "Education", "education"));
    cat.push(...entryItems(resume.projects, "proj", "Project", "project"));
  }
  if (jobDescription && String(jobDescription).trim()) {
    String(jobDescription)
      .slice(0, JD_MAX_CHARS)
      .split(/\r?\n/)
      .forEach((line, i) => {
        const t = line.trim();
        if (!t) return;
        const label = `Job description, line ${i + 1}`;
        if (t.length <= JD_CHUNK_MAX) {
          cat.push({ id: `jd:${i + 1}`, kind: "jd", label, text: t });
        } else {
          chunkText(t, JD_CHUNK_MAX).forEach((part, n) =>
            cat.push({ id: `jd:${i + 1}.${n + 1}`, kind: "jd", label: `${label} (part ${n + 1})`, text: part })
          );
        }
      });
  }
  if (Array.isArray(extra)) cat.push(...extra.filter((x) => x?.id && x?.text));
  return cat;
}

/** Returns the unique ids that exist in the catalog, in order. Unknown ids are dropped. */
export function validateSourceIds(ids, catalog) {
  if (!Array.isArray(ids)) return [];
  const known = new Set(catalog.map((c) => c.id));
  const out = [];
  for (const id of ids) {
    if (typeof id === "string" && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/** Stored with the record: [{ id, kind, label, excerpt }] for the valid ids. */
export function snapshot(ids, catalog) {
  const byId = new Map(catalog.map((c) => [c.id, c]));
  return validateSourceIds(ids, catalog).map((id) => {
    const c = byId.get(id);
    return { id: c.id, kind: c.kind, label: c.label, excerpt: clip(c.text, EXCERPT_MAX) };
  });
}

/** Catalog rendered for a prompt, one line per source: [id] label: text */
export function formatCatalogForPrompt(catalog) {
  // JD text is never clipped (chunks are already <= 400 chars); other items are.
  return catalog
    .map((c) => `[${c.id}] ${c.label}: ${c.kind === "jd" ? c.text : clip(c.text, PROMPT_TEXT_MAX)}`)
    .join("\n");
}

/** Adds a stable id to entries that lack one. Existing ids are kept; duplicate ids are regenerated. */
export function assignEntryIds(entries) {
  if (!Array.isArray(entries)) return [];
  const seen = new Set();
  return entries.map((e) => {
    if (!e || typeof e !== "object") return e;
    let id = typeof e.id === "string" && e.id.trim() ? e.id.trim() : "";
    if (!id || seen.has(id)) id = `e_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    seen.add(id);
    return { ...e, id };
  });
}
