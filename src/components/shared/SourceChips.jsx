import { Link2 } from "lucide-react";

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
 * Sources for a letter/email. Maps content.split(/\n{2,}/)[i] to sources.paragraphs[i].
 * - sources null/undefined: legacy label
 * - paragraph count differs (user edited): one "Based on" list of all unique snapshots
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

  const paragraphsMeta = Array.isArray(sources?.paragraphs) ? sources.paragraphs : null;
  if (!paragraphsMeta) return wrap(<LegacySourcesLabel />);

  const parts = (content || "").split(/\n{2,}/).filter(Boolean);
  if (parts.length !== paragraphsMeta.length) {
    const all = uniqueSources(paragraphsMeta.map((p) => p.sources));
    return wrap(
      all.length > 0 ? (
        <SourceChips sources={all} heading="Based on" />
      ) : (
        <p className="text-xs text-muted-foreground">No sources recorded.</p>
      )
    );
  }

  return wrap(
    <ol className="space-y-5">
      {parts.map((text, i) => {
        const snippet = text.replace(/\s+/g, " ").trim();
        return (
          <li key={i} className="space-y-2">
            <p className="text-xs text-muted-foreground font-general line-clamp-2">
              {snippet.length > 140 ? `${snippet.slice(0, 140)}...` : snippet}
            </p>
            {paragraphsMeta[i]?.sources?.length > 0 && (
              <SourceChips sources={paragraphsMeta[i].sources} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
