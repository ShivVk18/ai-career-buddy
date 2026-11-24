import { RUBRIC_CRITERIA, RUBRIC_LABELS, CRITERION_SCORE_MAX } from "@/lib/interview/rubric";

const SQUARES = 4;

/** Three criteria as filled squares, each with the quoted line from the answer and the reason. */
export default function RubricDots({ rubric, overall }) {
  const by = Object.fromEntries((rubric?.criteria || []).map((c) => [c.name, c]));
  const rows = RUBRIC_CRITERIA.map((n) => by[n]).filter(Boolean);
  return (
    <div className="space-y-4">
      {rows.map((c) => {
        const filled = Math.round((c.score / CRITERION_SCORE_MAX) * SQUARES);
        return (
          <div key={c.name}>
            <div className="flex items-center gap-6">
              <span className="w-24 font-doc text-base text-text">{RUBRIC_LABELS[c.name].toLowerCase()}</span>
              <span className="flex gap-3" role="img" aria-label={`${c.score} out of ${CRITERION_SCORE_MAX}`}>
                {Array.from({ length: SQUARES }, (_, i) => (
                  <i key={i} className={`block size-[18px] rounded-[3px] border-2 border-brand ${i < filled ? "bg-brand" : ""}`} />
                ))}
              </span>
              <span className="text-xs text-faint">{c.score}/{CRITERION_SCORE_MAX}</span>
            </div>
            {(c.quote || c.feedback) && (
              <div className="mt-1.5 space-y-0.5 pl-0 text-sm sm:pl-[120px]">
                {c.quote && <p className="font-doc italic text-text">&ldquo;{c.quote}&rdquo;</p>}
                {c.feedback && <p className="text-muted">{c.feedback}</p>}
              </div>
            )}
          </div>
        );
      })}
      {overall != null && <p className="text-xs text-faint">overall {overall}/100 · ai estimate</p>}
    </div>
  );
}
