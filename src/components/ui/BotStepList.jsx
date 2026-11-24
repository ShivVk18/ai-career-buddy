import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip } from "@/components/ui/Chip";

const TONE = { good: "brand", warn: "warn", bad: "gap", neutral: "neutral" };

function Dot({ status }) {
  if (status === "done")
    return (
      <span className="grid size-7 place-items-center rounded-full bg-brand-ink text-white transition-colors duration-300">
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
 * result is a short string shown as a chip once done. Optional chips: [{ label, value, tone }] (read-only) and footer (node under the row).
 */
export default function BotStepList({ steps, className }) {
  return (
    <ol className={cn("divide-y divide-line", className)}>
      {steps.map((s) => (
        <li key={s.id} className="py-[11px]" aria-current={s.status === "running" ? "step" : undefined}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Dot status={s.status} />
            <div className="min-w-0 flex-1 basis-40">
              <p className={cn("text-xl", s.status === "waiting" ? "text-muted" : "text-text")}>{s.label}</p>
              {s.detail && <p className="text-sm text-muted sm:truncate">{s.detail}</p>}
            </div>
            <span className="sr-only">{s.status}</span>
            {s.result && s.status === "done" && (
              <span className="fade-up rounded-[9px] bg-brand-soft px-3 py-1 text-sm text-brand-ink">{s.result}</span>
            )}
            {s.chips?.length > 0 && (
              <div className="flex w-full flex-wrap justify-end gap-1.5 pl-11 sm:w-auto sm:pl-0">
                {s.chips.map((c) => (
                  <Chip key={c.label} editable={false} tone={TONE[c.tone] || "neutral"} value={[c.label, c.value].filter(Boolean).join(" ").toLowerCase()} />
                ))}
              </div>
            )}
            {s.status === "error" && !s.footer && <span className="rounded-[9px] bg-gap-soft px-3 py-1 text-sm text-gap-ink">failed</span>}
          </div>
          {s.footer && <div className="mt-2 space-y-1 pl-11">{s.footer}</div>}
        </li>
      ))}
    </ol>
  );
}
