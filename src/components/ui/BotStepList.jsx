import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

function Dot({ status }) {
  if (status === "done")
    return (
      <span className="grid size-7 place-items-center rounded-full bg-brand text-white transition-colors duration-300">
        <Check className="size-4" strokeWidth={3} />
      </span>
    );
  if (status === "error")
    return (
      <span className="grid size-7 place-items-center rounded-full bg-gap-ink text-white">
        <X className="size-4" strokeWidth={3} />
      </span>
    );
  if (status === "running")
    return (
      <span
        className="size-7 animate-spin rounded-full border-[3px] border-brand border-t-transparent motion-reduce:animate-none"
        aria-hidden="true"
      />
    );
  return <span className="size-7 rounded-full border-[3px] border-line" aria-hidden="true" />;
}

/**
 * steps: [{ id, label, detail, status: "waiting"|"running"|"done"|"error", result }]
 * result is a short string shown as a chip once done.
 */
export default function BotStepList({ steps, className }) {
  return (
    <ol className={cn("divide-y divide-line", className)}>
      {steps.map((s) => (
        <li key={s.id} className="flex items-center gap-4 py-4" aria-current={s.status === "running" ? "step" : undefined}>
          <Dot status={s.status} />
          <div className="min-w-0 flex-1">
            <p className={cn("text-lg", s.status === "waiting" ? "text-faint" : "text-text")}>{s.label}</p>
            {s.detail && <p className="truncate text-sm text-muted">{s.detail}</p>}
          </div>
          <span className="sr-only">{s.status}</span>
          {s.result && s.status === "done" && (
            <span className="fade-up rounded-[9px] bg-brand-soft px-3 py-1 text-sm text-brand-ink">{s.result}</span>
          )}
          {s.status === "error" && <span className="rounded-[9px] bg-gap-soft px-3 py-1 text-sm text-gap-ink">failed</span>}
        </li>
      ))}
    </ol>
  );
}
