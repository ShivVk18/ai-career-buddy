"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-soft text-text",
  brand: "bg-brand-soft text-brand-ink",
  warn: "bg-warn-soft text-warn-ink",
  gap: "bg-gap-soft text-gap-ink",
};
const base = "inline-flex h-8 items-center gap-1 rounded-[9px] text-sm transition-colors duration-200";

/** Click the label to edit (Enter saves, Esc cancels, empty removes). The x removes. */
export function Chip({ value, tone = "neutral", editable = true, onChange, onRemove, className }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (!next) onRemove?.();
    else if (next !== value) onChange?.(next);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        aria-label={`edit ${value}`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        style={{ width: `${Math.max(6, draft.length + 2)}ch` }}
        className={cn(base, "border border-brand bg-panel px-3 outline-none", className)}
      />
    );
  }
  return (
    <span className={cn(base, "fade-up pl-3", onRemove ? "pr-1" : "pr-3", TONES[tone], className)}>
      {editable && onChange ? (
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          aria-label={`edit ${value}`}
          className="rounded-sm text-left"
        >
          {value}
        </button>
      ) : (
        <span>{value}</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`remove ${value}`}
          className="grid size-6 place-items-center rounded-[7px] text-muted hover:bg-line hover:text-text"
        >
          <X className="size-3.5" />
        </button>
      )}
    </span>
  );
}

/** "+ add" chip that turns into an input. */
export function AddChip({ onAdd, label = "add" }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const done = () => {
    const v = draft.trim();
    if (v) onAdd?.(v);
    setDraft("");
    setOpen(false);
  };
  if (open) {
    return (
      <input
        autoFocus
        value={draft}
        aria-label={label}
        placeholder={label}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={done}
        onKeyDown={(e) => {
          if (e.key === "Enter") done();
          if (e.key === "Escape") {
            setDraft("");
            setOpen(false);
          }
        }}
        className={cn(base, "w-28 border border-brand bg-panel px-3 outline-none")}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(base, "border border-dashed border-line px-3 text-muted hover:border-brand hover:text-brand-ink")}
    >
      <Plus className="size-3.5" /> {label}
    </button>
  );
}

/** Editable list: values is string[]; onChange gets the new array. */
export function ChipList({ values, onChange, tone, addLabel = "add" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v, i) => (
        <Chip
          key={`${v}-${i}`}
          value={v}
          tone={tone}
          onChange={(nv) => onChange(values.map((x, j) => (j === i ? nv : x)))}
          onRemove={() => onChange(values.filter((_, j) => j !== i))}
        />
      ))}
      <AddChip label={addLabel} onAdd={(v) => onChange([...values, v])} />
    </div>
  );
}

export default Chip;
