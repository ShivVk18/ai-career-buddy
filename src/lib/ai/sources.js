// Source catalog for Phase 3 (D26-D28). Server-only helpers: build a catalog of things the
// user actually provided, let the model cite ids from it, and verify every cited id here.
import { randomUUID } from "node:crypto";

const EXCERPT_MAX = 200;
const JD_MAX_LINES = 150;
const PROMPT_TEXT_MAX = 400;

const clip = (s, n) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** Lowercase + collapse whitespace. Used to match resume quotes against extracted PDF text. */
export function normalizeText(s) {
  return String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
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
 * resume:summary, resume:skills, jd:<lineNo> (1-based line of the job description).
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
      .split(/\r?\n/)
      .forEach((line, i) => {
        const t = line.trim();
        if (t && i < JD_MAX_LINES) cat.push({ id: `jd:${i + 1}`, kind: "jd", label: `Job description, line ${i + 1}`, text: t });
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
  return catalog.map((c) => `[${c.id}] ${c.label}: ${clip(c.text, PROMPT_TEXT_MAX)}`).join("\n");
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
