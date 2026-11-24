import { RUBRIC_CRITERIA, RUBRIC_LABELS, RUBRIC_WEIGHTS, CRITERION_SCORE_MAX } from "@/lib/interview/rubric";
import { Quote } from "lucide-react";

// Answer text with the verified quote highlighted. A null range with a quote means the quote only matched
// after normalization, so it is shown below without highlighting.
function HighlightedAnswer({ text, ranges }) {
  const valid = ranges
    .filter((r) => Array.isArray(r) && r[0] >= 0 && r[1] > r[0] && r[1] <= text.length)
    .sort((a, b) => a[0] - b[0]);
  const parts = [];
  let pos = 0;
  valid.forEach(([s, e], i) => {
    if (s < pos) return; // overlapping range: skip
    if (s > pos) parts.push(<span key={`t${i}`}>{text.slice(pos, s)}</span>);
    parts.push(
      <mark key={`m${i}`} className="bg-primary/25 text-foreground rounded-[2px] px-0.5">
        {text.slice(s, e)}
      </mark>
    );
    pos = e;
  });
  if (pos < text.length) parts.push(<span key="end">{text.slice(pos)}</span>);
  return <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{parts}</p>;
}

export default function RubricCard({ answerText, rubric, overall }) {
  const byName = Object.fromEntries((rubric?.criteria || []).map((c) => [c.name, c]));
  const criteria = RUBRIC_CRITERIA.map((n) => byName[n]).filter(Boolean);
  const total = overall ?? rubric?.overall;

  return (
    <div className="border border-border bg-panel rounded-xl p-6 md:p-8 shadow-card space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">Overall</p>
          <p className="text-[10px] uppercase tracking-widest text-primary-ink font-bold mt-1">AI estimate</p>
        </div>
        <div className="text-4xl md:text-5xl font-clash font-bold text-foreground">
          {total}
          <span className="text-lg text-muted-foreground">/100</span>
        </div>
      </div>

      {rubric?.summary && (
        <p className="text-sm text-muted-foreground font-light leading-relaxed">{rubric.summary}</p>
      )}

      <div>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-2">Your answer</p>
        <div className="border border-divider bg-divider/5 rounded-xl p-4">
          <HighlightedAnswer text={answerText || ""} ranges={criteria.map((c) => c.quote ? c.quoteRange : null)} />
        </div>
      </div>

      <div className="space-y-4">
        {criteria.map((c) => (
          <div key={c.name} className="border border-divider rounded-xl p-4">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-foreground">
                {RUBRIC_LABELS[c.name]}{" "}
                <span className="text-muted-foreground font-medium">({c.weight ?? RUBRIC_WEIGHTS[c.name]}%)</span>
              </span>
              <span className="font-clash font-bold text-foreground">
                {c.score}/{CRITERION_SCORE_MAX}
              </span>
            </div>
            {c.quote && (
              <p className="flex gap-2 text-xs text-muted-foreground italic mb-2">
                <Quote className="w-3 h-3 mt-0.5 shrink-0 text-primary-ink" />
                <span>
                  {c.quoteRange ? (
                    <mark className="bg-primary/25 text-foreground not-italic rounded-[2px] px-0.5">{c.quote}</mark>
                  ) : (
                    c.quote
                  )}
                </span>
              </p>
            )}
            {c.feedback && <p className="text-sm text-muted-foreground font-light leading-relaxed">{c.feedback}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
