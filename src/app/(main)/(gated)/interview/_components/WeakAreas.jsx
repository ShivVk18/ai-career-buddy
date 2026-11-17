import { generationErrorMessage } from "@/components/shared/generationError";
import { WEAK_AREA_MIN_ANSWERS } from "@/lib/interview/rubric";

// weak: result of getWeakAreas() ({ topics, minAnswers, totalAnswers, hiddenTopics } or { error, code }).
export default function WeakAreas({ weak }) {
  if (!weak || weak.error) {
    return (
      <p role="alert" className="text-sm text-muted-foreground border border-dashed border-divider rounded-sm p-6">
        {generationErrorMessage(weak, "Couldn't load your weak areas.")}
      </p>
    );
  }
  const min = weak.minAnswers ?? WEAK_AREA_MIN_ANSWERS;
  if (!weak.topics?.length) {
    return (
      <p className="text-sm text-muted-foreground font-light border border-dashed border-divider rounded-sm p-6">
        Weak areas appear once you have answered at least {min} questions on the same topic in open practice.
        {weak.hiddenTopics > 0 && ` ${weak.hiddenTopics} topic${weak.hiddenTopics === 1 ? " has" : "s have"} too few answers so far.`}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {weak.topics.map((t) => (
          <li key={t.topic} className="border border-border rounded-sm p-4">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-sm font-medium text-foreground truncate">{t.topic}</span>
              <span className="text-sm font-clash font-bold text-foreground shrink-0">
                {t.average}/100 <span className="text-[10px] text-muted-foreground font-sans font-medium">({t.count} answers)</span>
              </span>
            </div>
            <div className="h-1.5 bg-divider/30 rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, t.average))}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        Weakest first. AI estimates from your own answers.
        {weak.hiddenTopics > 0 && ` ${weak.hiddenTopics} more topic${weak.hiddenTopics === 1 ? "" : "s"} hidden until ${min} answers.`}
      </p>
    </div>
  );
}
