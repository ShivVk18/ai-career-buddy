"use client";

import { useEffect, useId, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Check, Pencil, Undo2, X } from "lucide-react";
import { cn } from "@/lib/utils";

function Source({ n, text }) {
  const id = useId();
  return (
    <span className="group relative inline-block align-super">
      <button
        type="button"
        aria-describedby={id}
        aria-label={`source ${n}`}
        className="ml-0.5 rounded-[4px] bg-brand-soft px-1 font-pixel text-[10px] leading-4 text-brand-ink"
      >
        {n}
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-56 -translate-x-1/2 rounded-[9px] bg-ink px-3 py-2 font-sans text-xs leading-snug text-ink-foreground opacity-0 shadow-soft transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

function Act({ onClick, label, children, tone }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 place-items-center rounded-full border border-line bg-panel text-muted transition-colors duration-200 hover:text-text",
        tone === "ok" && "hover:border-brand hover:bg-brand-soft hover:text-brand-ink",
        tone === "no" && "hover:border-gap-ink hover:bg-gap-soft hover:text-gap-ink",
      )}
    >
      {children}
    </button>
  );
}

function KeepLine({ line, animate }) {
  const { text, hl } = line;
  const i = hl ? text.indexOf(hl) : -1;
  if (i < 0) return <p>{text}</p>;
  return (
    <p>
      <span
        className="rounded-[3px] px-0.5"
        style={{
          backgroundImage: "linear-gradient(var(--brand-soft), var(--brand-soft))",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
          animation: animate ? "sweepIn 700ms ease both" : "none",
        }}
      >
        {hl}
      </span>
      {text.slice(0, i)}
      {text.slice(i + hl.length)}
    </p>
  );
}

function ChangeLine({ line, animate, decision, onDecide }) {
  const { before, after, source } = line;
  // phase: 0 plain -> 1 struck -> 2 typing -> 3 done
  const [phase, setPhase] = useState(animate ? 0 : 3);
  const [typed, setTyped] = useState(animate ? 0 : after.length);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(after);

  useEffect(() => {
    if (!animate) return;
    const a = setTimeout(() => setPhase(1), 900);
    const b = setTimeout(() => setPhase(2), 1500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [animate]);
  useEffect(() => {
    if (phase !== 2) return;
    const id = setInterval(() => {
      setTyped((n) => {
        if (n >= after.length) {
          clearInterval(id);
          setPhase(3);
          return n;
        }
        return n + 1;
      });
    }, 28);
    return () => clearInterval(id);
  }, [phase, after]);

  const shown = decision?.text ?? after;

  if (decision?.kind === "reject")
    return (
      <div className="group flex items-start gap-3">
        <p className="flex-1">{before}</p>
        <Act label="undo reject" onClick={() => onDecide(null)}><Undo2 className="size-4" /></Act>
      </div>
    );
  if (decision?.kind === "accept")
    return (
      <div className="flex items-start gap-3">
        <p className="flex-1 text-brand-ink">
          {shown}
          {source && <Source n={source.n} text={source.text} />}
        </p>
        <Act label="undo accept" onClick={() => onDecide(null)}><Undo2 className="size-4" /></Act>
      </div>
    );
  if (editing)
    return (
      <div className="flex flex-col gap-2">
        <textarea
          autoFocus
          value={draft}
          aria-label="edit rewrite"
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          className="w-full rounded-[9px] border border-brand bg-panel p-2 text-lg text-brand-ink outline-none"
        />
        <div className="flex gap-2">
          <Act tone="ok" label="save edit" onClick={() => { setEditing(false); onDecide({ kind: "accept", text: draft.trim() || after, edited: true }); }}><Check className="size-4" /></Act>
          <Act label="cancel" onClick={() => setEditing(false)}><X className="size-4" /></Act>
        </div>
      </div>
    );

  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-1 sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        <p
          className={cn("transition-colors duration-300", phase >= 1 && "text-muted line-through decoration-brand")}
          style={
            phase === 0 && animate
              ? {
                  backgroundImage: "linear-gradient(var(--warn-soft), var(--warn-soft))",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "100% 100%",
                  animation: "sweepIn 700ms ease both",
                }
              : undefined
          }
        >
          {before}
        </p>
        {phase >= 2 && (
          <p className="mt-1 text-xl leading-snug text-brand-ink" aria-live="off">
            {after.slice(0, typed)}
            {phase === 3 && source && <Source n={source.n} text={source.text} />}
          </p>
        )}
      </div>
      {phase === 3 && (
        <div className="fade-up flex shrink-0 gap-1.5">
          <Act tone="ok" label="accept" onClick={() => onDecide({ kind: "accept", text: after })}><Check className="size-4" /></Act>
          <Act tone="no" label="reject" onClick={() => onDecide({ kind: "reject" })}><X className="size-4" /></Act>
          <Act label="edit" onClick={() => { setDraft(after); setEditing(true); }}><Pencil className="size-4" /></Act>
        </div>
      )}
    </div>
  );
}

/**
 * lines: [{ id, kind: "keep", text, hl? } | { id, kind: "change", before, after, source?: { n, text } }]
 * onDecision(id, null | { kind: "accept"|"reject", text?, edited? })
 * decisions/onDecision can be controlled; if decisions is omitted it is kept internally.
 */
export default function TrackedChangeDoc({ title, subtitle, lines, animate = true, decisions, onDecision, className }) {
  const reduce = useReducedMotion();
  const [local, setLocal] = useState({});
  const d = decisions ?? local;
  const run = animate && !reduce;
  const decide = (id, v) => {
    if (!decisions) setLocal((p) => ({ ...p, [id]: v }));
    onDecision?.(id, v);
  };
  return (
    <article className={cn("font-doc text-lg leading-relaxed text-text", className)}>
      {title && <h3 className="text-3xl normal-case tracking-tight">{title}</h3>}
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <div className="mt-5 space-y-5">
        {lines.map((l) =>
          l.kind === "change" ? (
            <ChangeLine key={l.id} line={l} animate={run} decision={d[l.id]} onDecide={(v) => decide(l.id, v)} />
          ) : (
            <KeepLine key={l.id} line={l} animate={run} />
          ),
        )}
      </div>
    </article>
  );
}
