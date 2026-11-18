"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Mic, Square, Timer, Target, ArrowRight, AlertCircle } from "lucide-react";
import { generateOpenQuestions, scoreOpenAnswer, getOpenSession } from "@/actions/Practice";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { OPEN_QUESTION_COUNT, ANSWER_MAX_CHARS, ANSWER_MIN_CHARS } from "@/lib/interview/rubric";
import { generationErrorMessage } from "@/components/shared/generationError";
import SourceChips from "@/components/shared/SourceChips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RubricCard from "./_components/RubricCard";

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Counts down from limitSec. At zero it only shows "time's up"; it never submits anything.
function QuestionTimer({ limitSec, running }) {
  const [left, setLeft] = useState(limitSec);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);
  const over = left === 0;
  return (
    <div
      role="timer"
      className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
        over ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      <Timer className="w-3.5 h-3.5" />
      {over ? "Time's up. You can still finish your answer." : fmt(left)}
    </div>
  );
}

function PracticeInner() {
  const router = useRouter();
  const sessionParam = useSearchParams().get("session");
  const [loadingSession, setLoadingSession] = useState(!!sessionParam);
  const [loadError, setLoadError] = useState(null); // { notFound, message }
  const [jd, setJd] = useState("");
  const [count, setCount] = useState(OPEN_QUESTION_COUNT.default);
  const [generating, setGenerating] = useState(false);
  const [setupError, setSetupError] = useState(null);

  const [session, setSession] = useState(null); // { sessionId, questions }
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState({}); // index -> scored result
  const [submitError, setSubmitError] = useState(null);
  const [scoringPending, setScoringPending] = useState(false);
  const retryRef = useRef(null);
  const handleSubmitRef = useRef(null);

  // Voice: transcript is appended to whatever was typed before recording started; the textarea stays editable.
  const baseRef = useRef("");
  const typedRef = useRef(false);
  const onTranscript = useCallback((t) => {
    if (typedRef.current) return; // user typed after stopping: late results must not overwrite
    const base = baseRef.current;
    setText((base ? base + " " : "") + t);
  }, []);
  const { isRecording, toggleRecording, isSupported } = useSpeechToText(onTranscript);
  const handleVoice = () => {
    if (!isRecording) {
      baseRef.current = text.trim();
      typedRef.current = false;
    }
    toggleRecording();
  };

  // ?session=<id>: resume a prepared session at the first unscored question.
  useEffect(() => {
    if (!sessionParam) return;
    let cancelled = false;
    (async () => {
      setLoadingSession(true);
      setLoadError(null);
      try {
        const res = await getOpenSession(sessionParam);
        if (cancelled) return;
        if (res?.error || !res?.questions?.length) {
          const nf = res?.code === "NOT_FOUND" || res?.code === "INVALID";
          setLoadError({ notFound: nf, message: nf ? null : generationErrorMessage(res, "Couldn't load this session.") });
          return;
        }
        const done = {};
        res.questions.forEach((qq, i) => {
          if (qq.answer) done[i] = qq.answer;
        });
        const first = res.questions.findIndex((qq) => !qq.answer);
        setSession({ sessionId: res.sessionId, questions: res.questions });
        setResults(done);
        setIdx(first === -1 ? res.questions.length - 1 : first);
        setText("");
      } catch (e) {
        if (!cancelled) setLoadError({ notFound: false, message: e?.message || "Couldn't load this session." });
      } finally {
        if (!cancelled) setLoadingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionParam]);

  const handleStart = async () => {
    setSetupError(null);
    setGenerating(true);
    try {
      const n = Math.min(OPEN_QUESTION_COUNT.max, Math.max(OPEN_QUESTION_COUNT.min, Number(count) || OPEN_QUESTION_COUNT.default));
      const res = await generateOpenQuestions({ count: n, jobDescription: jd.trim() || null });
      if (res?.error || !res?.questions?.length) {
        setSetupError(generationErrorMessage(res, "Couldn't create questions."));
        return;
      }
      setSession(res);
      setIdx(0);
      setText("");
      setResults({});
    } catch (e) {
      setSetupError(e?.message || "Couldn't create questions.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (auto = 0) => {
    if (isRecording) toggleRecording();
    setSubmitError(null);
    setScoringPending(false);
    setSubmitting(true);
    try {
      const res = await scoreOpenAnswer(session.sessionId, session.questions[idx].index, text.trim());
      if (res?.code === "SCORING_IN_PROGRESS") {
        setSubmitError(generationErrorMessage(res));
        setScoringPending(true);
        // Retry automatically at most twice; after that the user taps "Check again".
        if (auto < 2) {
          clearTimeout(retryRef.current);
          retryRef.current = setTimeout(() => handleSubmitRef.current(auto + 1), 4000);
        }
        return;
      }
      if (res?.code === "ALREADY_SCORED" && res.rubric) {
        toast.info(generationErrorMessage(res));
        setResults((r) => ({ ...r, [idx]: res }));
      } else if (res?.error || !res?.rubric) {
        setSubmitError(generationErrorMessage(res, "Couldn't score this answer."));
      } else {
        setResults((r) => ({ ...r, [idx]: res }));
      }
    } catch (e) {
      setSubmitError(e?.message || "Couldn't score this answer.");
    } finally {
      setSubmitting(false);
    }
  };

  handleSubmitRef.current = handleSubmit;
  useEffect(() => () => clearTimeout(retryRef.current), []);

  const goNext = () => {
    clearTimeout(retryRef.current);
    setScoringPending(false);
    setIdx((i) => i + 1);
    setText("");
    setSubmitError(null);
  };

  const finish = () => router.push(`/interview/practice/${session.sessionId}`);

  const q = session?.questions?.[idx];
  const result = results[idx];
  const isLast = session && idx >= session.questions.length - 1;

  return (
    <div className="min-h-screen bg-transparent py-12 px-6 md:px-12">
      <div className="max-w-3xl mx-auto relative z-10">
        <Link href="/interview">
          <Button variant="ghost" className="mb-8 text-muted-foreground hover:text-foreground gap-3 px-0">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Back to Hub</span>
          </Button>
        </Link>

        <h1 className="text-3xl md:text-5xl font-clash font-bold uppercase tracking-tight text-foreground mb-3">
          Open <span className="text-accent">Practice</span>
        </h1>
        <p className="text-sm text-muted-foreground font-light mb-10">
          Answer in your own words, typed or spoken. Scores are an AI estimate, and every quote comes from your answer.
        </p>

        {sessionParam && loadingSession && (
          <div role="status" className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your practice session...
          </div>
        )}

        {sessionParam && loadError && (
          <div role="alert" className="border border-border bg-background rounded-sm p-8 space-y-4">
            <p className="flex gap-2 text-sm text-foreground">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
              {loadError.notFound ? "We couldn't find that practice session. It may have been removed." : loadError.message}
            </p>
            <Link href="/interview/practice">
              <Button variant="outline" className="h-11">
                Start a new practice
              </Button>
            </Link>
          </div>
        )}

        {!session && !sessionParam && (
          <div className="border border-border bg-background rounded-sm p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <label htmlFor="jd" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Job description (optional)
              </label>
              <Textarea
                id="jd"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                maxLength={20000}
                rows={6}
                placeholder="Paste a job description to get questions about that role. Leave empty to use your profile skills."
                disabled={generating}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="count" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Number of questions ({OPEN_QUESTION_COUNT.min}-{OPEN_QUESTION_COUNT.max})
              </label>
              <Input
                id="count"
                type="number"
                min={OPEN_QUESTION_COUNT.min}
                max={OPEN_QUESTION_COUNT.max}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-28"
                disabled={generating}
              />
            </div>
            {setupError && (
              <p role="alert" className="flex gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {setupError}
              </p>
            )}
            <Button onClick={handleStart} disabled={generating} className="h-12 px-8">
              {generating ? (
                <>
                  <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  Creating questions...
                </>
              ) : (
                <>
                  <Target className="mr-3 h-4 w-4" />
                  Start practice
                </>
              )}
            </Button>
          </div>
        )}

        {session && q && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">
                Question {idx + 1} of {session.questions.length} // {q.topic}
              </span>
              <QuestionTimer key={idx} limitSec={q.timeLimitSec} running={!result} />
            </div>

            <div className="border border-border bg-background rounded-sm p-6 shadow-sm space-y-4">
              <h2 className="text-lg md:text-xl font-medium text-foreground">{q.question}</h2>
              <SourceChips sources={q.sources} heading="Based on" />
            </div>

            {!result ? (
              <div className="space-y-4">
                <Textarea
                  value={text}
                  onChange={(e) => {
                    if (isRecording) {
                      typedRef.current = true;
                      toggleRecording();
                    }
                    setText(e.target.value);
                  }}
                  maxLength={ANSWER_MAX_CHARS}
                  rows={8}
                  placeholder="Type your answer, or use the microphone and edit the transcript."
                  disabled={submitting}
                  aria-label="Your answer"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isSupported ? (
                      <Button type="button" variant="outline" onClick={handleVoice} disabled={submitting} className="h-11">
                        {isRecording ? <Square className="w-4 h-4 mr-2 text-destructive" /> : <Mic className="w-4 h-4 mr-2 text-accent" />}
                        {isRecording ? "Stop" : "Speak"}
                      </Button>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Voice input isn&apos;t supported in this browser
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {text.length}/{ANSWER_MAX_CHARS}
                    </span>
                    {text.trim().length < ANSWER_MIN_CHARS && (
                      <span className="text-[10px] text-muted-foreground">
                        {ANSWER_MIN_CHARS - text.trim().length} more characters
                      </span>
                    )}
                  </div>
                  <Button onClick={() => handleSubmit(0)} disabled={submitting || text.trim().length < ANSWER_MIN_CHARS} className="h-11 px-8">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                        Scoring...
                      </>
                    ) : scoringPending ? (
                      "Check again"
                    ) : (
                      "Submit answer"
                    )}
                  </Button>
                </div>
                {submitError && (
                  <p role="alert" className={`flex gap-2 text-sm ${scoringPending ? "text-muted-foreground" : "text-destructive"}`}>
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {submitError}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <RubricCard answerText={result.answerText} rubric={result.rubric} overall={result.overall} />
                <div className="flex justify-end">
                  {isLast ? (
                    <Button onClick={finish} className="h-11 px-8">
                      Finish and review
                    </Button>
                  ) : (
                    <Button onClick={goNext} className="h-11 px-8">
                      Next question
                      <ArrowRight className="w-4 h-4 ml-3" />
                    </Button>
                  )}
                </div>
                {!isLast && (
                  <div className="text-right">
                    <button onClick={finish} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground underline">
                      Finish now
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <PracticeInner />
    </Suspense>
  );
}
