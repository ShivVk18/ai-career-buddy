"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import PipStatus from "@/components/pixel/PipStatus";
import { MOCK_JOBS, MOCK_INTERVIEW_QUESTIONS } from "@/lib/mock";
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export default function InterviewToolPage() {
  const [selectedJobId, setSelectedJobId] = useState("job-swiggy");
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [inputMode, setInputMode] = useState("type"); // "type" | "record"
  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);
  const [submittedScore, setSubmittedScore] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const currentQ = MOCK_INTERVIEW_QUESTIONS[activeQuestionIdx] || MOCK_INTERVIEW_QUESTIONS[0];
  const selectedJob = MOCK_JOBS.find((j) => j.id === selectedJobId) || MOCK_JOBS[0];

  // Timer countdown
  useEffect(() => {
    let interval = null;
    if (timerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, secondsLeft]);

  const startTimer = () => {
    setSecondsLeft(currentQ.timeLimit);
    setTimerRunning(true);
  };

  const handleRecordToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimerRunning(true);
      setUserAnswer("In Next.js 15 App Router, React Server Components never send their JavaScript dependencies down to the client bundle. They execute strictly on the server and stream serialized React flight data into the HTML payload. Client components, marked with 'use client', are hydrated on the browser for interactivity…");
      toast.success("recording voice answer…");
    } else {
      setIsRecording(false);
      setTimerRunning(false);
      toast.success("voice captured");
    }
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) {
      toast.error("please provide an answer before scoring");
      return;
    }

    setIsEvaluating(true);
    setTimerRunning(false);

    setTimeout(() => {
      setIsEvaluating(false);
      setSubmittedScore({
        clarity: 92,
        technicalDepth: 94,
        practicalEvidence: 88,
        overall: 91,
        quote: "Directly cited zero-client-bundle RSC footprint and flight data protocol streaming.",
        improvement: "Could strengthen by mentioning partial prerendering (PPR) cache boundaries.",
      });
      toast.success("pip finished rubric evaluation");
    }, 1200);
  };

  const handleNextQuestion = () => {
    if (activeQuestionIdx < MOCK_INTERVIEW_QUESTIONS.length - 1) {
      setActiveQuestionIdx((prev) => prev + 1);
      setUserAnswer("");
      setSubmittedScore(null);
      setSecondsLeft(120);
      setTimerRunning(false);
    } else {
      toast.success("all interview questions completed!");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-0.5 rounded-full font-medium">
              tool 02 • interview coach
            </span>
            <span className="text-xs text-muted">/tools/interview</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text lowercase">
            mock interview simulation (one question at a time)
          </h1>
        </div>

        {/* Job selector */}
        <div className="flex items-center gap-2 bg-[#FBFAF7] border border-[#ECEAE4] px-3.5 py-1.5 rounded-full text-xs max-w-full min-w-0">
          <span className="font-pixel text-[11px] text-muted shrink-0">interviewing for:</span>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-transparent font-medium text-text outline-none cursor-pointer max-w-[170px] sm:max-w-xs truncate"
          >
            {MOCK_JOBS.map((j) => (
              <option key={j.id} value={j.id}>
                {j.company} — {j.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Center: Work Area (Active Question + Recording/Typing + Rubric Score) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Question Card */}
          <div className="panel-cozy p-6 sm:p-8 bg-white border border-[#ECEAE4] space-y-6">
            <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3">
              <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-0.5 rounded-full">
                question {activeQuestionIdx + 1} of {MOCK_INTERVIEW_QUESTIONS.length} • {currentQ.category}
              </span>

              {/* Timer */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted" />
                <span className={`font-pixel text-sm font-bold ${secondsLeft < 30 ? "text-[#A45564]" : "text-text"}`}>
                  {Math.floor(secondsLeft / 60)}:{secondsLeft % 60 < 10 ? "0" : ""}{secondsLeft % 60}
                </span>
                {!timerRunning && (
                  <button
                    onClick={startTimer}
                    className="font-pixel text-[10px] text-pip hover:underline ml-1"
                  >
                    start timer
                  </button>
                )}
              </div>
            </div>

            {/* The Question Text */}
            <h2 className="font-serif text-lg sm:text-xl font-medium text-text leading-relaxed">
              "{currentQ.question}"
            </h2>

            {/* Answer Mode Toggle */}
            <div className="flex items-center justify-between border-t border-[#ECEAE4] pt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInputMode("type")}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                    inputMode === "type"
                      ? "bg-text text-white"
                      : "bg-[#FBFAF7] text-muted hover:text-text"
                  }`}
                >
                  type answer
                </button>
                <button
                  onClick={() => setInputMode("record")}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${
                    inputMode === "record"
                      ? "bg-text text-white"
                      : "bg-[#FBFAF7] text-muted hover:text-text"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" /> voice record
                </button>
              </div>

              {inputMode === "record" && (
                <button
                  onClick={handleRecordToggle}
                  className={`btn-pill-primary text-xs py-1.5 px-3.5 gap-1.5 ${
                    isRecording ? "bg-[#A45564] hover:bg-[#8F4453]" : ""
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" /> stop recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" /> start voice capture
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Input / Transcript Area */}
            <div>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                rows={5}
                placeholder={
                  inputMode === "type"
                    ? "type your detailed response here, explaining architectural decisions and real-world trade-offs…"
                    : "click 'start voice capture' to record spoken response…"
                }
                className="w-full p-4 rounded-xl border border-[#ECEAE4] bg-[#FBFAF7] text-xs sm:text-sm font-sans text-text placeholder:text-[#A8A6AE] outline-none focus:border-pip focus:bg-white resize-none transition"
              />
            </div>

            {/* Submit & Next Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="font-pixel text-[11px] text-muted">
                rubric evaluates: clarity (30%), depth (40%), evidence (30%)
              </span>
              <button
                onClick={handleSubmitAnswer}
                disabled={isEvaluating || !userAnswer.trim()}
                className="btn-pill-pip text-xs py-2 px-5 gap-1.5 disabled:opacity-40"
              >
                {isEvaluating ? (
                  <span>pip is scoring…</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> submit for scoring
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Rubric Score Breakdown Card (Shown upon submission) */}
          {submittedScore && (
            <div className="panel-cozy p-6 bg-white border border-pip/40 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3">
                <div>
                  <span className="font-pixel text-[11px] text-pip uppercase block">
                    pip rubric evaluation
                  </span>
                  <span className="font-sans text-sm font-bold text-text">
                    performance breakdown: {submittedScore.overall}/100
                  </span>
                </div>
                <button
                  onClick={handleNextQuestion}
                  className="btn-pill-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
                >
                  <span>next question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rubric Bars */}
              <div className="grid grid-cols-3 gap-3 font-sans text-xs">
                <div className="p-3 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4]">
                  <span className="text-muted block text-[11px]">clarity</span>
                  <span className="font-pixel text-base font-bold text-text">
                    {submittedScore.clarity}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4]">
                  <span className="text-muted block text-[11px]">tech depth</span>
                  <span className="font-pixel text-base font-bold text-pip">
                    {submittedScore.technicalDepth}%
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4]">
                  <span className="text-muted block text-[11px]">evidence</span>
                  <span className="font-pixel text-base font-bold text-text">
                    {submittedScore.practicalEvidence}%
                  </span>
                </div>
              </div>

              {/* Quoted Evidence from Candidate Answer */}
              <div className="p-3.5 rounded-lg bg-pip-soft/40 border border-pip/30 text-xs text-[#1E7356]">
                <span className="font-semibold block mb-0.5">quoted strength:</span>
                "{submittedScore.quote}"
              </div>

              <div className="p-3.5 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4] text-xs text-muted">
                <span className="font-semibold text-text block mb-0.5">tip for next round:</span>
                {submittedScore.improvement}
              </div>
            </div>
          )}

          {/* Link to 10-Question Comprehensive Quiz */}
          <div className="panel-cozy p-4 bg-[#FBFAF7] border border-[#ECEAE4] flex items-center justify-between text-xs">
            <span className="text-muted">
              prefer timed 10-question technical multiple-choice assessments?
            </span>
            <Link
              href="/interview/mock"
              className="text-pip hover:underline flex items-center gap-1 font-medium"
            >
              start full 10-mcq quiz <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Pip's Notes + Question List + Weak Areas */}
        <div className="lg:col-span-4 space-y-5">
          <PipStatus
            step="headphones"
            text="pip is listening for quantifiable impact and architecture trade-offs"
            size="md"
            className="w-full"
          />

          {/* Question List */}
          <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4]">
            <span className="font-pixel text-xs text-muted uppercase block mb-3 border-b border-[#ECEAE4] pb-2">
              interview questions ({selectedJob.company})
            </span>
            <div className="space-y-2">
              {MOCK_INTERVIEW_QUESTIONS.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    setActiveQuestionIdx(idx);
                    setSubmittedScore(null);
                    setUserAnswer("");
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition ${
                    activeQuestionIdx === idx
                      ? "bg-pip-soft/40 border-pip font-medium text-text"
                      : "bg-[#FBFAF7] border-[#ECEAE4] text-muted hover:text-text"
                  }`}
                >
                  <span className="font-pixel text-[10px] text-pip-ink block">
                    Q{idx + 1} • {q.category}
                  </span>
                  <p className="line-clamp-2 mt-0.5">{q.question}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Weak Areas Flagged */}
          <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4]">
            <span className="font-pixel text-xs text-[#A45564] uppercase block mb-3 border-b border-[#ECEAE4] pb-2">
              weak areas flagged from practice
            </span>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#FFF9F9] border border-[#FBD5D5]">
                <span className="font-semibold text-text block">Next.js Cache Invalidation</span>
                <p className="text-[11px] text-muted mt-0.5">
                  Hesitated when asked about unstable_cache vs React cache() request memoization.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FFF9F9] border border-[#FBD5D5]">
                <span className="font-semibold text-text block">Idempotent Keys</span>
                <p className="text-[11px] text-muted mt-0.5">
                  Remember to specify UUID generation on client and database constraints on server.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
