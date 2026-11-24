"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronDown, FileText, Inbox, Loader2, Mail, MessageSquareReply, ScrollText, ClipboardCheck, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { getNeedsYou, approveNeedsYou, unapproveNeedsYou, createFollowUpDraft, createInterviewPrep } from "@/actions/Applications";
import { generationErrorMessage } from "@/components/shared/generationError";
import EmptyState from "@/components/shared/EmptyState";
import LetterReview from "./LetterReview";
import TailorReview from "./TailorReview";
import FollowUpCard from "../../applications/_components/FollowUpCard";

const TYPES = {
  TAILOR_DRAFT: { label: "resume edits", icon: ScrollText, step: "TAILOR" },
  COVER_LETTER: { label: "cover letter", icon: FileText, step: "WRITER" },
  COLD_EMAIL: { label: "cold email", icon: Mail, step: "CONNECTOR" },
  ATS_FIX: { label: "ats fix", icon: ClipboardCheck, step: "CHECKER" },
  FOLLOW_UP_DRAFT: { label: "follow-up draft", icon: MessageSquareReply, step: null },
  FOLLOW_UP: { label: "follow up", icon: MessageSquareReply, step: null },
  PREP_INTERVIEW: { label: "interview prep", icon: CalendarClock, step: null },
};

function DueNote({ dueAt }) {
  if (!dueAt) return null;
  return <span className="text-[11px] text-muted">due {new Date(dueAt).toLocaleDateString(undefined, { timeZone: "UTC" })}</span>;
}

export default function NeedsYouQueue({ focus }) {
  const [items, setItems] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(focus || null);
  const [busyId, setBusyId] = useState(null);
  const [missingFocus, setMissingFocus] = useState(false);
  const itemsRef = useRef([]);
  itemsRef.current = items || [];

  const load = useCallback(async () => {
    setError(null);
    setItems(null);
    try {
      const res = await getNeedsYou();
      if (!res || res.error) {
        setError(generationErrorMessage(res, "We couldn't load your list."));
        return;
      }
      const list = res.items || [];
      setItems(list);
      if (focus) {
        if (list.some((i) => i.id === focus)) setOpenId(focus);
        else {
          setMissingFocus(true);
          setOpenId(list[0]?.id ?? null);
        }
      } else {
        setOpenId(list[0]?.id ?? null);
      }
    } catch {
      setError("We couldn't load your list.");
    }
  }, [focus]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!openId || !items) return;
    document.getElementById(`ny-${openId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    // only when the opened item changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  // Take an item out of the list at once; put it back where it was if the server says no.
  const removeOptimistic = useCallback(async (item, call, successMessage) => {
    const list = itemsRef.current;
    const index = list.findIndex((i) => i.id === item.id);
    setBusyId(item.id);
    setItems(list.filter((i) => i.id !== item.id));
    let res;
    try {
      res = await call();
    } catch {
      res = { error: "We couldn't reach the server.", code: "FAILED" };
    }
    setBusyId(null);
    if (!res || res.error) {
      setItems((cur) => {
        const next = [...(cur || [])];
        next.splice(Math.max(index, 0), 0, item); // rollback
        return next;
      });
      toast.error(generationErrorMessage(res, "That didn't go through. Nothing changed."));
      return null;
    }
    if (successMessage) toast.success(typeof successMessage === "function" ? successMessage(res) : successMessage);
    setOpenId((cur) => (cur === item.id ? itemsRef.current[0]?.id ?? null : cur));
    return res;
  }, []);

  // Put an approved item back where it was (optimistic); take it out again if the server says no.
  const restore = useCallback(async (item, index) => {
    setItems((cur) => {
      const next = (cur || []).filter((i) => i.id !== item.id);
      next.splice(Math.min(Math.max(index, 0), next.length), 0, item);
      return next;
    });
    let res;
    try {
      res = await unapproveNeedsYou(item.applicationId, TYPES[item.type].step);
    } catch {
      res = { error: "We couldn't reach the server.", code: "FAILED" };
    }
    if (!res || res.error) {
      setItems((cur) => (cur || []).filter((i) => i.id !== item.id));
      toast.error("Couldn't undo that. Try again.");
    }
  }, []);

  const approve = async (item) => {
    const index = itemsRef.current.findIndex((i) => i.id === item.id);
    const res = await removeOptimistic(item, () => approveNeedsYou(item.applicationId, TYPES[item.type].step));
    if (res) {
      toast.success("Approved. Nothing was sent.", {
        duration: 5000,
        action: { label: "Undo", onClick: () => restore(item, index) },
      });
    }
    return res;
  };

  const header = (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-text lowercase">needs you</h1>
        <p className="text-xs text-muted">pip does the drafting. you decide.</p>
      </div>
      {items && items.length > 0 && (
        <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-1 rounded-full" aria-live="polite">
          {items.length} waiting
        </span>
      )}
    </div>
  );

  const wrap = "mx-auto max-w-3xl p-4 sm:p-6 lg:p-8 space-y-5";

  if (error) {
    return (
      <div className={wrap}>
        {header}
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-xs text-text">
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={load} className="btn-pill-secondary inline-flex min-h-10 items-center gap-1.5 px-4 text-xs">
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (items === null) {
    return (
      <div className={wrap} aria-busy="true" aria-label="Loading your review list">
        {header}
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-soft" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={wrap}>
        {header}
        {missingFocus && <p className="text-xs text-muted">That one was already handled.</p>}
        <EmptyState step="coffee" text="all caught up. nothing needs you right now." actionLabel="back to home" href="/dashboard" />
      </div>
    );
  }

  return (
    <div className={wrap}>
      {header}
      {missingFocus && (
        <p role="status" className="rounded-xl border border-line bg-panel px-4 py-2 text-xs text-muted">
          That item was already handled or has expired. Here&apos;s what&apos;s left.
        </p>
      )}
      <ul className="space-y-3">
        {items.map((item) => {
          const t = TYPES[item.type] || { label: item.type.toLowerCase(), icon: Inbox };
          const Icon = t.icon;
          const open = openId === item.id;
          return (
            <li key={item.id} id={`ny-${item.id}`} className={`rounded-2xl border bg-panel shadow-card transition ${open ? "border-primary shadow-[0_0_0_4px_var(--glow)]" : "border-line hover:border-primary/40"}`}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`ny-panel-${item.id}`}
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-pip/50"
              >
                <Icon className="h-4 w-4 shrink-0 text-pip" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text">{item.title}</span>
                  <span className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
                    <span className="font-pixel text-pip-ink">{t.label}</span>
                    {item.company && <span className="truncate">{item.company}</span>}
                    <DueNote dueAt={item.dueAt} />
                  </span>
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {open && (
                <div id={`ny-panel-${item.id}`} className="border-t border-line px-4 py-4">
                  <ItemBody item={item} busy={busyId === item.id} onApprove={() => approve(item)} removeOptimistic={removeOptimistic} setItems={setItems} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ItemBody({ item, busy, onApprove, removeOptimistic, setItems }) {
  const router = useRouter();
  switch (item.type) {
    case "COVER_LETTER":
      return <LetterReview kind="letter" item={item} href={item.href} onApprove={onApprove} approving={busy} />;
    case "COLD_EMAIL":
      return <LetterReview kind="email" item={item} href={item.href} onApprove={onApprove} approving={busy} />;
    case "TAILOR_DRAFT":
      return <TailorReview item={item} onDismiss={onApprove} onSaved={() => onApprove()} />;
    case "ATS_FIX":
      return (
        <div className="space-y-3">
          <p className="text-sm text-text">Your latest ATS result has lines Pip can rewrite. You pick what to apply.</p>
          <div className="flex flex-wrap gap-2">
            <Link href={item.href} className="btn-pill-primary inline-flex min-h-11 items-center px-5 text-xs">
              Review the fixes
            </Link>
            <button type="button" disabled={busy} onClick={onApprove} className="btn-pill-secondary min-h-11 px-5 text-xs disabled:opacity-60">
              Not now
            </button>
          </div>
        </div>
      );
    case "FOLLOW_UP_DRAFT":
      return (
        <FollowUpCard
          item={item}
          className="border-0 p-0 shadow-none"
          onDone={(it) => setItems((cur) => (cur || []).filter((i) => i.id !== it.id))}
          onRestore={(it) => setItems((cur) => ((cur || []).some((i) => i.id === it.id) ? cur : [it, ...(cur || [])]))}
        />
      );
    case "FOLLOW_UP":
      return (
        <div className="space-y-3">
          <p className="text-sm text-text">It&apos;s been quiet since you applied. Pip can draft a short follow-up. It is never sent for you.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const res = await removeOptimistic(item, () => createFollowUpDraft(item.applicationId), "Follow-up drafted. Find it in cold emails.");
                if (res?.href) toast.message("Open the draft", { action: { label: "Open", onClick: () => router.push(res.href) } });
              }}
              className="btn-pill-primary inline-flex min-h-11 items-center gap-2 px-5 text-xs disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Draft a follow-up
            </button>
            <Link href={item.href} className="btn-pill-secondary inline-flex min-h-11 items-center px-5 text-xs">
              Open the job
            </Link>
          </div>
        </div>
      );
    case "PREP_INTERVIEW": {
      const hasSession = String(item.href || "").startsWith("/interview/practice");
      return (
        <div className="space-y-3">
          <p className="text-sm text-text">You have an interview coming up. Pip can make practice questions from the job description.</p>
          <div className="flex flex-wrap gap-2">
            {hasSession ? (
              <Link href={item.href} className="btn-pill-primary inline-flex min-h-11 items-center px-5 text-xs">
                Practice for this interview
              </Link>
            ) : (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                const res = await removeOptimistic(item, () => createInterviewPrep(item.applicationId), "Practice questions are ready.");
                if (res?.prepSessionId) toast.message("Start practising", { action: { label: "Practice", onClick: () => router.push(`/interview/practice?session=${res.prepSessionId}`) } });
              }}
              className="btn-pill-primary inline-flex min-h-11 items-center gap-2 px-5 text-xs disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Prepare questions
            </button>
            )}
            <Link href={`/jobs/${item.jobId}`} className="btn-pill-secondary inline-flex min-h-11 items-center px-5 text-xs">
              Open the job
            </Link>
          </div>
        </div>
      );
    }
    default:
      return (
        <Link href={item.href} className="btn-pill-secondary inline-flex min-h-11 items-center px-5 text-xs">
          Open
        </Link>
      );
  }
}
