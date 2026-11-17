// gapData: result of getGapFrequency() ({ gaps, resultCount } or { error, code }).
export default function GapFrequency({ gapData }) {
  return (
    <div className="border border-divider bg-divider/10 p-8 rounded-sm">
      <h2 className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-2">
        Gaps ranked by frequency
      </h2>
      {gapData?.error ? (
        <p role="alert" className="text-sm text-muted-foreground">
          Couldn&apos;t load your skill gaps right now.
        </p>
      ) : !gapData?.gaps?.length ? (
        <p className="text-sm text-muted-foreground font-light">
          No gaps yet. Run an ATS check against a job description and the skills you&apos;re missing will be ranked here.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-6">
            Based on {gapData.resultCount} ATS result{gapData.resultCount === 1 ? "" : "s"}.
          </p>
          <ul className="flex flex-wrap gap-2">
            {gapData.gaps.slice(0, 20).map((g) => (
              <li
                key={g.skill}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-accent/30 bg-accent/5 rounded-sm text-xs text-foreground"
              >
                <span>{g.skill}</span>
                <span className="font-bold text-accent">{g.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
