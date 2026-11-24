import { Chip } from "@/components/ui/Chip";

// gapData: result of getGapFrequency() ({ gaps, resultCount } or { error, code }).
export default function GapFrequency({ gapData }) {
  return (
    <section aria-label="gaps ranked by frequency" className="rounded-[20px] border border-line bg-panel p-5 shadow-card sm:p-6">
      <h2 className="font-doc text-xl text-text">gaps, most common first</h2>
      {gapData?.error ? (
        <p role="alert" className="mt-2 text-sm text-danger">couldn&apos;t load your skill gaps right now.</p>
      ) : !gapData?.gaps?.length ? (
        <p className="mt-2 text-sm text-muted">no gaps yet. scan your resume against a job and the skills you&apos;re missing are ranked here.</p>
      ) : (
        <>
          <p className="mb-4 mt-1 text-xs text-faint">
            from {gapData.resultCount} scan{gapData.resultCount === 1 ? "" : "s"}.
          </p>
          <ul className="flex flex-wrap gap-2">
            {gapData.gaps.slice(0, 20).map((g) => (
              <li key={g.skill}>
                <Chip tone="gap" editable={false} value={`${g.skill} · ${g.count}`} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
