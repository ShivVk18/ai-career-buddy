"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { RotateCw } from "lucide-react";
import PixelScene from "@/components/ui/PixelScene";
import PipStatus from "@/components/ui/PipStatus";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import PipAvatar from "@/components/ui/PipAvatar";
import ChatSlideOver from "@/components/chat/ChatSlideOver";
import { getHomeState } from "@/actions/Home";
import { getDashboardData } from "@/actions/Dashboard";
import { startIntake } from "@/actions/Intake";
import { retryPipeline } from "@/actions/Pipeline";
import { generationErrorMessage } from "@/components/shared/generationError";
import JobCard from "./JobCard";
import { NeedsYou, Applications, WeekTasks, BotRow, Targets } from "./HomeSections";

const DEFAULT_ACTIONS = { getHomeState, getDashboardData, startIntake, retryPipeline };
const SCENE = { dawn: "morning", noon: "noon", sunset: "dusk", night: "night" };

// Errors that mean "we could not read the page, paste the text instead" (keep the url).
const PASTE_CODES = new Set(["PASTE_NEEDED", "URL_BLOCKED", "FETCH_FAILED", "NOT_A_JOB"]);
const URL_RE = /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/\S*)?$/i;
const looksLikeUrl = (t) => !/\s/.test(t) && URL_RE.test(t);
const withScheme = (t) => (/^https?:\/\//i.test(t) ? t : `https://${t}`);

// Employment type and experience range, read from pasted job text when the server did not give them.
function sniffMeta(text) {
  const t = String(text || "");
  const type = /\b(full[- ]time|part[- ]time|contract|internship|freelance)\b/i.exec(t)?.[1]?.toLowerCase().replace(" ", "-");
  const yrs = /\b(\d{1,2})\s*(?:[-–to]+\s*(\d{1,2}))?\s*\+?\s*(?:years|yrs)\b/i.exec(t);
  const experience = yrs ? (yrs[2] ? `${yrs[1]}–${yrs[2]} yrs` : `${yrs[1]}+ yrs`) : null;
  return { employmentType: type || null, experience };
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "good morning" : h < 18 ? "good afternoon" : "good evening";
}

function Shell({ stage = "dawn", children }) {
  return (
    <div className="relative min-h-full">
      {/* The scene stays put while the panel scrolls over it. */}
      <div aria-hidden="true" className="pointer-events-none sticky top-0 z-0 -mb-[100dvh] h-[100dvh]">
        <PixelScene variant={SCENE[stage] || "morning"} seed={505} />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-5xl px-3 pb-6 pt-4 sm:px-8 sm:pb-10 sm:pt-10">
        <div className="rounded-[20px] border border-line bg-panel p-5 shadow-soft sm:p-10">{children}</div>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <Shell>
      <div aria-busy="true" className="space-y-6">
        <PipStatus outfit="coffee" text="opening your home" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-3/4 max-w-md" />
          <Skeleton className="h-5 w-1/2 max-w-xs" />
        </div>
        <Skeleton className="h-14 w-full rounded-full" />
        <Skeleton className="h-24 w-full rounded-[14px]" />
        <Skeleton className="h-24 w-full rounded-[14px]" />
      </div>
    </Shell>
  );
}

export default function DashboardView({ actions = DEFAULT_ACTIONS, initialData = null, name = null }) {
  const { user } = useUser();
  const firstName = (name ?? user?.firstName ?? "").toLowerCase();
  const [state, setState] = useState(initialData ? { status: "ready", data: initialData } : { status: "loading", data: null });
  const [hello, setHello] = useState("hello");
  useEffect(() => setHello(greeting()), []);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setState({ status: "loading", data: null });
      try {
        const res = await actions.getHomeState();
        if (!res || res.error) throw new Error("home");
        setState({ status: "ready", data: res });
        return res;
      } catch {
        if (!silent) setState({ status: "error", data: null });
        return null;
      }
    },
    [actions]
  );
  useEffect(() => {
    if (!initialData) load();
  }, [load, initialData]);

  // Targets from documents and cold-email follow-ups come from the older dashboard call. Failure just hides them.
  const [extras, setExtras] = useState({ targets: [], totalTargets: 0, dueFollowUps: [] });
  const loadExtras = useCallback(async () => {
    try {
      const r = await actions.getDashboardData?.();
      if (r && !r.error) setExtras({ targets: r.targets || [], totalTargets: r.totalTargets, dueFollowUps: r.dueFollowUps || [] });
    } catch {}
  }, [actions]);
  useEffect(() => {
    loadExtras();
  }, [loadExtras]);

  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pasteUrl, setPasteUrl] = useState(null);
  const [card, setCard] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);
  useEffect(() => () => clearTimeout(pollRef.current), []);

  // Chips the server fills in after the response, and bot progress, arrive by re-reading home state.
  const poll = useCallback(
    (applicationId, tries = 0) => {
      clearTimeout(pollRef.current);
      pollRef.current = setTimeout(async () => {
        const res = await load(true);
        const app = res?.applications?.find((a) => a.id === applicationId);
        if (app) {
          setCard((c) =>
            c && c.applicationId === applicationId
              ? {
                  ...c,
                  chips: { ...c.chips, company: c.chips?.company || app.job.company, role: c.chips?.role || app.job.title, location: c.chips?.location || app.job.location },
                  bots: { run: app.bot?.state, completedCount: app.bot?.completedCount ?? 0, total: app.bot?.total ?? 4 },
                }
              : c
          );
        }
        const state = app?.bot?.state;
        if (tries < 40 && (!app || state === "running" || state === "idle")) poll(applicationId, tries + 1);
      }, 3000);
    },
    [load]
  );

  const submit = async (raw) => {
    const text = (raw ?? value).trim();
    if (busy) return;
    if (!text) {
      setChatOpen(true);
      return;
    }
    const isUrl = looksLikeUrl(text);
    const input = isUrl ? withScheme(text) : text;
    setMsg(null);
    setBusy(true);
    // Optimistic: the card is on screen in the same tick, before the server answers.
    if (isUrl || pasteUrl || text.length > 200) setCard({ phase: "reading", source: isUrl ? text : pasteUrl, chips: null });
    try {
      const res = await actions.startIntake({ input, ...(pasteUrl ? { url: pasteUrl, asJob: true } : {}) });
      if (res?.kind === "question") {
        setCard(null);
        setPendingMessage(res.text || text);
        setValue("");
        setPasteUrl(null);
        setChatOpen(true);
      } else if (res?.kind === "job") {
        setCard({
          phase: "ready",
          source: text,
          jobId: res.jobId,
          applicationId: res.applicationId,
          chips: { ...(res.job?.text ? {} : sniffMeta(text)), ...res.chips },
          bots: { run: "running", completedCount: 0, total: 4 },
        });
        setValue("");
        setPasteUrl(null);
        load(true);
        poll(res.applicationId);
      } else if (res && PASTE_CODES.has(res.code)) {
        setCard(null);
        if (res.url) setPasteUrl(res.url);
        setValue(res.url && !pasteUrl ? "" : value);
        setMsg(res.error || "we couldn't read that page. paste the job text here instead.");
        setTimeout(() => inputRef.current?.focus(), 0);
      } else {
        setCard(null);
        setMsg(generationErrorMessage(res, "we couldn't do that. please try again."));
      }
    } catch {
      setCard(null);
      setMsg("we couldn't reach the server. please try again.");
    }
    setBusy(false);
  };

  const addTarget = async (t) => {
    const label = [t.role, t.company].filter(Boolean).join(" at ") || "a role";
    try {
      const res = await actions.startIntake({ input: `${label}. added from my saved documents, details to be filled in.`, asJob: true });
      if (res?.kind === "job") {
        load(true);
        loadExtras();
        return true;
      }
      return generationErrorMessage(res, "we couldn't add that. paste the job link above instead.");
    } catch {
      return "we couldn't reach the server. try again.";
    }
  };

  const retryBots = async () => {
    if (!card?.applicationId) return;
    setCard((c) => ({ ...c, bots: { ...c.bots, run: "running" } }));
    await actions.retryPipeline(card.applicationId).catch(() => null);
    poll(card.applicationId);
  };

  if (state.status === "loading") return <HomeSkeleton />;
  if (state.status === "error") {
    return (
      <Shell>
        <div role="alert" className="flex flex-col items-center gap-4 py-10 text-center">
          <PipAvatar outfit="coffee" size="xl" alt="" />
          <p className="font-doc text-xl text-text">we couldn't open your home.</p>
          <p className="max-w-sm text-sm text-muted">your data is safe. check your connection and try again.</p>
          <button type="button" onClick={() => load()} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-medium text-ink-foreground">
            <RotateCw className="size-4" aria-hidden="true" /> retry
          </button>
        </div>
      </Shell>
    );
  }

  const d = state.data;
  const apps = d.applications || [];
  const tasks = d.tasks || [];
  const known = new Set(apps.map((a) => `${(a.job.company || "").toLowerCase()}|${(a.job.title || "").toLowerCase()}`));
  const targets = (extras.targets || []).filter((t) => !known.has(`${(t.company || "").toLowerCase()}|${(t.role || "").toLowerCase()}`));
  const followUps = extras.dueFollowUps || [];
  const isNew = !apps.length && !d.needsYou?.count && !tasks.length && !card && !targets.length && !followUps.length;

  return (
    <Shell stage={d.stage}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-[40px] sm:leading-tight">
            {hello}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-1 text-base text-muted sm:text-lg">what are we applying to today?</p>
        </div>

        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-center gap-2 rounded-[28px] border border-line bg-panel py-1.5 pl-4 pr-1.5 sm:pl-5 shadow-card transition focus-within:border-brand focus-within:shadow-[0_0_0_4px_var(--brand-soft)]"
          >
            <label htmlFor="pip-input" className="sr-only">
              paste a job link, or ask pip anything
            </label>
            <textarea
              id="pip-input"
              ref={inputRef}
              rows={pasteUrl ? 4 : 1}
              value={value}
              disabled={busy}
              onChange={(e) => setValue(e.target.value)}
              onPaste={(e) => {
                const t = e.clipboardData.getData("text").trim();
                if (!pasteUrl && looksLikeUrl(t)) {
                  e.preventDefault();
                  setValue(t);
                  submit(t);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={pasteUrl ? "paste the job text here" : "paste a job link, or ask pip anything"}
              wrap={pasteUrl ? "soft" : "off"}
              className="min-h-11 w-full resize-none self-center bg-transparent py-3 text-sm text-text outline-none sm:text-base placeholder:text-faint disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 min-w-12 shrink-0 items-center justify-center rounded-full bg-ink px-4 sm:min-w-14 sm:px-5 text-sm font-medium text-ink-foreground transition hover:opacity-90 active:translate-y-px disabled:opacity-70"
            >
              {busy ? "…" : pasteUrl ? "add" : "go"}
            </button>
          </form>
          {msg && (
            <p role="alert" className="mt-3 rounded-[14px] border border-line bg-gap-soft px-4 py-2.5 text-sm text-gap-ink">
              {msg}
              {pasteUrl && (
                <span className="mt-1 flex items-center gap-3 text-muted">
                  <span className="min-w-0 truncate">link kept: {pasteUrl}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPasteUrl(null);
                      setMsg(null);
                    }}
                    className="min-h-11 shrink-0 underline sm:min-h-8"
                  >
                    start over
                  </button>
                </span>
              )}
            </p>
          )}
        </div>

        {card && <JobCard card={card} onRetry={retryBots} />}

        {isNew ? (
          <EmptyState
            outfit="coffee"
            title="nothing here yet."
            text="paste a job link above and pip will read it, check your resume against it and draft the rest."
            action={
              <button type="button" onClick={() => inputRef.current?.focus()} className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-ink-foreground">
                paste your first job
              </button>
            }
          />
        ) : (
          <>
            <NeedsYou needsYou={d.needsYou} followUps={followUps} />
            <Applications applications={apps} />
            <WeekTasks tasks={tasks} />
            <Targets targets={targets} total={extras.totalTargets} onAdd={addTarget} />
            <BotRow bots={d.bots} applications={apps} />
          </>
        )}
      </div>

      <ChatSlideOver
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        initialMessage={pendingMessage}
        onInitialMessageSent={() => setPendingMessage(null)}
      />
    </Shell>
  );
}
