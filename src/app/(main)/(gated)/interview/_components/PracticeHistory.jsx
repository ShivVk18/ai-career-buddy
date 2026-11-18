import Link from "next/link";
import { format } from "date-fns";
import { generationErrorMessage } from "@/components/shared/generationError";

// history: result of getPracticeHistory() ({ sessions } or { error, code }).
export default function PracticeHistory({ history }) {
  if (!history || history.error) {
    return (
      <p role="alert" className="text-sm text-muted-foreground border border-dashed border-divider rounded-xl p-6">
        {generationErrorMessage(history, "Couldn't load your practice history.")}
      </p>
    );
  }
  if (!history.sessions?.length) {
    return (
      <p className="text-sm text-muted-foreground font-light border border-dashed border-divider rounded-xl p-6">
        No open practice yet. Start a session to see your answers and scores here.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {history.sessions.map((s) => (
        <li key={s.sessionId}>
          <Link
            href={`/interview/practice/${s.sessionId}`}
            className="block border border-border rounded-xl p-4 hover:border-primary hover:bg-divider/5 transition-editorial"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {format(new Date(s.createdAt), "MMM dd, yyyy HH:mm")} // {s.answered}/{s.total} answered
                  {!s.completed && " // in progress"}
                </p>
                {s.topics?.length > 0 && (
                  <p className="text-sm text-foreground truncate mt-1">{s.topics.join(", ")}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-clash font-bold text-foreground">
                  {s.averageOverall ?? "-"}
                  {s.averageOverall !== null && <span className="text-xs text-muted-foreground">/100</span>}
                </p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary-ink">AI estimate</p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
