"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { countWords, findCliches } from "@/lib/writing";

/** Live word count against a { min, max, target? } range. */
export function WordCount({ text, range, label = "Words" }) {
  const n = countWords(text);
  const inRange = n >= range.min && n <= range.max;
  const state = n < range.min ? "Too short" : n > range.max ? "Too long" : "In range";
  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold tracking-widest uppercase">
      <span className={inRange ? "text-accent" : "text-destructive"}>
        {label}: {n}
      </span>
      <span className="text-muted-foreground">
        Target {range.target ? `${range.target} (` : ""}
        {range.min}-{range.max}
        {range.target ? ")" : ""} words
      </span>
      <span className={`inline-flex items-center gap-1 ${inRange ? "text-accent" : "text-destructive"}`}>
        {inRange ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
        {state}
      </span>
    </div>
  );
}

/** Text with cliché phrases highlighted (rendered next to the editor), plus a short hint. */
export function ClicheCheck({ text }) {
  const hits = findCliches(text);
  if (hits.length === 0) {
    return (
      <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
        <CheckCircle2 className="h-3 w-3 text-accent" /> No overused phrases found
      </p>
    );
  }
  const parts = [];
  let pos = 0;
  hits.forEach((h, i) => {
    if (h.start > pos) parts.push(text.slice(pos, h.start));
    parts.push(
      <mark key={i} className="bg-destructive/20 text-foreground rounded-sm px-0.5 underline decoration-destructive">
        {text.slice(h.start, h.end)}
      </mark>
    );
    pos = h.end;
  });
  if (pos < text.length) parts.push(text.slice(pos));
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold tracking-widest uppercase text-destructive flex items-center gap-2">
        <AlertTriangle className="h-3 w-3" /> {hits.length} overused {hits.length === 1 ? "phrase" : "phrases"}
      </p>
      <p className="text-xs text-muted-foreground">
        Recruiters read these constantly. Replace them with something specific to you.
      </p>
      <p className="whitespace-pre-wrap text-xs leading-relaxed font-general border border-divider bg-divider/5 rounded-sm p-4">
        {parts}
      </p>
    </div>
  );
}
