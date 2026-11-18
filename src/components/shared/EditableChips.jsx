"use client";

import React, { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline text input used by chips. Enter or blur saves, Esc cancels.
 */
function ChipInput({ initial = "", placeholder, maxLength = 200, onCommit, onCancel, className = "" }) {
  const [draft, setDraft] = useState(initial);
  const doneRef = useRef(false);
  const finish = (fn, arg) => {
    if (doneRef.current) return;
    doneRef.current = true;
    fn(arg);
  };
  return (
    <input
      autoFocus
      value={draft}
      maxLength={maxLength}
      placeholder={placeholder}
      aria-label={placeholder || "Edit"}
      onChange={(e) => setDraft(e.target.value.replace(/\n/g, " "))}
      onFocus={(e) => e.target.select()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(onCommit, draft.trim());
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(onCancel);
        }
      }}
      onBlur={() => finish(onCommit, draft.trim())}
      className={cn(
        "h-8 min-w-[8rem] max-w-full rounded-full border border-pip bg-white px-3 text-xs text-text outline-none focus-visible:ring-2 focus-visible:ring-pip/40",
        className
      )}
      style={{ width: `${Math.min(Math.max(draft.length + 3, 10), 36)}ch` }}
    />
  );
}

/**
 * One editable chip. Click (or Enter/Space) to edit in place; Enter or blur saves, Esc cancels.
 * - onSave(value): called with the trimmed value when it changed. May be async; the parent does the optimistic update.
 * - onRemove(): shows an x button. Saving an empty value calls onRemove when given, otherwise onSave("").
 * - sources: Snapshot[] ({label, excerpt}); quote: string. Shown on hover or keyboard focus.
 */
export function EditableChip({
  label,
  placeholder = "add",
  sources,
  quote,
  detail,
  onSave,
  onRemove,
  maxLength,
  className = "",
}) {
  const [editing, setEditing] = useState(false);
  const empty = !label;
  const excerpts = [
    ...(Array.isArray(sources) ? sources.map((s) => s.excerpt || s.label).filter(Boolean) : []),
    ...(quote ? [quote] : []),
  ];

  const commit = (value) => {
    setEditing(false);
    if (value === (label || "")) return;
    if (!value && onRemove) {
      onRemove();
      return;
    }
    onSave?.(value);
  };

  if (editing) {
    return (
      <ChipInput
        initial={label || ""}
        placeholder={placeholder}
        maxLength={maxLength}
        onCommit={commit}
        onCancel={() => setEditing(false)}
        className={className}
      />
    );
  }

  return (
    <span className={cn("group relative inline-flex max-w-full items-center", className)}>
      <span
        className={cn(
          "inline-flex h-8 max-w-full items-center rounded-full border text-xs transition",
          empty
            ? "border-dashed border-line bg-white text-muted hover:border-pip"
            : "border-line bg-pip-soft/60 text-text hover:border-pip",
          onRemove && !empty ? "pr-1" : ""
        )}
      >
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={empty ? placeholder : `Edit ${label}`}
          className="inline-flex h-8 min-w-0 items-center gap-1 rounded-full px-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95"
        >
          {empty && <Plus className="h-3 w-3 shrink-0" aria-hidden="true" />}
          <span className="truncate">{empty ? placeholder : label}</span>
          {detail && !empty && <span className="truncate text-muted">• {detail}</span>}
        </button>
        {onRemove && !empty && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted outline-none hover:bg-white hover:text-text focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-90"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        )}
      </span>
      {excerpts.length > 0 && (
        <span
          role="tooltip"
          className="pointer-events-none invisible absolute left-0 top-full z-20 mt-1 w-64 max-w-[80vw] rounded-lg border border-line bg-white p-2 text-[11px] leading-snug text-muted shadow-md group-hover:visible group-focus-within:visible"
        >
          <span className="mb-0.5 block font-pixel text-[10px] uppercase tracking-wider text-pip-ink">source</span>
          {excerpts.slice(0, 2).map((e, i) => (
            <span key={i} className="block">
              &ldquo;{e.length > 160 ? `${e.slice(0, 160)}...` : e}&rdquo;
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

/**
 * A list of editable chips with a trailing "+ add" chip.
 * items: { id, label, detail?, source?: { quote }, sources?: Snapshot[] }[]
 * onEditItem(id, value), onRemoveItem(id), onAddItem(value). All optional; omit to make that action unavailable.
 */
export default function EditableChips({
  items = [],
  onEditItem,
  onRemoveItem,
  onAddItem,
  addLabel = "add",
  maxLength = 100,
  className = "",
}) {
  const [adding, setAdding] = useState(false);
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map((it) => (
        <EditableChip
          key={it.id}
          label={it.label}
          detail={it.detail}
          quote={it.source?.quote}
          sources={it.sources}
          maxLength={maxLength}
          placeholder={addLabel}
          onSave={onEditItem ? (v) => onEditItem(it.id, v) : undefined}
          onRemove={onRemoveItem ? () => onRemoveItem(it.id) : undefined}
        />
      ))}
      {onAddItem &&
        (adding ? (
          <ChipInput
            placeholder={addLabel}
            maxLength={maxLength}
            onCommit={(v) => {
              setAdding(false);
              if (v) onAddItem(v);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-line bg-white px-3 text-xs text-muted outline-none transition hover:border-pip hover:text-text focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            {addLabel}
          </button>
        ))}
    </div>
  );
}
