"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Check, PartyPopper, XCircle, Send, Loader2, Brain } from "lucide-react";
import { toast } from "sonner";
import { markApplied, setApplicationStatus, setInterviewDate, closeApplication, createInterviewPrep } from "@/actions/Applications";
import { generationErrorMessage } from "@/components/shared/generationError";

const LABEL = { SAVED: "saved", APPLIED: "applied", INTERVIEWING: "interviewing", OFFER: "offer", CLOSED: "closed" };

/**
 * One-tap status buttons. Every change is optimistic, rolls back on error, and offers a 5 s Undo that calls
 * setApplicationStatus(previousStatus).
 */
export default function StatusActions({ application, onChange }) {
  const [pendingKey, setPendingKey] = useState(null);
  const [pickDate, setPickDate] = useState(false);
  const [closedInfo, setClosedInfo] = useState(null);
  const router = useRouter();
  const [prepBusy, setPrepBusy] = useState(false);
  const appRef = useRef(application);
  appRef.current = application;

  const undo = async (prev, prevAt) => {
    const cur = appRef.current;
    onChange({ ...cur, status: prev, ...(prevAt !== undefined ? { interviewAt: prevAt } : {}) });
    const u = await setApplicationStatus(cur.id, prev, prevAt).catch(() => null);
    if (!u || u.error) {
      onChange(cur);
      toast.error("Couldn't undo that. Try again.");
    } else {
      onChange(u.application);
      setClosedInfo(null);
    }
  };

  const retryPrep = async () => {
    if (prepBusy) return;
    setPrepBusy(true);
    const res = await createInterviewPrep(application.id).catch(() => null);
    setPrepBusy(false);
    if (!res || res.error) {
      toast.error(generationErrorMessage(res, "We couldn't create your practice questions. Try again."));
      return;
    }
    onChange({ ...appRef.current, prepSessionId: res.prepSessionId });
    router.push(`/interview/practice?session=${res.prepSessionId}`);
  };

  const apply = async (key, optimistic, call, message, after) => {
    if (pendingKey) return;
    const before = appRef.current;
    setPendingKey(key);
    onChange({ ...before, ...optimistic });
    let res;
    try {
      res = await call();
    } catch {
      res = { error: "We couldn't reach the server.", code: "FAILED" };
    }
    setPendingKey(null);
    if (!res || res.error) {
      onChange(before); // rollback
      toast.error(generationErrorMessage(res, "That didn't save. Nothing changed."));
      return;
    }
    onChange(res.application);
    after?.(res);
    const prev = res.previousStatus;
    const prevAt = res.previousInterviewAt; // undefined leaves the date unchanged on Undo
    const practiceId = res.prepSessionId || res.application?.prepSessionId;
    if (key === "interview" && practiceId) {
      toast.success(typeof message === "function" ? message(res) : message, {
        duration: 8000,
        action: { label: "Practice", onClick: () => router.push(`/interview/practice?session=${practiceId}`) },
        cancel: {
          label: "Undo",
          onClick: () => undo(prev, prevAt),
        },
      });
      return;
    }
    toast.success(typeof message === "function" ? message(res) : message, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => undo(prev, prevAt),
      },
    });
  };

  const status = application.status;
  const btn =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95 disabled:opacity-60";
  const idle = "border-line bg-panel text-text hover:border-pip";
  const on = "border-pip bg-pip-soft text-pip-ink";

  return (
    <section aria-label="Application status" className="panel-cozy border border-line bg-panel p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-base text-text lowercase">where are you with this one?</h2>
        <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-1 rounded-full">{LABEL[status] || status}</span>
      </div>

      {status === "OFFER" && (
        <div className="flex items-center gap-4 rounded-xl border border-pip bg-pip-soft/60 p-4" role="status">
          <Image src="/pip/pip-rocket.svg" alt="" width={56} height={56} className="pip-hop" style={{ imageRendering: "pixelated" }} unoptimized />
          <div>
            <p className="text-sm font-semibold text-text flex items-center gap-1.5">
              <PartyPopper className="h-4 w-4 text-pip" aria-hidden="true" /> You got an offer. Congratulations!
            </p>
            <p className="text-xs text-muted">Take a moment to enjoy this one. You earned it.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          disabled={!!pendingKey || status === "APPLIED"}
          aria-pressed={status === "APPLIED"}
          onClick={() =>
            apply("applied", { status: "APPLIED", appliedAt: new Date().toISOString() }, () => markApplied(application.id), "Marked as applied")
          }
          className={`${btn} ${status === "APPLIED" ? on : idle}`}
        >
          {pendingKey === "applied" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          Mark applied
        </button>
        <button
          type="button"
          disabled={!!pendingKey}
          aria-expanded={pickDate}
          aria-pressed={status === "INTERVIEWING"}
          onClick={() => setPickDate((v) => !v)}
          className={`${btn} ${status === "INTERVIEWING" ? on : idle}`}
        >
          {pendingKey === "interview" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CalendarCheck className="h-4 w-4" aria-hidden="true" />}
          I got an interview
        </button>
        <button
          type="button"
          disabled={!!pendingKey || status === "OFFER"}
          aria-pressed={status === "OFFER"}
          onClick={() => apply("offer", { status: "OFFER" }, () => setApplicationStatus(application.id, "OFFER"), "Offer! Congratulations")}
          className={`${btn} ${status === "OFFER" ? on : idle}`}
        >
          {pendingKey === "offer" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          Offer
        </button>
        <button
          type="button"
          disabled={!!pendingKey || status === "CLOSED"}
          aria-pressed={status === "CLOSED"}
          onClick={() =>
            apply(
              "closed",
              { status: "CLOSED" },
              () => closeApplication(application.id, ""),
              (r) => (r.tasksAdded ? `Closed. ${r.tasksAdded} skill-gap task${r.tasksAdded === 1 ? "" : "s"} added to your roadmap` : "Closed"),
              (r) => setClosedInfo({ tasksAdded: r.tasksAdded || 0 })
            )
          }
          className={`${btn} ${status === "CLOSED" ? on : idle}`}
        >
          {pendingKey === "closed" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
          Closed
        </button>
      </div>

      {pickDate && (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="interview-date" className="text-xs text-muted">
            When is it?
          </label>
          <input
            id="interview-date"
            type="date"
            autoFocus
            disabled={!!pendingKey}
            min={new Date(Date.now() - 31536000000).toISOString().slice(0, 10)}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              setPickDate(false);
              apply(
                "interview",
                { status: "INTERVIEWING", interviewAt: `${v}T00:00:00.000Z` },
                () => setInterviewDate(application.id, v),
                "Interview saved. Pip is preparing questions",
                (r) => {
                  if (r.prepError) toast.message("Your date is saved, but prep questions couldn't be made yet.");
                }
              );
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setPickDate(false);
            }}
            className="h-11 rounded-xl border border-line bg-panel px-3 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-pip/50"
          />
        </div>
      )}

      {status === "INTERVIEWING" && application.interviewAt && (
        <p className="text-xs text-muted">Interview on {new Date(application.interviewAt).toLocaleDateString(undefined, { timeZone: "UTC" })}.</p>
      )}
      {status === "INTERVIEWING" && (
        <div>
          {application.prepSessionId ? (
            <Link
              href={`/interview/practice?session=${application.prepSessionId}`}
              className={`${btn} ${idle}`}
            >
              <Brain className="h-4 w-4" aria-hidden="true" /> Practice for this interview
            </Link>
          ) : (
            <button type="button" onClick={retryPrep} disabled={prepBusy} className={`${btn} ${idle}`}>
              {prepBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Brain className="h-4 w-4" aria-hidden="true" />}
              Prepare practice questions
            </button>
          )}
        </div>
      )}
      {status === "CLOSED" && closedInfo && (
        <p className="text-xs text-muted" role="status">
          {closedInfo.tasksAdded
            ? `${closedInfo.tasksAdded} skill-gap task${closedInfo.tasksAdded === 1 ? "" : "s"} added to your roadmap.`
            : "No roadmap tasks were added."}
        </p>
      )}
    </section>
  );
}
