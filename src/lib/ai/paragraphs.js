// Shared by cover letters and cold emails (D27/D28): structured paragraphs, every body paragraph
// must cite at least one catalog id. Unsourced body paragraphs are dropped after one retry.
import { runAIStructured } from "./index.js";
import { paragraphsSchema } from "./schemas.js";
import { validateSourceIds, snapshot } from "./sources.js";

export class NoSourcesError extends Error {
  constructor() {
    super("No sourced paragraphs");
    this.name = "NoSourcesError";
    this.code = "NO_SOURCES";
  }
}

const RETRY_NOTE =
  "\n\nIMPORTANT: your previous answer had body paragraphs without valid sourceIds. Every body paragraph MUST list at least one id copied exactly from the SOURCES list, and must only state facts found in those sources.";

function clean(parsed, catalog) {
  return parsed.paragraphs
    .map((p) => ({
      kind: p.kind,
      text: p.text.replace(/\r/g, "").replace(/\n{2,}/g, "\n").trim(),
      ids: validateSourceIds(p.sourceIds, catalog),
    }))
    .filter((p) => p.text);
}

const unsourced = (ps) => ps.filter((p) => p.kind === "body" && p.ids.length === 0).length;

/**
 * @returns {{ content: string, sources: object }} content = paragraphs joined by a blank line;
 * sources = { version: 1, paragraphs: [{ kind, sources: Snapshot[] }] } (same order and count).
 * @throws NoSourcesError when no body paragraph can be sourced.
 */
export async function generateSourcedParagraphs({ prompt, catalog, userId }) {
  const run = async (note) =>
    clean(
      await runAIStructured("write", paragraphsSchema, () => [["user", prompt + note]], { userId }),
      catalog
    );

  let ps = await run("");
  if (unsourced(ps) > 0) {
    const retry = await run(RETRY_NOTE);
    if (unsourced(retry) <= unsourced(ps)) ps = retry;
  }
  ps = ps.filter((p) => p.kind !== "body" || p.ids.length > 0);
  if (!ps.some((p) => p.kind === "body")) throw new NoSourcesError();

  return {
    content: ps.map((p) => p.text).join("\n\n"),
    sources: {
      version: 1,
      paragraphs: ps.map((p) => ({ kind: p.kind, sources: snapshot(p.ids, catalog) })),
    },
  };
}
