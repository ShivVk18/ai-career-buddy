// Generic undo tokens. Not a "use server" file; pure (no I/O). A token names an undo operation and its target id;
// the server action that runs it (src/actions/Undo.js) re-checks ownership, so a forged token can only touch the caller's own rows.
export const UNDO_KINDS = ["resume_restore", "resume_delete", "roadmap_delete"];

/** @returns {string} opaque base64url token */
export function makeUndoToken(kind, id) {
  if (!UNDO_KINDS.includes(kind) || typeof id !== "string" || !id || id.length > 100) throw new Error("Invalid undo target");
  return Buffer.from(JSON.stringify({ v: 1, k: kind, id }), "utf8").toString("base64url");
}

/** @returns {{ kind: string, id: string } | null} null for anything malformed or unknown. */
export function parseUndoToken(token) {
  if (typeof token !== "string" || token.length === 0 || token.length > 400) return null;
  try {
    const o = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!o || o.v !== 1 || !UNDO_KINDS.includes(o.k) || typeof o.id !== "string" || !o.id || o.id.length > 100) return null;
    return { kind: o.k, id: o.id };
  } catch {
    return null;
  }
}
