"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { ensureEntryIds } from "@/lib/entryIds";

// saveTailoredVersion takes `edits: { [proposalId]: text }` for accepted lines (API-CONTRACT, resolved requests).
export const EDIT_LINES_SUPPORTED = true;

const norm = (t) => String(t ?? "").replace(/^\s*(?:[-*•]\s*)?/, "").replace(/\s+/g, " ").trim();

function entryKey(entryId) {
  const [kind, ...rest] = String(entryId).split(":");
  return { kind, key: rest.join(":") };
}

/** Finds the resume entry for "exp:<id>" / "proj:<id>". */
function findEntry(resume, entryId) {
  if (!resume) return null;
  const safe = ensureEntryIds(resume);
  const { kind, key } = entryKey(entryId);
  const list = kind === "exp" ? safe.experience : kind === "proj" ? safe.projects : null;
  return Array.isArray(list) ? list.find((e) => e && String(e.id) === key) || null : null;
}

function SourcePopover({ proposal }) {
  const sources = Array.isArray(proposal.sources) ? proposal.sources : [];
  if (sources.length === 0 && !proposal.reason) return null;
  return (
    <span
      role="tooltip"
      className="pointer-events-none invisible absolute left-0 top-full z-20 mt-1 w-72 max-w-[85vw] rounded-lg border border-line bg-panel p-2.5 text-[11px] leading-snug text-muted shadow-md group-hover:visible group-focus-within:visible"
    >
      {proposal.reason && <span className="mb-1 block italic">{proposal.reason}</span>}
      <span className="mb-0.5 block font-pixel text-[10px] uppercase tracking-wider text-pip-ink">source</span>
      {sources.slice(0, 3).map((s, i) => (
        <span key={`${s.id ?? "s"}-${i}`} className="block">
          <strong className="font-medium text-text">{s.label}</strong>
          {s.excerpt ? `: "${s.excerpt.length > 140 ? `${s.excerpt.slice(0, 140)}...` : s.excerpt}"` : ""}
        </span>
      ))}
    </span>
  );
}

function TrackedLine({ proposal, decision, onDecide, edited, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const shown = edited ?? proposal.proposed;
  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full border px-3 text-[11px] font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95";

  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== shown) onEdit?.(proposal.proposalId, v.replace(/\s+/g, " "));
  };

  return (
    <li className="group relative rounded-lg border-l-2 border-line py-1.5 pl-3 transition hover:border-pip focus-within:border-pip">
      <div className="text-[13px] leading-relaxed font-serif" tabIndex={0} aria-label={`Suggested change: ${proposal.original} becomes ${shown}`}>
        {decision === "rejected" ? (
          <span className="text-muted">{proposal.original}</span>
        ) : editing ? (
          <textarea
            autoFocus
            rows={3}
            value={draft}
            maxLength={600}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
              } else if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commit();
              }
            }}
            aria-label="Edit this line"
            className="w-full rounded-lg border border-pip bg-panel p-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-pip/40"
          />
        ) : (
          <>
            {decision !== "accepted" && <del className="mr-1 text-danger decoration-danger/70">{proposal.original}</del>}
            <ins
              className={`no-underline ${decision === "accepted" ? "text-text" : "rounded bg-lime/40 px-0.5 text-text underline decoration-primary/60"} ${
                EDIT_LINES_SUPPORTED ? "cursor-text" : ""
              }`}
              onClick={
                EDIT_LINES_SUPPORTED
                  ? () => {
                      setDraft(shown);
                      setEditing(true);
                    }
                  : undefined
              }
            >
              {shown}
            </ins>
          </>
        )}
      </div>
      {edited ? (
        <span className="mt-0.5 block text-[11px] italic text-muted">edited by you</span>
      ) : (
        <SourcePopover proposal={proposal} />
      )}
      <div className="mt-1.5 flex flex-wrap gap-2">
        {decision === "accepted" || decision === "rejected" ? (
          <button type="button" onClick={() => onDecide(proposal.proposalId, undefined)} className={`${btn} border-line bg-panel text-muted hover:border-pip`}>
            <RotateCcw className="h-3 w-3" aria-hidden="true" /> {decision === "accepted" ? "accepted, change my mind" : "rejected, change my mind"}
          </button>
        ) : (
          <>
            <button type="button" onClick={() => onDecide(proposal.proposalId, "accepted")} className={`${btn} border-pip bg-pip text-white hover:bg-pip-ink`}>
              <Check className="h-3 w-3" aria-hidden="true" /> Accept
            </button>
            <button type="button" onClick={() => onDecide(proposal.proposalId, "rejected")} className={`${btn} border-line bg-panel text-text hover:border-danger`}>
              <X className="h-3 w-3" aria-hidden="true" /> Reject
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Tailor proposals as tracked changes on the resume document (D36/D63). Pure view: the parent owns `decisions`
 * ({ [proposalId]: "accepted" | "rejected" }) and decides what to save. `resume` (optional) gives each group its heading
 * and the untouched bullet lines around the changes.
 */
export default function TrackedChanges({ proposals, decisions, onDecide, resume = null, edits = {}, onEdit }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const p of proposals || []) {
      if (!map.has(p.entryId)) map.set(p.entryId, []);
      map.get(p.entryId).push(p);
    }
    return [...map.entries()].map(([entryId, items]) => ({ entryId, items, entry: findEntry(resume, entryId) }));
  }, [proposals, resume]);

  return (
    <div className="paper-doc rounded-xl border border-line bg-panel p-4 text-text shadow-sm sm:p-8">
      <div className="mb-4 flex items-center justify-between border-b border-text/20 pb-1">
        <span className="font-serif text-xs font-bold uppercase tracking-widest">Your resume</span>
        <span className="font-pixel text-[10px] text-muted">tracked changes</span>
      </div>
      <div className="space-y-6">
        {groups.map(({ entryId, items, entry }) => {
          const byOriginal = new Map(items.map((p) => [norm(p.original), p]));
          const lines = String(entry?.description ?? "").split("\n").filter((l) => l.trim());
          const covered = new Set();
          const rows = lines.map((l, i) => {
            const p = byOriginal.get(norm(l));
            if (p) covered.add(p.proposalId);
            return { key: `${entryId}-${i}`, text: l, proposal: p };
          });
          // Proposals whose line we could not find in the document are still shown, after the entry's other lines.
          for (const p of items) if (!covered.has(p.proposalId)) rows.push({ key: `${entryId}-${p.proposalId}`, text: "", proposal: p });
          return (
            <section key={entryId} aria-label={entry?.title || "Resume entry"}>
              <h3 className="font-serif text-xs font-semibold">
                {entry?.title || (entryKey(entryId).kind === "proj" ? "Project" : "Role")}
                {entry?.organization && <span className="font-normal italic text-muted"> - {entry.organization}</span>}
              </h3>
              <ul className="mt-1.5 space-y-1.5">
                {rows.map((r) =>
                  r.proposal ? (
                    <TrackedLine
                      key={r.key}
                      proposal={r.proposal}
                      decision={decisions[r.proposal.proposalId]}
                      onDecide={onDecide}
                      edited={edits[r.proposal.proposalId]}
                      onEdit={onEdit}
                    />
                  ) : (
                    <li key={r.key} className="pl-3 font-serif text-[13px] leading-relaxed text-muted">
                      {norm(r.text)}
                    </li>
                  )
                )}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
