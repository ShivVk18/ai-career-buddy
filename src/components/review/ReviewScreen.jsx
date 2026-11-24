"use client";

import { useRef, useState } from "react";
import { Check, Loader2, RotateCw } from "lucide-react";
import AppWindow from "@/components/ui/AppWindow";
import PixelScene from "@/components/ui/PixelScene";
import StepCaption from "@/components/ui/StepCaption";
import TrackedChangeDoc from "@/components/ui/TrackedChangeDoc";
import UndoToast from "@/components/ui/UndoToast";
import PipStatus from "@/components/ui/PipStatus";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const TONE = { have: "bg-brand-soft text-brand-ink", partial: "bg-warn-soft text-warn-ink", gap: "bg-gap-soft text-gap-ink" };
const chip = "inline-flex h-7 shrink-0 items-center rounded-full px-3 text-sm";

function Requirement({ req, onAddGap }) {
  const [st, setSt] = useState("idle"); // idle | adding | added | error
  const add = async () => {
    setSt("adding");
    try {
      const r = await onAddGap(req);
      setSt(r?.error ? "error" : "added");
    } catch {
      setSt("error");
    }
  };
  return (
    <li className="flex items-center justify-between gap-3 border-b border-dashed border-line py-3 last:border-b-0">
      <span className="min-w-0 text-sm text-text">{req.label}</span>
      {req.status === "gap" && onAddGap ? (
        st === "added" ? (
          <span className={cn(chip, "gap-1 bg-brand-soft text-brand-ink")}><Check className="size-3.5" aria-hidden="true" /> on roadmap</span>
        ) : (
          <button
            type="button"
            onClick={add}
            disabled={st === "adding"}
            aria-label={`add ${req.label} to roadmap`}
            className={cn(chip, "min-h-9 gap-1 transition-colors hover:brightness-95 focus-visible:ring-2 focus-visible:ring-gap-ink/40", TONE.gap)}
          >
            {st === "adding" && <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {st === "error" ? "retry · add to roadmap" : "gap → roadmap"}
          </button>
        )
      ) : (
        <span className={cn(chip, TONE[req.status] || TONE.have)}>{req.status}</span>
      )}
    </li>
  );
}

/**
 * Review screen (scene 4). Presentational: the caller supplies data and async handlers.
 * status: "loading" | "error" | "ready"
 * data: { title, subtitle, wants, lines, requirements: [{ id, label, status: have|partial|gap }], invented: number|null, windowTitle }
 * onCommit({ ids, edits }) -> { count?, undoToken? } | { error }
 * onUndo(undoToken) -> { success } | { error }
 * onAddGap(req) -> { success } | { error }   (omit to show gaps as plain chips)
 * onDone() runs when the toast closes without undo.
 */
export default function ReviewScreen({ status, error, onRetry, data, onCommit, onUndo, onAddGap, onDone, emptyAction, scene = true }) {
  const [decisions, setDecisions] = useState({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [committed, setCommitted] = useState(false);
  const [toast, setToast] = useState(null); // { message, token }
  const prev = useRef({});
  const undone = useRef(false);

  const lines = data?.lines ?? [];
  const changes = lines.filter((l) => l.kind === "change");
  const live = changes.filter((l) => decisions[l.id]?.kind !== "reject");
  const rejected = changes.length - live.length;

  const acceptAll = async () => {
    setBusy(true);
    setNote(null);
    const edits = Object.fromEntries(live.filter((l) => decisions[l.id]?.edited).map((l) => [l.id, decisions[l.id].text]));
    try {
      const res = await onCommit({ ids: live.map((l) => l.id), edits });
      if (!res || res.error) {
        setNote(res?.error || "we couldn't save that. try again.");
        return;
      }
      const n = res.count ?? live.length;
      prev.current = decisions;
      undone.current = false;
      setDecisions((d) => ({ ...d, ...Object.fromEntries(live.map((l) => [l.id, d[l.id] ?? { kind: "accept", text: l.after }])) }));
      setCommitted(true);
      setToast({ message: `${n} edit${n === 1 ? "" : "s"} accepted · nothing sent yet`, token: res.undoToken });
    } catch {
      setNote("we couldn't save that. try again.");
    } finally {
      setBusy(false);
    }
  };

  const undo = async () => {
    undone.current = true;
    try {
      const res = toast?.token ? await onUndo?.(toast.token) : null;
      if (res?.error) {
        setNote("we couldn't undo that. your resume was updated.");
        return;
      }
    } catch {
      setNote("we couldn't undo that.");
      return;
    }
    setDecisions(prev.current);
    setCommitted(false);
    setToast(null);
  };

  const close = () => {
    setToast(null);
    if (!undone.current) onDone?.();
  };

  let body;
  if (status === "loading") {
    body = (
      <div aria-busy="true" className="space-y-5 p-6 sm:p-10">
        <PipStatus text="pip is laying out the edits…" />
        <Skeleton className="h-9 w-2/5" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-full" />
      </div>
    );
  } else if (status === "error") {
    body = (
      <div role="alert" className="p-6 sm:p-10">
        <EmptyState outfit="detective" title="we couldn't open these edits" text={error || "something went wrong on our side."} action={onRetry && (
          <button type="button" onClick={onRetry} className="btn-pill-secondary inline-flex min-h-11 items-center gap-2 px-5 text-sm">
            <RotateCw className="size-4" aria-hidden="true" /> retry
          </button>
        )} />
      </div>
    );
  } else if (changes.length === 0) {
    body = (
      <div className="p-6 sm:p-10">
        <EmptyState title="nothing to change" text="your resume already says what this job asks for." action={emptyAction} />
      </div>
    );
  } else {
    const reqs = data.requirements ?? [];
    body = (
      <div className="grid md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 p-6 sm:p-10">
          <TrackedChangeDoc title={data.title} subtitle={data.subtitle} lines={lines} decisions={decisions} onDecision={(id, v) => setDecisions((d) => ({ ...d, [id]: v }))} />
        </div>
        <aside className="border-t border-line bg-soft p-6 md:border-l md:border-t-0" aria-label="what the job wants">
          <h2 className="font-doc text-sm font-normal text-muted normal-case tracking-normal">{data.wants || "the job wants"}</h2>
          {reqs.length === 0 ? (
            <p className="mt-3 text-sm text-faint">no requirement check for this job yet.</p>
          ) : (
            <ul className="mt-2">
              {reqs.map((r) => (
                <Requirement key={r.id} req={r} onAddGap={onAddGap} />
              ))}
            </ul>
          )}
          {data.invented != null && (
            <p className={cn("mt-6 font-doc text-sm", data.invented > 0 ? "text-warn-ink" : "text-muted")}>
              {data.invented} {data.invented === 1 ? "thing" : "things"} invented
            </p>
          )}
          <button
            type="button"
            onClick={acceptAll}
            disabled={busy || committed || live.length === 0}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 font-doc text-sm text-ink-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {committed ? "accepted" : rejected ? `accept ${live.length} edit${live.length === 1 ? "" : "s"}` : "accept all edits"}
          </button>
          {note && (
            <p role="alert" className="mt-2 text-xs text-gap-ink">
              {note}
            </p>
          )}
        </aside>
      </div>
    );
  }

  const windowEl = (
    <AppWindow title={data?.windowTitle || "ascendai · needs you"} className="relative" bodyClassName="p-0">
      {body}
    </AppWindow>
  );

  return (
    <section aria-label="review resume edits" className={cn("relative", scene && "flex min-h-screen flex-col justify-center overflow-hidden px-3 py-6 sm:px-8 sm:py-10")}>
      {scene && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <PixelScene variant="lemon" seed={404} />
        </div>
      )}
      <div className="relative mx-auto w-full max-w-[1040px]">
        <StepCaption n={4} className="mb-4 text-base sm:text-lg">you review. every line has a source.</StepCaption>
        {windowEl}
      </div>
      <UndoToast open={!!toast} message={toast?.message} onUndo={undo} onClose={close} duration={8000} />
    </section>
  );
}
