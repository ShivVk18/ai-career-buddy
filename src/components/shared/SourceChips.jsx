import { Link2 } from "lucide-react";
import { paragraphHash } from "@/lib/entryIds";

export const LEGACY_SOURCES_LABEL = "Created before sources were added";

export function LegacySourcesLabel({ className = "" }) {
  return (
    <p
      className={`text-[10px] font-medium tracking-widest uppercase text-muted-foreground/60 ${className}`}
    >
      {LEGACY_SOURCES_LABEL}
    </p>
  );
}

/**
 * Renders Snapshot chips ({ id, label, excerpt }).
 * - legacy: shows the "Created before sources were added" label.
 * - heading: optional prefix such as "Based on".
 * Renders nothing for an empty list unless legacy is set.
 */
export default function SourceChips({ sources, legacy = false, heading, className = "" }) {
  if (legacy) return <LegacySourcesLabel className={className} />;
  if (!Array.isArray(sources) || sources.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {heading && (
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
          {heading}
        </span>
      )}
      {sources.map((s, i) => (
        <span
          key={`${s.id ?? "src"}-${i}`}
          title={s.excerpt || s.label}
          className="inline-flex max-w-full items-center gap-1.5 px-2 py-1 border border-accent/30 bg-accent/5 rounded-sm text-[10px] font-medium tracking-wide text-foreground cursor-help"
        >
          <Link2 className="h-3 w-3 text-accent shrink-0" />
          <span className="truncate">{s.label}</span>
        </span>
      ))}
    </div>
  );
}

/** Union of snapshots, deduped by id (keeps first occurrence). */
export function uniqueSources(lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists || []) {
    for (const s of list || []) {
      const key = s?.id ?? s?.label;
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push(s);
      }
    }
  }
  return out;
}

/**
 * Maps content paragraphs to stored paragraph sources.
 * - hashes present: match by paragraphHash(text); edited paragraphs get null sources.
 * - legacy (no hashes): old index rule, only when paragraph counts agree.
 * Returns { parts: [{ text, sources|null }], mode: "hash"|"index"|"none", unmatched: [snapshots] }.
 */
export function mapParagraphSources(content, sources) {
  const meta = Array.isArray(sources?.paragraphs) ? sources.paragraphs : null;
  const texts = (content || "").split(/\n{2,}/).filter(Boolean);
  if (!meta) return { parts: texts.map((text) => ({ text, sources: null })), mode: "none", unmatched: [] };

  const hashed = meta.length > 0 && meta.every((p) => typeof p?.hash === "string" && p.hash);
  if (hashed) {
    const used = new Set();
    const parts = texts.map((text) => {
      const h = paragraphHash(text);
      const idx = meta.findIndex((p, j) => !used.has(j) && p.hash === h);
      if (idx === -1) return { text, sources: null };
      used.add(idx);
      return { text, sources: meta[idx].sources || [] };
    });
    const unmatched = uniqueSources(meta.filter((_, j) => !used.has(j)).map((p) => p.sources));
    return { parts, mode: "hash", unmatched };
  }

  if (texts.length === meta.length) {
    return { parts: texts.map((text, i) => ({ text, sources: meta[i]?.sources || [] })), mode: "index", unmatched: [] };
  }
  return {
    parts: texts.map((text) => ({ text, sources: null })),
    mode: "index",
    unmatched: uniqueSources(meta.map((p) => p.sources)),
  };
}

/**
 * Sources for a letter/email (see mapParagraphSources).
 * - sources null/undefined: legacy label
 * - edited/unmatched paragraphs show no chips; a "Based on" list covers unmatched sources
 */
export function ParagraphSources({ content, sources }) {
  const wrap = (children) => (
    <div className="border border-border bg-background rounded-sm p-8 shadow-2xl space-y-4">
      <h3 className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase flex items-center gap-4">
        <Link2 className="h-4 w-4 text-accent" />
        Sources
      </h3>
      {children}
    </div>
  );

  if (!Array.isArray(sources?.paragraphs)) return wrap(<LegacySourcesLabel />);

  const { parts, unmatched } = mapParagraphSources(content, sources);
  const anyMatched = parts.some((p) => p.sources);
  if (!anyMatched) {
    return wrap(
      unmatched.length > 0 ? (
        <SourceChips sources={unmatched} heading="Based on" />
      ) : (
        <p className="text-xs text-muted-foreground">No sources recorded.</p>
      )
    );
  }

  return wrap(
    <div className="space-y-5">
      <ol className="space-y-5">
        {parts.map(({ text, sources: ps }, i) => {
          const snippet = text.replace(/\s+/g, " ").trim();
          return (
            <li key={i} className="space-y-2">
              <p className="text-xs text-muted-foreground font-general line-clamp-2">
                {snippet.length > 140 ? `${snippet.slice(0, 140)}...` : snippet}
              </p>
              {ps?.length > 0 && <SourceChips sources={ps} />}
            </li>
          );
        })}
      </ol>
      {unmatched.length > 0 && <SourceChips sources={unmatched} heading="Based on" />}
    </div>
  );
}
