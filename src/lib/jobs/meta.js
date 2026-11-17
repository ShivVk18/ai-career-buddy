// Verification of job chips (company, title, location). Pure, no I/O.
// Every value must be backed by job-description lines (D26): the cited ids must exist in the catalog,
// every word of the value must appear in those lines, and every number in the value must too.
import { inventedNumbers } from "../ai/numberCheck.js";
import { normalizeText, snapshot, validateSourceIds } from "../ai/sources.js";

export const JOB_FIELDS = ["company", "title", "location"];
export const MAX_FIELD = 200;

const tokens = (s) => normalizeText(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** One-line, trimmed, at most MAX_FIELD chars; "" when nothing usable. */
export function cleanFieldValue(v) {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_FIELD).trim();
}

/**
 * verifyJobField({ value, sourceIds }, catalog) -> { value, sources: Snapshot[] } | null
 * Only jd: ids count. Anything that can't be verified returns null.
 */
export function verifyJobField(field, catalog) {
  const value = cleanFieldValue(field?.value);
  if (!value) return null;
  const ids = validateSourceIds(field?.sourceIds, catalog).filter((id) => id.startsWith("jd:"));
  if (ids.length === 0) return null;
  const byId = new Map(catalog.map((c) => [c.id, c.text]));
  const cited = ids.map((id) => byId.get(id)).join("\n");
  const have = new Set(tokens(cited));
  const want = tokens(value);
  if (want.length === 0 || !want.every((t) => have.has(t))) return null;
  if (inventedNumbers(value, cited).length > 0) return null;
  return { value, sources: snapshot(ids, catalog) };
}

const HEADER = { title: /^Job title:\s*(.+)$/i, company: /^Company:\s*(.+)$/i, location: /^Location:\s*(.+)$/i };

/**
 * Chips read straight from the "Job title: / Company: / Location:" header lines that extractJobText writes
 * from a JSON-LD JobPosting. No AI. Returns { company?, title?, location? } each { value, sources }.
 */
export function chipsFromHeader(catalog) {
  const out = {};
  for (const item of catalog) {
    if (item.kind !== "jd" || !/^jd:\d+$/.test(item.id)) continue;
    for (const f of JOB_FIELDS) {
      const m = !out[f] && HEADER[f].exec(item.text);
      if (!m) continue;
      const v = verifyJobField({ value: m[1], sourceIds: [item.id] }, catalog);
      if (v) out[f] = v;
    }
  }
  return out;
}
