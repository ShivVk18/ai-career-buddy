// Isomorphic (no server-only imports): used by the server and the browser so a legacy resume entry
// (saved before ids existed) gets the SAME id everywhere: catalog, client form, saved row, tailoring.

const SECTION_KEYS = { exp: "experience", edu: "education", proj: "projects" };

/** FNV-1a 32-bit, base36. Sync and environment independent. */
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(7, "0");
}

/** Deterministic id for an entry without one: l-<section>-<hash of section|index|title|organization|startDate>. */
export function legacyEntryId(section, index, entry) {
  const e = entry && typeof entry === "object" ? entry : {};
  const part = (v) => String(v ?? "").trim();
  const key = [section, index, part(e.title), part(e.organization), part(e.startDate)].join("|");
  return `l-${section}-${fnv1a(key)}`;
}

/**
 * Returns a copy of the resume JSON where experience (exp), education (edu) and projects (proj) entries
 * lacking an id get legacyEntryId. Existing ids are never changed.
 */
export function ensureEntryIds(resumeJson) {
  if (!resumeJson || typeof resumeJson !== "object") return resumeJson;
  const out = { ...resumeJson };
  for (const [section, key] of Object.entries(SECTION_KEYS)) {
    if (!Array.isArray(resumeJson[key])) continue;
    out[key] = resumeJson[key].map((e, i) => {
      if (!e || typeof e !== "object") return e;
      if (typeof e.id === "string" && e.id.trim()) return e;
      return { ...e, id: legacyEntryId(section, i, e) };
    });
  }
  return out;
}

/**
 * Short stable hash of a paragraph's text (whitespace collapsed, trimmed, case kept): 7 chars, base36.
 * Same result on the server and in the browser. Stored as sources.paragraphs[i].hash so the UI can map
 * source chips to a paragraph even after other paragraphs are edited.
 */
export function paragraphHash(text) {
  return fnv1a(String(text ?? "").replace(/\s+/g, " ").trim());
}
