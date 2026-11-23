"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, MoreHorizontal, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { getApplications, setApplicationStatus, markApplied, createInterviewPrep, getNeedsYou } from "@/actions/Applications";
import { undo as undoAction } from "@/actions/Undo";
import { approveAndCopy } from "@/actions/Track";
import { generationErrorMessage } from "@/components/shared/generationError";
import AppWindow from "@/components/ui/AppWindow";
import EmptyState from "@/components/ui/EmptyState";
import KanbanBoard from "@/components/ui/KanbanBoard";
import PixelScene from "@/components/ui/PixelScene";
import Skeleton from "@/components/ui/Skeleton";
import StepCaption from "@/components/ui/StepCaption";
import UndoToast from "@/components/ui/UndoToast";
import FollowUpCard from "./FollowUpCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DEFAULT_ACTIONS = { getApplications, setApplicationStatus, markApplied, createInterviewPrep, getNeedsYou, undo: undoAction, approveAndCopy };

// Four columns like the design: offer and closed share the last one (closed cards carry a badge).
const COLUMNS = [
  { status: "SAVED", label: "saved" },
  { status: "APPLIED", label: "applied" },
  { status: "INTERVIEWING", label: "interviewing" },
  { status: "OFFER", label: "offer" },
];
const MOVE_TO = [...COLUMNS, { status: "CLOSED", label: "closed" }];
const LABEL = Object.fromEntries(MOVE_TO.map((c) => [c.status, c.label]));
const colOf = (status) => (status === "CLOSED" ? "OFFER" : status);
const COLS = COLUMNS.map((c) => ({ id: c.status, title: c.label }));
const day = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" }).toLowerCase();

function DatePrompt({ onPick, onSkip, busy }) {
  return (
    <div role="group" aria-label="interview date" className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-soft p-2">
      <label htmlFor="board-interview-date" className="text-[11px] text-muted">
        interview date (optional)
      </label>
      <input
        id="board-interview-date"
        type="date"
        autoFocus
        disabled={busy}
        onChange={(e) => e.target.value && onPick(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onSkip()}
        className="h-10 rounded-lg border border-line bg-panel px-2 text-xs text-text outline-none focus-visible:ring-2 focus-visible:ring-pip/50"
      />
      <button type="button" onClick={onSkip} className="min-h-10 px-2 text-[11px] text-muted underline outline-none focus-visible:ring-2 focus-visible:ring-pip/50">
        skip
      </button>
    </div>
  );
}

function CardBody({ app, onMove, onMark, onAskDate, askDate, onPickDate, onSkipDate, dateBusy }) {
  const name = app.job.company || app.job.title || "this job";
  return (
    <>
      <div className="flex items-start gap-1">
        <Link href={`/jobs/${app.job.id}`} className="min-w-0 flex-1 rounded outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <span className="block truncate font-doc text-base text-text">{app.job.company || "company not set"}</span>
          <span className="block truncate font-doc text-sm text-faint">{app.job.title || "title not set"}</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`more for ${name}`}
              className="-mr-2 -mt-1.5 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-faint outline-none hover:bg-soft hover:text-text focus-visible:ring-2 focus-visible:ring-brand active:scale-95"
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>move to</DropdownMenuLabel>
            {MOVE_TO.filter((c) => c.status !== app.status).map((c) => (
              <DropdownMenuItem key={c.status} className="min-h-10" onSelect={() => onMove(app.id, c.status)}>
                {c.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {app.status === "INTERVIEWING" && (
              <DropdownMenuItem className="min-h-10" onSelect={() => onAskDate(app.id)}>
                {app.interviewAt ? "change interview date" : "add interview date"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild className="min-h-10">
              <Link href={`/jobs/${app.job.id}`}>notes, dates and details</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {askDate && app.status === "INTERVIEWING" && <DatePrompt onPick={onPickDate} onSkip={onSkipDate} busy={dateBusy} />}
      {(app.isQuiet || app.status === "CLOSED" || (app.status === "INTERVIEWING" && app.interviewAt)) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {app.isQuiet && app.status === "APPLIED" && (
            <span className="inline-block rounded-[9px] bg-warn-soft px-2.5 py-1 font-doc text-sm text-warn-ink">quiet · {app.quietDays} days</span>
          )}
          {app.status === "INTERVIEWING" && app.interviewAt && (
            <span className="inline-block rounded-[9px] bg-brand-soft px-2.5 py-1 font-doc text-sm text-brand-ink">interview · {day(app.interviewAt)}</span>
          )}
          {app.status === "CLOSED" && <span className="inline-block rounded-[9px] bg-gap-soft px-2.5 py-1 font-doc text-sm text-gap-ink">closed</span>}
        </div>
      )}
      {app.status === "SAVED" && (
        <button
          type="button"
          onClick={() => onMark(app.id)}
          className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-brand-soft px-4 font-doc text-sm text-brand-ink outline-none transition hover:bg-brand-soft/70 focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.98] md:min-h-9"
        >
          <Check className="size-3.5" aria-hidden="true" />
          mark applied
        </button>
      )}
      {app.nextAction && (
        <Link
          href={app.nextAction.href}
          className="mt-2 inline-flex min-h-9 items-center gap-1 rounded-full bg-pip-soft px-3 text-xs font-medium text-pip-ink outline-none hover:bg-pip-soft/70 focus-visible:ring-2 focus-visible:ring-brand"
        >
          {app.nextAction.label}
          <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      )}
    </>
  );
}

function Shell({ children, caption = true, title = "ascendai · applications" }) {
  return (
    <div className="relative min-h-full">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <PixelScene variant="sea" seed={505} />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-4 px-3 pb-10 pt-4 sm:px-8 sm:pt-8">
        <h1 className="sr-only">applications</h1>
        {caption && <StepCaption>you apply. pip tracks and follows up.</StepCaption>}
        <AppWindow title={title} className="relative" bodyClassName="p-3 sm:p-6">
          {children}
        </AppWindow>
      </div>
    </div>
  );
}

export default function ApplicationsBoard({ actions = DEFAULT_ACTIONS }) {
  const router = useRouter();
  const [apps, setApps] = useState(null); // null = loading
  const [drafts, setDrafts] = useState([]); // FOLLOW_UP_DRAFT needs-you items
  const [error, setError] = useState(null);
  const [announce, setAnnounce] = useState("");
  const [undoBar, setUndoBar] = useState(null); // { message, run }
  const [dateFor, setDateFor] = useState(null); // { id, prev, prevAt }: card asking for an interview date
  const [dateBusy, setDateBusy] = useState(false);
  const appsRef = useRef([]);
  const inflight = useRef(0);
  appsRef.current = apps || [];

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) {
        setError(null);
        setApps(null);
      }
      try {
        const [res, ny] = await Promise.all([actions.getApplications(), actions.getNeedsYou().catch(() => null)]);
        if (!res || res.error) {
          if (!quiet) setError(generationErrorMessage(res, "we couldn't load your applications."));
          return;
        }
        // A quiet refresh must never overwrite a move that is still in flight.
        if (quiet && inflight.current > 0) return;
        setApps(res.applications || []);
        if (ny && !ny.error) setDrafts((ny.items || []).filter((i) => i.type === "FOLLOW_UP_DRAFT"));
      } catch {
        if (!quiet) setError("we couldn't load your applications.");
      }
    },
    [actions],
  );

  useEffect(() => {
    load();
  }, [load]);

  const patch = (id, fn) => setApps((list) => (list || []).map((a) => (a.id === id ? fn(a) : a)));

  // Optimistic move. `call` is the server action to run. Rolls back on error; success shows the undo bar.
  const move = useCallback(
    async (id, status, { isUndo = false, prevAt, call } = {}) => {
      const current = appsRef.current.find((a) => a.id === id);
      if (!current || current.status === status) return;
      const before = current;
      const marking = status === "APPLIED" && before.status === "SAVED";
      patch(id, (a) => ({
        ...a,
        status,
        ...(status === "APPLIED" ? { quietDays: 0, isQuiet: false, appliedAt: a.appliedAt || new Date().toISOString() } : {}),
        ...(status !== "APPLIED" ? { quietDays: null, isQuiet: false } : {}),
      }));
      inflight.current += 1;
      let res;
      try {
        res = await (call ? call() : actions.setApplicationStatus(id, status, ...(prevAt !== undefined ? [prevAt] : [])));
      } catch {
        res = { error: "we couldn't reach the server.", code: "FAILED" };
      }
      inflight.current -= 1;
      if (!res || res.error) {
        patch(id, () => before); // rollback
        toast.error(generationErrorMessage(res, "that move didn't save. nothing changed."));
        return;
      }
      patch(id, (a) => ({ ...a, ...res.application, status: res.application?.status ?? status }));
      const name = (before.job.company || before.job.title || "job").toLowerCase();
      setAnnounce(`${name} moved to ${LABEL[status]}`);
      load(true); // refresh each card's next action
      if (isUndo) {
        setDateFor((d) => (d?.id === id ? null : d));
        return;
      }
      const prev = res.previousStatus || before.status;
      const undoAt = res.previousInterviewAt;
      if (status === "INTERVIEWING") setDateFor({ id, prev, prevAt: undoAt });
      const added = status === "CLOSED" ? res.tasksAdded || 0 : 0;
      const gaps = added ? ` · ${added} gap${added === 1 ? "" : "s"} added to your roadmap` : "";
      const token = res.undoToken;
      setUndoBar({
        message: marking ? `${name} marked applied` : `${name} moved to ${LABEL[status]}${gaps}`,
        run: () =>
          move(id, prev, {
            isUndo: true,
            prevAt: undoAt,
            call: token ? () => actions.undo(token) : undefined,
          }),
      });
    },
    [actions, load],
  );

  const saveDate = async (v) => {
    if (!dateFor || dateBusy) return;
    const { id, prev, prevAt } = dateFor;
    setDateBusy(true);
    let res;
    try {
      res = await actions.setApplicationStatus(id, "INTERVIEWING", `${v}T00:00:00.000Z`);
    } catch {
      res = null;
    }
    setDateBusy(false);
    if (!res || res.error) {
      toast.error(generationErrorMessage(res, "we couldn't save the date. you can add it on the job page."));
      return;
    }
    setDateFor(null);
    patch(id, (a) => ({ ...a, ...res.application }));
    load(true);
    const practice = res.prepSessionId || null;
    const retryPrep = async () => {
      let p;
      try {
        p = await actions.createInterviewPrep(id);
      } catch {
        p = null;
      }
      if (!p || p.error || !p.prepSessionId) {
        toast.error(generationErrorMessage(p, "we couldn't prepare questions. try again from the job page."));
        return;
      }
      patch(id, (a) => ({ ...a, prepSessionId: p.prepSessionId }));
      toast.success("questions are ready", {
        duration: 5000,
        action: { label: "practice", onClick: () => router.push(`/interview/practice?session=${p.prepSessionId}`) },
      });
    };
    toast.success("interview date saved", {
      duration: 5000,
      description: res.prepError ? generationErrorMessage({ code: res.prepError }, "we couldn't prepare questions yet.") : undefined,
      action: practice
        ? { label: "practice", onClick: () => router.push(`/interview/practice?session=${practice}`) }
        : res.prepError
          ? { label: "prepare questions", onClick: retryPrep }
          : { label: "undo", onClick: () => move(id, prev, { isUndo: true, prevAt }) },
    });
  };

  const dropDraft = (it) => setDrafts((cur) => cur.filter((d) => d.id !== it.id));
  const restoreDraft = (it) => setDrafts((cur) => (cur.some((d) => d.id === it.id) ? cur : [it, ...cur]));

  if (error) {
    return (
      <Shell caption={false}>
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[14px] bg-gap-soft px-4 py-3 text-sm text-gap-ink">
          <span className="min-w-0 flex-1 font-doc text-base">{error}</span>
          <button type="button" onClick={() => load()} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-5 text-sm text-ink-foreground">
            <RotateCw className="size-3.5" aria-hidden="true" /> retry
          </button>
        </div>
      </Shell>
    );
  }

  if (apps === null) {
    return (
      <Shell>
        <div className="flex gap-3 overflow-hidden" aria-busy="true" aria-label="loading applications">
          {COLUMNS.map((c) => (
            <div key={c.status} className="min-h-72 w-[78%] shrink-0 space-y-2 rounded-[18px] bg-soft p-3 md:w-auto md:flex-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-14 bg-panel" />
              {c.status !== "OFFER" && <Skeleton className="h-14 bg-panel" />}
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  if (apps.length === 0) {
    return (
      <Shell caption={false}>
        <EmptyState
          outfit="detective"
          title="no applications yet"
          text="paste a job link on your home screen and it lands here."
          action={
            <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-ink-foreground">
              paste your first job
            </Link>
          }
        />
      </Shell>
    );
  }

  const cards = apps.map((a) => ({ id: a.id, col: colOf(a.status), app: a }));
  const first = drafts[0];

  return (
    <Shell>
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>
      <KanbanBoard
        columns={COLS}
        cards={cards}
        className="-mx-3 snap-mandatory px-3 sm:mx-0 sm:px-0"
        onMove={(id, to) => {
          const a = appsRef.current.find((x) => x.id === id);
          if (!a || colOf(a.status) === to) return;
          move(id, to, to === "APPLIED" && a.status === "SAVED" ? { call: () => actions.markApplied(id) } : {});
        }}
        renderCard={(c) => (
          <CardBody
            app={c.app}
            onMove={(id, st) => move(id, st)}
            onMark={(id) => move(id, "APPLIED", { call: () => actions.markApplied(id) })}
            onAskDate={(id) => setDateFor({ id, prev: "INTERVIEWING", prevAt: undefined })}
            askDate={dateFor?.id === c.id}
            dateBusy={dateBusy}
            onPickDate={saveDate}
            onSkipDate={() => setDateFor(null)}
          />
        )}
      />
      {first && (
        <div className="mt-4 space-y-2 lg:absolute lg:bottom-6 lg:right-6 lg:mt-0 lg:w-[min(420px,40%)]">
          <FollowUpCard item={first} onDone={dropDraft} onRestore={restoreDraft} approve={actions.approveAndCopy} />
          {drafts.length > 1 && (
            <Link href="/needs-you" className="block px-2 text-right font-doc text-sm text-muted underline">
              {drafts.length - 1} more in needs you
            </Link>
          )}
        </div>
      )}
      <UndoToast
        open={!!undoBar}
        message={undoBar?.message}
        onUndo={() => undoBar?.run()}
        onClose={() => setUndoBar(null)}
        className="bottom-24 md:bottom-6"
      />
    </Shell>
  );
}
