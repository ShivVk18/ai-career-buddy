"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small lowercase field label. */
export function FieldLabel({ htmlFor, children, className }) {
  return (
    <label htmlFor={htmlFor} className={cn("block text-xs font-medium text-faint", className)}>
      {children}
    </label>
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs text-danger">
      {children}
    </p>
  );
}

/** Inline input/textarea look shared by the tool forms. */
export const fieldClass =
  "w-full rounded-lg border border-line bg-bg px-3.5 text-sm text-text outline-none placeholder:text-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60";

/** Pick one of a few known values as chips (radio group). options: [value, label]. */
export function ChoiceChips({ label, value, onChange, options, className }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map(([val, text]) => {
        const on = value === val;
        return (
          <button
            key={val}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(val)}
            className={cn(
              "inline-flex min-h-10 items-center rounded-[9px] px-3.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              on ? "bg-brand-soft text-brand-ink ring-1 ring-brand/50" : "bg-soft text-muted hover:text-text",
            )}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

/** "more" disclosure for optional fields. Content stays mounted (hidden) so form state is kept. */
export function More({ open, onToggle, label = "more", forceOpen = false, children }) {
  const shown = open || forceOpen;
  return (
    <div className="space-y-4">
      <button
        type="button"
        aria-expanded={shown}
        onClick={onToggle}
        className="min-h-10 rounded-full text-sm text-muted underline-offset-4 outline-none hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        {shown ? "less" : label}
      </button>
      <div className={shown ? "space-y-4" : "hidden"}>{children}</div>
    </div>
  );
}

/** Dark pill primary action with a busy state. */
export function InkButton({ busy, busyText, children, className, ...props }) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      aria-busy={busy || undefined}
      className={cn(
        "btn-ink inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto",
        className,
      )}
    >
      {busy ? (
        <>
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> {busyText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Quiet inline note (info) or error line. */
export function Note({ tone = "info", children, className }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[9px] px-3.5 py-2.5 text-sm",
        tone === "error" ? "bg-gap-soft text-gap-ink" : "bg-soft text-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}
