"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Mic, Square } from "lucide-react";
import { OPEN_QUESTION_COUNT, ANSWER_MAX_CHARS, ANSWER_MIN_CHARS } from "@/lib/interview/rubric";
import { generationErrorMessage } from "@/components/shared/generationError";
import { useVoiceAnswer } from "@/hooks/use-voice-answer";
import AppWindow from "@/components/ui/AppWindow";
import PipAvatar from "@/components/ui/PipAvatar";
import PipStatus from "@/components/ui/PipStatus";
import PixelScene from "@/components/ui/PixelScene";
import Skeleton from "@/components/ui/Skeleton";
import StepCaption from "@/components/ui/StepCaption";
import Wave from "./Wave";
import RubricDots from "./RubricDots";

const fmt = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
const COUNTS = [3, 5, 7, 10];

function sourceInfo(sources) {
  const s = sources?.[0];
  const id = s?.id || "";
  if (id.startsWith("proj:") || s?.kind === "project") return { kind: "from your own project", chip: s?.label || "project" };
  if (s?.kind === "jd" || id.startsWith("jd:")) return { kind: "from the job post", chip: (s?.excerpt || s?.label || "job line").slice(0, 70) };
  if (s) return { kind: "from your skills", chip: s.label || "skills" };
  return { kind: "", chip: "" };
}

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => setR(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches), []);
  return r;
}

function WeakCard({ weak, skill, onSave }) {
  if (weak.status === "idle")
    return (
      <div className="rounded-[18px] bg-soft p-4 text-sm">
        <p className="font-doc text-text">weak spot: {skill}</p>
        <button type="button" onClick={onSave} className="mt-2 min-h-11 rounded-full bg-ink px-5 text-sm text-ink-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand md:min-h-9">
          add to monday&apos;s plan
        </button>
      </div>
    );
  return (
    <div role="status" aria-live="polite" className={`fade-up rounded-[18px] p-4 text-sm ${weak.status === "error" ? "bg-gap-soft text-gap-ink" : "bg-soft"}`}>
      {weak.status === "error" ? (
        <>
          <p>couldn&apos;t save that.</p>
          <button type="button" onClick={onSave} className="mt-2 min-h-11 underline md:min-h-9">retry</button>
        </>
      ) : (
        <>
          <p className="font-doc text-text">weak spot saved</p>
          <p className="font-doc text-muted">{skill} → {weak.existing ? "already in" : "added to"} monday&apos;s plan</p>
        </>
      )}
    </div>
  );
}

/**
 * Open practice. `actions` = { generateOpenQuestions, scoreOpenAnswer, getOpenSession, saveWeakSpot } (injected so
 * the dev page can mock them). `sessionId` resumes a prepared session; `invite` shows the invite toast.
 */
export default function PracticeScreen({ actions, sessionId, applicationId, invite = false, onFinish }) {
  const reduced = useReducedMotion();
  const [loading, setLoading] = useState(!!sessionId);
  const [loadError, setLoadError] = useState(null);
  const [jd, setJd] = useState("");
  const [showJd, setShowJd] = useState(false);
  const [count, setCount] = useState(OPEN_QUESTION_COUNT.default);
  const [generating, setGenerating] = useState(false);
  const [setupError, setSetupError] = useState(null);

  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [scoringPending, setScoringPending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [frozen, setFrozen] = useState({});
  const [weak, setWeak] = useState({});
  const [toastOpen, setToastOpen] = useState(invite);
  const retryRef = useRef(null);
  const submitRef = useRef(null);
  const baseRef = useRef("");

  const onTranscript = useCallback((t) => {
    const b = baseRef.current;
    setText((b ? b + " " : "") + t);
  }, []);
  const voice = useVoiceAnswer(onTranscript);

  useEffect(() => {
    if (!invite) return;
    const t = setTimeout(() => setToastOpen(false), 7000);
    return () => clearTimeout(t);
  }, [invite]);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await actions.getOpenSession(sessionId);
      if (res?.error || !res?.questions?.length) {
        const nf = res?.code === "NOT_FOUND" || res?.code === "INVALID";
        setLoadError(nf ? "we couldn't find that practice session. it may have been removed." : generationErrorMessage(res, "couldn't load this session."));
        return;
      }
      const done = {};
      res.questions.forEach((qq, i) => qq.answer && (done[i] = qq.answer));
      const first = res.questions.findIndex((qq) => !qq.answer);
      setSession({ sessionId: res.sessionId, questions: res.questions });
      setResults(done);
      setIdx(first === -1 ? res.questions.length - 1 : first);
    } catch (e) {
      setLoadError(e?.message || "couldn't load this session.");
    } finally {
      setLoading(false);
    }
  }, [actions, sessionId]);

  useEffect(() => {
    if (sessionId) loadSession();
  }, [sessionId, loadSession]);

  // Elapsed timer for the current question; stops once it is scored. It never submits anything.
  const q = session?.questions?.[idx];
  const result = results[idx];
  useEffect(() => {
    if (!q || result) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [idx, q, result]);

  const handleStart = async () => {
    setSetupError(null);
    setGenerating(true);
    try {
      const res = await actions.generateOpenQuestions({ count, jobDescription: jd.trim() || null });
      if (res?.error || !res?.questions?.length) {
        setSetupError(generationErrorMessage(res, "couldn't create questions."));
        return;
      }
      setSession(res);
      setIdx(0);
      setText("");
      setResults({});
    } catch (e) {
      setSetupError(e?.message || "couldn't create questions.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (auto = 0) => {
    voice.stop();
    setSubmitError(null);
    setScoringPending(false);
    setSubmitting(true);
    try {
      const res = await actions.scoreOpenAnswer(session.sessionId, q.index, text.trim());
      if (res?.code === "SCORING_IN_PROGRESS") {
        setSubmitError(generationErrorMessage(res));
        setScoringPending(true);
        if (auto < 2) {
          clearTimeout(retryRef.current);
          retryRef.current = setTimeout(() => submitRef.current(auto + 1), 4000);
        }
        return;
      }
      if ((res?.code === "ALREADY_SCORED" && res.rubric) || (!res?.error && res?.rubric)) {
        setFrozen((f) => ({ ...f, [idx]: elapsed }));
        setResults((r) => ({ ...r, [idx]: res }));
      } else setSubmitError(generationErrorMessage(res, "couldn't score this answer."));
    } catch (e) {
      setSubmitError(e?.message || "couldn't score this answer.");
    } finally {
      setSubmitting(false);
    }
  };
  submitRef.current = handleSubmit;
  useEffect(() => () => clearTimeout(retryRef.current), []);

  const goNext = () => {
    clearTimeout(retryRef.current);
    voice.stop();
    setScoringPending(false);
    setIdx((i) => i + 1);
    setText("");
    setSubmitError(null);
  };
  const finish = () => onFinish?.(session.sessionId);

  const toggleVoice = () => {
    if (voice.isRecording) return voice.stop();
    baseRef.current = text.trim();
    voice.start();
  };

  const saveWeak = async () => {
    const skill = String(q.topic || "interview answer").slice(0, 80);
    setWeak((w) => ({ ...w, [idx]: { status: "saved" } })); // optimistic
    const low = [...(result.rubric?.criteria || [])].sort((a, b) => a.score - b.score)[0];
    let tz;
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {}
    try {
      const res = await actions.saveWeakSpot({ applicationId: applicationId || undefined, skill, note: low?.feedback?.slice(0, 500) || undefined, timeZone: tz });
      if (res?.error) setWeak((w) => ({ ...w, [idx]: { status: "error" } }));
      else if (res?.created === false) setWeak((w) => ({ ...w, [idx]: { status: "saved", existing: true } }));
    } catch {
      setWeak((w) => ({ ...w, [idx]: { status: "error" } }));
    }
  };

  const isLast = session && idx >= session.questions.length - 1;
  const info = sourceInfo(q?.sources);
  const isWeak = result && (result.overall < 70 || Math.min(...(result.rubric?.criteria || []).map((c) => c.score)) <= 5);
  const wk = weak[idx] || { status: "idle" };
  const shownTime = result ? frozen[idx] ?? 0 : elapsed;
  const over = q && !result && elapsed >= q.timeLimitSec;
  const recording = voice.isRecording;

  return (
    <div className="relative min-h-full">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <PixelScene variant="peaks" seed={606} />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-4 px-3 pb-10 pt-4 sm:px-8 sm:pt-8">
        <h1 className="sr-only">interview practice</h1>
        <StepCaption n={6}>practise for that exact interview.</StepCaption>
        <div className="relative flex flex-col gap-3">
          {toastOpen && (
            <div role="status" className="fade-up z-20 flex w-fit max-w-full items-center gap-3 rounded-[14px] bg-ink py-2.5 pl-3 pr-5 font-doc text-sm text-ink-foreground shadow-soft sm:absolute sm:left-1/2 sm:top-3.5 sm:-translate-x-1/2">
              <PipAvatar outfit="headphones" size="sm" alt="" />
              <span>interview invite detected · prep pack ready</span>
            </div>
          )}
          <AppWindow title="ascendai · interview prep" bodyClassName="p-4 sm:p-10 min-h-[420px]">
            {loading && (
              <div className="space-y-4" aria-busy="true">
                <PipStatus outfit="headphones" text="loading your prep pack..." />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-16 w-full max-w-xl" />
              </div>
            )}

            {!loading && loadError && (
              <div role="alert" className="space-y-4">
                <p className="flex gap-2 text-sm text-text">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-gap-ink" />
                  {loadError}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={loadSession} className="min-h-11 rounded-full bg-ink px-5 text-sm text-ink-foreground">try again</button>
                  <Link href="/interview/practice" className="inline-flex min-h-11 items-center rounded-full bg-soft px-5 text-sm text-text">start a new practice</Link>
                </div>
              </div>
            )}

            {!loading && !loadError && !session && (
              <div className="grid gap-6 md:grid-cols-[1fr_180px]">
                <div className="space-y-5">
                  <p className="font-doc text-sm text-faint">open practice · typed or spoken</p>
                  <h2 className="font-doc text-2xl leading-snug text-text sm:text-[28px]">pip asks questions from the job and your own projects.</h2>
                  <fieldset className="space-y-2" disabled={generating}>
                    <legend className="text-sm text-muted">how many questions</legend>
                    <div className="flex flex-wrap gap-2">
                      {COUNTS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          aria-pressed={count === n}
                          onClick={() => setCount(n)}
                          className={`min-h-11 min-w-11 rounded-full px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand ${count === n ? "bg-ink text-ink-foreground" : "bg-soft text-text"}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  {showJd ? (
                    <div className="space-y-1.5">
                      <label htmlFor="jd" className="text-sm text-muted">job post (optional)</label>
                      <textarea
                        id="jd"
                        value={jd}
                        onChange={(e) => setJd(e.target.value)}
                        maxLength={20000}
                        rows={5}
                        disabled={generating}
                        placeholder="paste a job description for that role. leave empty to use your saved jobs and profile."
                        className="w-full rounded-[14px] border border-line bg-bg p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      />
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowJd(true)} className="min-h-11 text-sm text-muted underline">paste a job post instead</button>
                  )}
                  {setupError && (
                    <p role="alert" className="flex gap-2 text-sm text-gap-ink">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      {setupError}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4">
                    <button type="button" onClick={handleStart} disabled={generating} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-ink-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60">
                      {generating ? "writing questions..." : "start practice"}
                    </button>
                    <Link href="/interview/mock" className="inline-flex min-h-11 items-center text-sm text-muted underline">mock interview</Link>
                    <Link href="/interview" className="inline-flex min-h-11 items-center text-sm text-muted underline">history and weak areas</Link>
                  </div>
                  {generating && <PipStatus outfit="headphones" text="pip is reading the job and your projects..." />}
                </div>
                <div className="hidden justify-center md:flex">
                  <PipAvatar outfit="headphones" size={150} alt="" />
                </div>
              </div>
            )}

            {!loading && !loadError && session && q && (
              <div className="grid gap-x-8 gap-y-6 md:grid-cols-[1fr_240px]">
                <div className="min-w-0 space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="font-doc text-sm text-faint">
                        question {idx + 1} of {session.questions.length}
                        {info.kind && ` · ${info.kind}`}
                      </p>
                      {info.chip && (
                        <span title={q.sources?.[0]?.excerpt || info.chip} className="inline-block max-w-full truncate rounded-full bg-brand-soft px-3 py-1 text-xs text-brand-ink">
                          {info.chip}
                        </span>
                      )}
                    </div>
                    <span className="md:hidden"><PipAvatar outfit="headphones" size={56} alt="" /></span>
                  </div>
                  <h2 className="font-doc text-2xl leading-snug text-text sm:text-[28px]">{q.question}</h2>

                  <div className="flex items-center gap-3 sm:gap-4">
                    {!result && voice.supported && (
                      <button
                        type="button"
                        onClick={toggleVoice}
                        disabled={submitting}
                        aria-pressed={recording}
                        aria-label={recording ? "stop recording" : "start recording"}
                        className={`grid size-12 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${recording ? "bg-ink text-ink-foreground" : "bg-brand text-white"}`}
                      >
                        {recording ? <Square className="size-4" fill="currentColor" /> : <Mic className="size-5" />}
                      </button>
                    )}
                    <Wave recording={recording} levels={voice.levels} reduced={reduced} className="min-w-0 flex-1" />
                    <span role="timer" aria-label="time on this question" className="w-14 shrink-0 text-right font-doc text-2xl text-text sm:w-16 sm:text-3xl">{fmt(shownTime)}</span>
                  </div>
                  <p aria-live="polite" className="sr-only">{recording ? "recording" : ""}</p>
                  {!result && voice.supported === false && <p className="text-xs text-faint">voice isn&apos;t available in this browser. type your answer.</p>}
                  {voice.message && <p role="alert" className="text-xs text-gap-ink">{voice.message}</p>}
                  {over && <p className="text-xs text-faint">past the suggested {fmt(q.timeLimitSec)}. finish your answer when you&apos;re ready.</p>}

                  {!result ? (
                    <div className="space-y-3">
                      {recording ? (
                        <div role="log" aria-live="polite" aria-label="live transcript" className="min-h-24 rounded-[14px] bg-soft p-3 font-doc text-base text-text">
                          {text || <span className="text-faint">listening...</span>}
                        </div>
                      ) : (
                        <textarea
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          maxLength={ANSWER_MAX_CHARS}
                          rows={6}
                          disabled={submitting}
                          aria-label="your answer"
                          placeholder={voice.supported ? "type your answer, or tap the mic and talk." : "type your answer."}
                          className="w-full rounded-[14px] border border-line bg-bg p-3 font-doc text-base outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        />
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-faint">
                          {text.trim().length < ANSWER_MIN_CHARS ? `${ANSWER_MIN_CHARS - text.trim().length} more characters` : `${text.length}/${ANSWER_MAX_CHARS}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSubmit(0)}
                          disabled={submitting || text.trim().length < ANSWER_MIN_CHARS}
                          className="min-h-11 rounded-full bg-ink px-7 text-sm font-medium text-ink-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
                        >
                          {submitting ? "scoring..." : scoringPending ? "check again" : "submit answer"}
                        </button>
                      </div>
                      {submitting && <PipStatus outfit="thinking" text="pip is reading your answer..." />}
                      {submitError && (
                        <p role="alert" className={`flex gap-2 text-sm ${scoringPending ? "text-muted" : "text-gap-ink"}`}>
                          <AlertCircle className="mt-0.5 size-4 shrink-0" />
                          {submitError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <RubricDots rubric={result.rubric} overall={result.overall} />
                      <div className="md:hidden">
                        {isWeak ? <WeakCard weak={wk} skill={q.topic} onSave={saveWeak} /> : null}
                      </div>
                      {!isWeak && wk.status === "idle" && (
                        <button type="button" onClick={saveWeak} className="min-h-11 text-sm text-muted underline">save as a weak spot anyway</button>
                      )}
                      {!isWeak && wk.status !== "idle" && <WeakCard weak={wk} skill={q.topic} onSave={saveWeak} />}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {!isLast ? (
                          <button type="button" onClick={finish} className="min-h-11 text-sm text-muted underline">finish now</button>
                        ) : <span />}
                        {isLast ? (
                          <button type="button" onClick={finish} className="min-h-11 rounded-full bg-ink px-7 text-sm font-medium text-ink-foreground">finish and review</button>
                        ) : (
                          <button type="button" onClick={goNext} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-7 text-sm font-medium text-ink-foreground">
                            next question <ArrowRight className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="hidden space-y-5 md:block">
                  <div className="flex justify-center"><PipAvatar outfit="headphones" size={150} alt="" /></div>
                  {result && isWeak && <WeakCard weak={wk} skill={q.topic} onSave={saveWeak} />}
                </div>
              </div>
            )}
          </AppWindow>
        </div>
      </div>
    </div>
  );
}
