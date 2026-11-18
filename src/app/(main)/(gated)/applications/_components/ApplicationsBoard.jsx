"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, GripVertical, MoreHorizontal, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { getApplications, setApplicationStatus } from "@/actions/Applications";
import { generationErrorMessage } from "@/components/shared/generationError";
import EmptyState from "@/components/shared/EmptyState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COLUMNS = [
  { status: "SAVED", label: "Saved" },
  { status: "APPLIED", label: "Applied" },
  { status: "INTERVIEWING", label: "Interviewing" },
  { status: "OFFER", label: "Offer" },
  { status: "CLOSED", label: "Closed" },
];
const LABEL = Object.fromEntries(COLUMNS.map((c) => [c.status, c.label]));

function Card({ app, onMove, onDragStart, onDragEnd, dragging }) {
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", app.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(app.id);
      }}
      onDragEnd={onDragEnd}
      className={`rounded-xl border border-line bg-white p-3 shadow-2xs transition ${
        dragging ? "opacity-40" : "hover:border-pip/60"
      }`}
    >
      <div className="flex items-start gap-1">
        <GripVertical className="mt-0.5 hidden h-4 w-4 shrink-0 cursor-grab text-muted/60 md:block" aria-hidden="true" />
        <Link
          href={`/jobs/${app.job.id}`}
          className="min-w-0 flex-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-pip/50"
        >
          <span className="block truncate text-sm font-semibold text-text">{app.job.company || "company not set"}</span>
          <span className="block truncate text-xs text-muted">{app.job.title || "title not set"}</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Move ${app.job.company || app.job.title || "this job"} to another column`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted outline-none hover:bg-soft hover:text-text focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95 -my-1 -mr-1"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            {COLUMNS.filter((c) => c.status !== app.status).map((c) => (
              <DropdownMenuItem key={c.status} className="min-h-10" onSelect={() => onMove(app.id, c.status)}>
                {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {app.nextAction && (
        <Link
          href={app.nextAction.href}
          className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-full bg-pip-soft px-3 text-[11px] font-medium text-pip-ink outline-none hover:bg-pip-soft/70 focus-visible:ring-2 focus-visible:ring-pip/50"
        >
          {app.nextAction.label}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      )}
    </li>
  );
}

export default function ApplicationsBoard() {
  const [apps, setApps] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [announce, setAnnounce] = useState("");
  const appsRef = useRef([]);
  const inflight = useRef(0);
  appsRef.current = apps || [];

  const load = useCallback(async (quiet = false) => {
    if (!quiet) {
      setError(null);
      setApps(null);
    }
    try {
      const res = await getApplications();
      if (!res || res.error) {
        if (!quiet) setError(generationErrorMessage(res, "We couldn't load your applications."));
        return;
      }
      // A quiet refresh must never overwrite a move that is still in flight.
      if (quiet && inflight.current > 0) return;
      setApps(res.applications || []);
    } catch {
      if (!quiet) setError("We couldn't load your applications.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = (id, fn) => setApps((list) => (list || []).map((a) => (a.id === id ? fn(a) : a)));

  // Optimistic move: roll back on error, 5 s Undo with the previous status.
  const move = useCallback(
    async (id, status, { isUndo = false } = {}) => {
      const current = appsRef.current.find((a) => a.id === id);
      if (!current || current.status === status) return;
      const before = current;
      patch(id, (a) => ({ ...a, status }));
      inflight.current += 1;
      let res;
      try {
        res = await setApplicationStatus(id, status);
      } catch {
        res = { error: "We couldn't reach the server.", code: "FAILED" };
      }
      inflight.current -= 1;
      if (!res || res.error) {
        patch(id, () => before); // rollback
        toast.error(generationErrorMessage(res, "That move didn't save. Nothing changed."));
        return;
      }
      patch(id, (a) => ({ ...a, ...res.application, status: res.application?.status ?? status }));
      const name = before.job.company || before.job.title || "Job";
      setAnnounce(`${name} moved to ${LABEL[status]}`);
      load(true); // refresh each card's next action
      if (isUndo) return;
      const prev = res.previousStatus || before.status;
      toast.success(`${name} moved to ${LABEL[status].toLowerCase()}`, {
        duration: 5000,
        action: { label: "Undo", onClick: () => move(id, prev, { isUndo: true }) },
      });
    },
    [load]
  );

  const header = (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-text lowercase">applications</h1>
        <p className="text-xs text-muted">drag a card, or tap the dots to move it</p>
      </div>
      {apps && apps.length > 0 && (
        <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-1 rounded-full">
          {apps.length} {apps.length === 1 ? "job" : "jobs"}
        </span>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-5">
        {header}
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E8C9C0] bg-[#FDF3F0] px-4 py-3 text-xs text-text">
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={() => load()} className="btn-pill-secondary inline-flex min-h-10 items-center gap-1.5 px-4 text-xs">
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (apps === null) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-5" aria-busy="true" aria-label="Loading applications">
        {header}
        <div className="flex gap-4 overflow-hidden">
          {COLUMNS.map((c) => (
            <div key={c.status} className="h-64 min-w-[78vw] flex-1 animate-pulse rounded-2xl bg-soft sm:min-w-[14rem]" />
          ))}
        </div>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="mx-auto max-w-xl p-4 sm:p-6 lg:p-8 space-y-5">
        {header}
        <EmptyState step="detective" text="no applications yet. paste a job link on your home screen and it lands here." actionLabel="paste your first job" href="/dashboard" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {header}
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
      {/* Mobile: columns scroll sideways and snap. Desktop: five columns side by side. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 md:grid md:grid-cols-5 md:overflow-visible">
        {COLUMNS.map((col) => {
          const items = apps.filter((a) => a.status === col.status);
          return (
            <section
              key={col.status}
              aria-label={`${col.label}, ${items.length} job${items.length === 1 ? "" : "s"}`}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setOverCol(col.status);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOverCol((c) => (c === col.status ? null : c));
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                setOverCol(null);
                setDragId(null);
                if (id) move(id, col.status);
              }}
              className={`min-w-[78vw] snap-start rounded-2xl border p-3 transition sm:min-w-[16rem] md:min-w-0 ${
                overCol === col.status ? "border-pip bg-pip-soft/60" : "border-line bg-soft/50"
              }`}
            >
              <h2 className="mb-3 flex items-center justify-between px-1 font-pixel text-xs uppercase tracking-wider text-muted">
                <span>{col.label}</span>
                <span>{items.length}</span>
              </h2>
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-[11px] text-muted">
                  {dragId ? "drop here" : "nothing here"}
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {items.map((a) => (
                    <Card
                      key={a.id}
                      app={a}
                      dragging={dragId === a.id}
                      onMove={move}
                      onDragStart={setDragId}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
