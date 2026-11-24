// Generic undo tokens. Not a "use server" file; pure (no I/O). A token names an undo operation and its target id;
// the server action that runs it (src/actions/Undo.js) re-checks ownership, so a forged token can only touch the caller's own rows.
export const UNDO_KINDS = ["resume_restore", "resume_delete", "roadmap_delete", "status_move", "followup_approve", "roadmap_gap"];

/**
 * `data` is optional small extra state (status_move: { s: previousStatus, i: previousInterviewAt | null }).
 * @returns {string} opaque base64url token
 */
export function makeUndoToken(kind, id, data) {
  if (!UNDO_KINDS.includes(kind) || typeof id !== "string" || !id || id.length > 100) throw new Error("Invalid undo target");
  const o = { v: 1, k: kind, id };
  if (data && typeof data === "object") o.d = data;
  return Buffer.from(JSON.stringify(o), "utf8").toString("base64url");
}

/** @returns {{ kind: string, id: string, data?: object } | null} null for anything malformed or unknown. */
export function parseUndoToken(token) {
  if (typeof token !== "string" || token.length === 0 || token.length > 400) return null;
  try {
    const o = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!o || o.v !== 1 || !UNDO_KINDS.includes(o.k) || typeof o.id !== "string" || !o.id || o.id.length > 100) return null;
    const out = { kind: o.k, id: o.id };
    if (o.d && typeof o.d === "object" && !Array.isArray(o.d)) out.data = o.d;
    return out;
  } catch {
    return null;
  }
}
