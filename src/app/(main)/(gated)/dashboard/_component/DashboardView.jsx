"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PixelScene from "@/components/pixel/PixelScene";
import PipStatus from "@/components/pixel/PipStatus";
import {
  ScrollText,
  Sparkles,
  FileText,
  Mail,
  BrainCircuit,
  ClipboardCheck,
  ArrowRight,
  Send,
  ChevronRight,
  Loader2,
  Inbox,
  RotateCw,
} from "lucide-react";
import ChatSlideOver from "@/components/chat/ChatSlideOver";
import { getDashboardData } from "@/actions/Dashboard";
import { getNeedsYou } from "@/actions/Applications";
import { intakeJob } from "@/actions/Jobs";
import { generationErrorMessage } from "@/components/shared/generationError";

const EMPTY_DATA = {
  firstName: null,
  avgAtsScore: null,
  counts: {
    atsScores: 0,
    coverLetters: 0,
    coldEmails: 0,
    roadmaps: 0,
    assessments: 0,
    hasResume: false,
  },
  targets: [],
  totalTargets: 0,
  nextTasks: [],
  dueFollowUps: [],
  applications: [],
  needsYouCount: 0,
  hasOffer: false,
};

const STATUS_LABEL = {
  SAVED: "saved",
  APPLIED: "applied",
  INTERVIEWING: "interviewing",
  OFFER: "offer",
  CLOSED: "closed",
};

// Errors that mean "we could not read the page, paste the text instead" (keep the url).
const PASTE_CODES = new Set(["PASTE_NEEDED", "URL_BLOCKED", "FETCH_FAILED", "NOT_A_JOB"]);

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-soft ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6" aria-busy="true" aria-label="Loading your home">
      <div className="panel-cozy overflow-hidden border border-line bg-panel">
        <Skeleton className="h-32 sm:h-40 w-full rounded-none" />
        <div className="p-4 sm:p-6 border-t border-line">
          <Skeleton className="h-12 w-full max-w-3xl rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const router = useRouter();
  const [state, setState] = useState({ status: "loading", data: null, needs: null });
  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading" }));
    try {
      const [data, needs] = await Promise.all([
        getDashboardData(),
        getNeedsYou().catch(() => ({ error: "failed" })),
      ]);
      setState({ status: "ready", data, needs: needs && !needs.error ? needs : null });
    } catch {
      setState({ status: "error", data: null, needs: null });
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (state.status === "loading" && !state.data) return <DashboardSkeleton />;
  if (state.status === "error") {
    return (
      <div className="p-4 sm:p-8 max-w-xl mx-auto">
        <div role="alert" className="panel-cozy border border-line bg-panel p-8 text-center space-y-4">
          <Image src="/pip/pip-coffee.svg" alt="" width={96} height={96} className="mx-auto" style={{ imageRendering: "pixelated" }} unoptimized />
          <h1 className="text-lg font-semibold text-text">We couldn't load your home</h1>
          <p className="text-sm text-muted">Your data is safe. Check your connection and try again.</p>
          <button type="button" onClick={load} className="btn-pill-primary min-h-11 px-6 text-sm inline-flex items-center gap-2">
            <RotateCw className="w-4 h-4" aria-hidden="true" /> Retry
          </button>
        </div>
      </div>
    );
  }
  return <DashboardContent data={state.data} needs={state.needs} router={router} />;
}

function DashboardContent({ data, needs, router }) {
  const d = data || EMPTY_DATA;
  const counts = d.counts || EMPTY_DATA.counts;
  const targets = d.targets || [];
  const nextTasks = d.nextTasks || [];
  const dueFollowUps = d.dueFollowUps || [];
  const applications = d.applications || [];
  const needsItems = needs?.items || [];
  const needsCount = needs?.count ?? d.needsYouCount ?? 0;
  const hasOffer = !!d.hasOffer;
  const [selectedToolId, setSelectedToolId] = useState("resume");
  const [quickInput, setQuickInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [intakeMsg, setIntakeMsg] = useState(null);
  const [pasteUrl, setPasteUrl] = useState(null);
  const inputRef = useRef(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);

  const candidateName = d.firstName || null;
  const scoreText =
    d.avgAtsScore === null || d.avgAtsScore === undefined
      ? "No score yet"
      : `${d.avgAtsScore}/100`;

  // AscendAI Signature: Time of day = pipeline progress, derived from real records only.
  let sceneVariant = "morning";
  let progressStatusText = "dawn • no targets yet, start with a resume or an ats check";
  let pipOutfit = "coffee";

  if (targets.length > 0 && counts.assessments > 0) {
    sceneVariant = "pink";
    progressStatusText = `sunset • ${targets.length} target${targets.length === 1 ? "" : "s"}, interview practice under way`;
    pipOutfit = "headphones";
  } else if (targets.length > 0) {
    sceneVariant = "noon";
    progressStatusText = `noon • ${targets.length} target${targets.length === 1 ? "" : "s"} in progress`;
    pipOutfit = "thinking";
  }

  if (hasOffer) {
    sceneVariant = "dusk";
    progressStatusText = "night • you have an offer. take a breath, you earned it";
    pipOutfit = "coffee";
  }

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  const toolCards = [
    {
      id: "resume",
      name: "resume builder",
      icon: ScrollText,
      href: "/resume",
      status: counts.hasResume ? "resume saved" : "no resume yet",
      badge: "resume",
      preview: counts.hasResume
        ? "Your resume is saved. Open it to edit or export."
        : "Build your resume to get started. Other tools use it.",
    },
    {
      id: "interview",
      name: "interview prep",
      icon: Sparkles,
      href: "/interview",
      status: counts.assessments ? plural(counts.assessments, "quiz taken", "quizzes taken") : "no quizzes yet",
      badge: "quiz",
      preview: "Take a quiz on your skills and see your scores over time.",
    },
    {
      id: "cover-letter",
      name: "cover letter",
      icon: FileText,
      href: "/cover-letter",
      status: counts.coverLetters ? plural(counts.coverLetters, "letter", "letters") : "no letters yet",
      badge: "letters",
      preview: "Generate a cover letter for a specific company and role.",
    },
    {
      id: "cold-email",
      name: "cold email",
      icon: Mail,
      href: "/cold-email",
      status: counts.coldEmails ? plural(counts.coldEmails, "email", "emails") : "no emails yet",
      badge: "emails",
      preview: "Draft a short outreach email to a recruiter or hiring manager.",
    },
    {
      id: "roadmap",
      name: "career roadmap",
      icon: BrainCircuit,
      href: "/roadmap",
      status: counts.roadmaps ? plural(counts.roadmaps, "active roadmap", "active roadmaps") : "no roadmap yet",
      badge: "roadmap",
      preview: "Create a step-by-step plan toward your target role.",
    },
    {
      id: "ats",
      name: "ats scanner",
      icon: ClipboardCheck,
      href: "/resume-parser",
      status: counts.atsScores ? `avg score ${scoreText}` : "no score yet",
      badge: "ats",
      preview: "Check your resume against a job description.",
    },
  ];

  const selectedTool = toolCards.find((t) => t.id === selectedToolId) || toolCards[0];

  const handleQuickSubmit = async (e) => {
    e?.preventDefault();
    const text = quickInput.trim();
    if (busy) return;
    if (!text) {
      setChatOpen(true);
      return;
    }
    setBusy(true);
    setIntakeMsg(null);
    try {
      const res = await intakeJob({ input: text, ...(pasteUrl ? { url: pasteUrl, asJob: true } : {}) });
      if (res?.kind === "question") {
        setPendingMessage(res.text || text);
        setQuickInput("");
        setPasteUrl(null);
        setChatOpen(true);
      } else if (res?.kind === "job") {
        const q = res.notice ? `?notice=${encodeURIComponent(res.notice)}` : "";
        router.push(`/jobs/${res.job.id}${q}`);
        return; // stay busy while navigating
      } else if (res && PASTE_CODES.has(res.code)) {
        if (res.url) setPasteUrl(res.url);
        setQuickInput(res.url && !pasteUrl ? "" : quickInput);
        setIntakeMsg(res.error || "We couldn't read that page. Paste the job text here instead.");
        setTimeout(() => inputRef.current?.focus(), 0);
      } else {
        setIntakeMsg(generationErrorMessage(res, "We couldn't do that. Please try again."));
      }
    } catch {
      setIntakeMsg("We couldn't reach the server. Please try again.");
    }
    setBusy(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ─── AscendAI Signature: Greeting Card with Time of Day = Progress Scene ─── */}
      <div className="panel-cozy overflow-hidden border border-line bg-panel relative shadow-card">
        {/* Background Pixel Scene */}
        <div className="h-32 sm:h-40 w-full relative">
          <PixelScene variant={sceneVariant} seed={505} />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/30 to-transparent" />

          {/* Time of Day Progress Badge */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 max-w-[calc(100%-1.5rem)]">
            <span className="font-pixel text-[10px] sm:text-[11px] bg-panel/90 backdrop-blur-sm text-text border border-line px-2.5 sm:px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-pip shrink-0 animate-ping" />
              <span className="truncate">pipeline: {progressStatusText}</span>
            </span>
          </div>

          {/* Pip Status Floating */}
          <div className="absolute bottom-3 left-3 sm:left-6 z-10 max-w-[calc(100%-1.5rem)]">
            <PipStatus
              step={pipOutfit}
              text={`${candidateName ? `welcome back, ${candidateName.toLowerCase()}.` : "welcome back."} pip is looking at your own records.`}
              size="md"
            />
          </div>
        </div>

        {/* Input bar sitting directly on the card */}
        <div className="p-4 sm:p-6 bg-panel border-t border-line">
          <form
            onSubmit={handleQuickSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 max-w-3xl"
          >
            <div className="relative w-full flex-1">
              <label htmlFor="pip-input" className="sr-only">
                Paste a job link, or ask pip anything
              </label>
              <textarea
                id="pip-input"
                ref={inputRef}
                rows={pasteUrl ? 4 : 1}
                value={quickInput}
                disabled={busy}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleQuickSubmit();
                  }
                }}
                placeholder={pasteUrl ? "paste the job text here…" : "paste a job link, or ask pip anything"}
                className="w-full resize-none bg-bg text-text placeholder:text-faint text-sm px-4 py-3 rounded-2xl border border-line focus:border-primary focus:bg-panel outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus:shadow-[0_0_0_4px_var(--glow)] transition max-h-40 disabled:opacity-70"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="btn-pill-primary text-sm min-h-11 px-6 sm:w-auto shrink-0 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-70"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Send className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{busy ? "working…" : pasteUrl ? "add this job" : "go"}</span>
            </button>
          </form>
          {intakeMsg && (
            <p role="alert" className="mt-3 max-w-3xl rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-xs text-text">
              {intakeMsg}
              {pasteUrl && (
                <span className="mt-1 flex items-center gap-3 text-muted">
                  <span className="truncate min-w-0">link kept: {pasteUrl}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPasteUrl(null);
                      setIntakeMsg(null);
                    }}
                    className="shrink-0 underline min-h-8 rounded focus-visible:ring-2 focus-visible:ring-pip/50"
                  >
                    start over
                  </button>
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* ─── Row of 6 Tool Cards with Live Status ─── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="font-pixel text-xs uppercase text-muted tracking-wider">
            tools live status (six tools. one pip.)
          </span>
          <span className="text-[11px] text-muted">click to view quick panel</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {toolCards.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedToolId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedToolId(t.id)}
                className={`panel-cozy p-3.5 text-left transition-all relative flex flex-col justify-between min-w-0 overflow-hidden ${
                  isSelected
                    ? "border-pip ring-1 ring-pip bg-panel shadow-sm"
                    : "border-line bg-panel hover:border-line"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-bg border border-line flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-pip" />
                    </div>
                    <span className="font-pixel text-[9px] text-pip-ink bg-pip-soft px-1.5 py-0.2 rounded truncate">
                      {t.badge}
                    </span>
                  </div>
                  <h3 className="font-semibold text-xs text-text mb-1 lowercase truncate">
                    {t.name}
                  </h3>
                </div>
                <p className="font-pixel text-[10px] text-muted leading-tight truncate">
                  {t.status}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Main Content Grid: Applications + This Week List + Selected Tool Right Panel ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Applications & This Week */}
        <div className="lg:col-span-8 space-y-6">
          {/* Needs you inbox */}
          <div id="needs-you" className="panel-cozy p-5 sm:p-6 bg-panel border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <div>
                <h2 className="font-bold text-base text-text lowercase flex items-center gap-2">
                  needs you
                  <span
                    aria-label={`${needsCount} waiting`}
                    className="font-pixel text-xs text-lime-foreground bg-lime px-2 py-0.5 rounded-full min-w-6 text-center"
                  >
                    {needsCount}
                  </span>
                </h2>
                <span className="text-xs text-muted">things pip drafted that wait for your ok. nothing is sent.</span>
              </div>
            </div>
            {needsItems.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-line bg-bg/40 text-center">
                <Inbox className="w-5 h-5 text-muted mx-auto mb-2" aria-hidden="true" />
                <p className="text-sm text-text mb-1">
                  {needs ? "You're all caught up." : needsCount ? `${needsCount} waiting for you.` : "Nothing waiting."}
                </p>
                <p className="text-xs text-muted">Paste a job above and pip will draft the rest for you to review.</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {needsItems.slice(0, 5).map((it) => (
                  <li key={it.id}>
                    <Link
                      href={it.href}
                      className="p-3.5 min-h-12 rounded-xl border border-line hover:border-pip/50 active:bg-soft transition bg-bg/40 flex items-center justify-between gap-3 min-w-0"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-sm text-text block truncate">{it.title}</span>
                        <span className="text-[11px] text-muted block truncate">
                          {[it.company, it.jobTitle].filter(Boolean).join(" • ") || "review"}
                          {it.dueAt ? ` • due ${new Date(it.dueAt).toLocaleDateString(undefined, { timeZone: "UTC" })}` : ""}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
                {needsCount > 5 && <li className="text-[11px] text-muted px-1">and {needsCount - 5} more</li>}
              </ul>
            )}
          </div>

          {/* Applications */}
          <div id="applications" className="panel-cozy p-5 sm:p-6 bg-panel border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <div>
                <h2 className="font-bold text-base text-text lowercase">applications</h2>
                <span className="text-xs text-muted">each one has a single next step</span>
              </div>
              <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-1 rounded-full">
                {applications.length} {applications.length === 1 ? "job" : "jobs"}
              </span>
            </div>

            {applications.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-line bg-bg/40 text-center space-y-3">
                <PipStatus step="detective" text="no jobs yet. paste your first job above and i'll get to work." className="mx-auto" />
                <div>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.focus()}
                    className="btn-pill-primary text-xs min-h-10 px-4"
                  >
                    paste your first job
                  </button>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {applications.map((a) => (
                  <li
                    key={a.id}
                    className="p-3.5 rounded-xl border border-line hover:border-pip/50 transition bg-bg/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0"
                  >
                    <Link href={`/jobs/${a.job.id}`} className="min-w-0 flex-1 rounded focus-visible:ring-2 focus-visible:ring-pip/50">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-text">{a.job.company || "company not set"}</span>
                        <span className="text-xs text-muted truncate">• {a.job.title || "title not set"}</span>
                      </div>
                      <span className="font-pixel text-[10px] text-pip-ink bg-pip-soft px-2 py-0.5 rounded">
                        {STATUS_LABEL[a.status] || a.status.toLowerCase()}
                      </span>
                    </Link>
                    {a.nextAction && (
                      <Link href={a.nextAction.href} className="btn-pill-secondary text-xs min-h-10 py-2 px-4 shrink-0 inline-flex items-center justify-center">
                        {a.nextAction.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {targets.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-muted hover:text-text min-h-10 flex items-center rounded focus-visible:ring-2 focus-visible:ring-pip/50">
                  other targets from your documents ({d.totalTargets ?? targets.length})
                </summary>
                <div className="mt-3">
              <div className="space-y-3">
                {targets.map((t) => (
                  <div
                    key={t.key}
                    className="p-3.5 rounded-xl border border-line hover:border-pip/50 transition bg-bg/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-text">
                          {t.company || "company not set"}
                        </span>
                        <span className="text-xs text-muted truncate">• {t.role || "role not set"}</span>
                      </div>
                      <span className="text-[10px] text-muted">
                        last activity {new Date(t.lastActivityAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {t.ats && (
                        <Link href={t.ats.href} className="btn-pill-secondary text-xs py-1 px-3">
                          ats {t.ats.score}/100
                        </Link>
                      )}
                      {t.coverLetter && (
                        <Link href={t.coverLetter.href} className="btn-pill-secondary text-xs py-1 px-3">
                          cover letter
                        </Link>
                      )}
                      {t.coldEmail && (
                        <Link href={t.coldEmail.href} className="btn-pill-secondary text-xs py-1 px-3">
                          cold email
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                {d.totalTargets > targets.length && (
                  <p className="text-[11px] text-muted px-1">
                    showing {targets.length} of {d.totalTargets} targets
                  </p>
                )}
              </div>
                </div>
              </details>
            )}
          </div>

          {/* Follow-ups due */}
          <div className="panel-cozy p-5 sm:p-6 bg-panel border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <div>
                <h2 className="font-bold text-base text-text lowercase">follow-ups due</h2>
                <span className="text-xs text-muted">reminders you set on your cold emails</span>
              </div>
              <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-1 rounded-full">
                {dueFollowUps.length} due
              </span>
            </div>
            {dueFollowUps.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-line bg-bg/40 text-center">
                <p className="text-sm text-text mb-1">No follow-ups due.</p>
                <p className="text-xs text-muted">
                  Set a follow-up date on a cold email and it will show up here when it is due.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dueFollowUps.map((f) => (
                  <Link
                    key={f.id}
                    href={f.href}
                    className="p-3.5 rounded-xl border border-line hover:border-pip/50 transition bg-bg/40 flex items-center justify-between gap-3 min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-text">{f.company || "company not set"}</span>
                        <span className="text-xs text-muted truncate">• {f.role || "role not set"}</span>
                      </div>
                      <span className="text-[11px] text-muted block truncate">
                        {f.recipientName ? `to ${f.recipientName} • ` : ""}
                        {f.subject || "no subject"} • due {new Date(f.followUpAt).toLocaleDateString(undefined, { timeZone: "UTC" })}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* This Week List */}
          <div className="panel-cozy p-5 sm:p-6 bg-panel border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <div>
                <h2 className="font-bold text-base text-text lowercase">
                  this week with pip
                </h2>
                <span className="text-xs text-muted">
                  next steps from your active roadmap
                </span>
              </div>
              <Link
                href="/roadmap"
                className="text-xs text-pip hover:underline flex items-center gap-1 font-medium"
              >
                view full roadmap <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {nextTasks.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-line bg-bg/40 text-center">
                <p className="text-sm text-text mb-1">
                  {counts.roadmaps ? "All roadmap steps are done." : "No roadmap steps yet."}
                </p>
                <p className="text-xs text-muted mb-3">
                  {counts.roadmaps
                    ? "Open your roadmap to review it."
                    : "Create a career roadmap and your next steps show up here."}
                </p>
                <Link href="/roadmap" className="btn-pill-secondary text-xs py-1 px-3">
                  {counts.roadmaps ? "open roadmap" : "create a roadmap"}
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {nextTasks.map((task) => (
                  <Link
                    key={`${task.roadmapId}-${task.stepId}`}
                    href={task.href}
                    className="p-3 rounded-xl border border-line hover:bg-bg transition flex items-center justify-between gap-3"
                  >
                    <span className="text-xs text-text font-medium">{task.title}</span>
                    {task.roadmapTitle && (
                      <span className="font-pixel text-[10px] text-pip-ink bg-pip-soft px-2 py-0.5 rounded shrink-0">
                        {task.roadmapTitle}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Selected Tool Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="panel-cozy p-5 bg-panel border border-line">
            <div className="flex items-center justify-between mb-3 border-b border-line pb-2.5">
              <span className="font-pixel text-xs text-muted uppercase">
                selected tool preview
              </span>
              <span className="font-pixel text-[10px] text-pip-ink bg-pip-soft px-2 py-0.5 rounded">
                {selectedTool.badge}
              </span>
            </div>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-pip-soft flex items-center justify-center text-pip">
                <selectedTool.icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-text lowercase">
                  {selectedTool.name}
                </h3>
                <span className="text-[11px] text-muted block leading-tight">
                  {selectedTool.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed mb-4">
              {selectedTool.preview}
            </p>

            <Link
              href={selectedTool.href}
              className="btn-pill-primary w-full text-xs py-2.5 flex items-center justify-center gap-2 shadow-xs"
            >
              <span>open full {selectedTool.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Chat with Pip Widget */}
          <div className="panel-cozy p-5 bg-bg border border-line">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-pip-soft p-1 pip-hop">
                <Image
                  src="/pip/pip-thinking.svg"
                  alt="pip"
                  width={26}
                  height={26}
                  style={{ imageRendering: "pixelated" }}
                  unoptimized
                />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text">pip is ready</h4>
                <span className="font-pixel text-[10px] text-pip-ink">
                  ask about your own scores and plans
                </span>
              </div>
            </div>

            <button
              onClick={() => setChatOpen(true)}
              className="btn-pill-pip w-full text-xs py-2 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              open chat with pip
            </button>
          </div>
        </div>
      </div>

      {/* Global Slide-Over Chat */}
      <ChatSlideOver
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        initialMessage={pendingMessage}
        onInitialMessageSent={() => setPendingMessage(null)}
      />
    </div>
  );
}
