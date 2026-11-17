"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Play, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ToolResultCard({ type, data }) {
  if (!data) return null;

  // 1. Resume Edit Result Card
  if (type === "resume_edit") {
    return <ResumeEditCard data={data} />;
  }

  // 2. ATS Score Card with Fix buttons
  if (type === "ats_score") {
    return <ATSScoreCard data={data} />;
  }

  // 3. Interview Question Card with Start
  if (type === "interview_question") {
    return <InterviewCard data={data} />;
  }

  // 4. Roadmap Task Card
  if (type === "roadmap_task") {
    return <RoadmapCard data={data} />;
  }

  return null;
}

function ResumeEditCard({ data }) {
  const [bullets, setBullets] = useState(data.bullets || []);

  const toggleAccept = (id) => {
    setBullets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, accepted: !b.accepted } : b))
    );
    toast.success("resume updated");
  };

  const acceptAll = () => {
    setBullets((prev) => prev.map((b) => ({ ...b, accepted: true })));
    toast.success("all edits applied to resume");
  };

  return (
    <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4] my-2 text-left w-full max-w-xl">
      <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[11px] bg-pip-soft text-pip-ink px-2.5 py-0.5 rounded-full font-medium">
            resume edit • {data.company} ({data.matchRate}% match)
          </span>
        </div>
        <button
          onClick={acceptAll}
          className="btn-pill-pip text-[11px] py-1 px-3 gap-1"
        >
          <Check className="w-3 h-3" /> accept all
        </button>
      </div>

      <div className="space-y-3 font-doc text-[13px] leading-relaxed">
        {bullets.map((b) => (
          <div key={b.id} className="p-2.5 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4]">
            {b.accepted ? (
              <div>
                <span className="measurable-line">{b.improved}</span>
                <sup className="footnote-chip">[{b.id}]</sup>
              </div>
            ) : (
              <div>
                <span className="strike-weak">{b.original}</span>
                <div className="mt-1 font-sans text-xs text-pip-ink">
                  → {b.improved}
                </div>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between font-sans text-[10px] text-muted">
              <span>source: {b.source}</span>
              <button
                onClick={() => toggleAccept(b.id)}
                className={`px-2 py-0.5 rounded font-medium ${
                  b.accepted ? "bg-[#ECEAE4] text-text" : "bg-pip text-white"
                }`}
              >
                {b.accepted ? "revert" : "accept"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-[#ECEAE4] flex items-center justify-between font-sans text-xs">
        <span className="text-muted">ready to export as clean PDF?</span>
        <Link href="/tools/resume" className="text-pip hover:underline flex items-center gap-1 font-medium">
          open resume editor <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function ATSScoreCard({ data }) {
  const [score, setScore] = useState(data.score || 78);
  const [fixedItems, setFixedItems] = useState({});

  const applyFix = (idx) => {
    setFixedItems((prev) => ({ ...prev, [idx]: true }));
    setScore((prev) => Math.min(100, prev + 7));
    toast.success("gap resolved! score re-calculated.");
  };

  return (
    <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4] my-2 text-left w-full max-w-xl">
      <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3 mb-3">
        <div>
          <span className="font-pixel text-[11px] text-muted block uppercase">
            ats match preview
          </span>
          <span className="font-sans text-sm font-semibold text-text">
            {data.company} • {data.role}
          </span>
        </div>
        <div className="text-right">
          <span className="font-pixel text-2xl font-bold text-pip">
            {score}<span className="text-sm font-normal text-muted">/100</span>
          </span>
        </div>
      </div>

      <div className="space-y-2 font-sans text-xs">
        {(data.requirements || []).map((req, idx) => {
          const isFixed = fixedItems[idx];
          const isMatched = req.matched || isFixed;

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 ${
                isMatched ? "bg-pip-soft/30 border-pip/30" : "bg-[#FFF9F9] border-[#FBD5D5]"
              }`}
            >
              <div>
                <span className="font-medium text-text block">{req.requirement}</span>
                <span className="text-[11px] text-muted">
                  {isMatched
                    ? `matched (${req.strength || "Added"})`
                    : `gap: ${req.suggestion}`}
                </span>
              </div>

              {!isMatched && (
                <button
                  onClick={() => applyFix(idx)}
                  className="btn-pill-primary text-[11px] py-1 px-2.5 shrink-0"
                >
                  <Sparkles className="w-3 h-3 mr-1 text-pastel-lemon" /> 1-click fix
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-[#ECEAE4] flex items-center justify-between text-xs">
        <span className="text-muted">full scan & parsed profile view</span>
        <Link href="/tools/ats" className="text-pip hover:underline flex items-center gap-1 font-medium">
          view detailed ats tool <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function InterviewCard({ data }) {
  const q = data.question;
  const [started, setStarted] = useState(false);

  return (
    <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4] my-2 text-left w-full max-w-xl">
      <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-2.5 mb-3">
        <span className="font-pixel text-[11px] bg-[#BCAEF2]/20 text-[#543F8A] px-2.5 py-0.5 rounded-full font-medium">
          interview practice • {q?.category || "Technical Round"}
        </span>
        <span className="font-pixel text-xs text-muted">
          timer: {q?.timeLimit || 120}s
        </span>
      </div>

      <p className="font-serif text-sm font-medium text-text leading-relaxed mb-4">
        "{q?.question}"
      </p>

      {!started ? (
        <div className="flex items-center justify-between pt-2 border-t border-[#ECEAE4]">
          <span className="text-xs text-muted font-sans">
            rubric: clarity, depth, and quantified evidence
          </span>
          <button
            onClick={() => setStarted(true)}
            className="btn-pill-primary text-xs py-1.5 px-3.5 gap-1.5"
          >
            <Play className="w-3 h-3 fill-current" /> start timer & answer
          </button>
        </div>
      ) : (
        <div className="p-3 bg-[#FBFAF7] rounded-lg border border-[#ECEAE4] space-y-2">
          <textarea
            placeholder="type your answer or speak aloud…"
            rows={3}
            className="w-full text-xs font-sans p-2 rounded border border-[#ECEAE4] bg-white outline-none focus:border-pip resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[11px] text-pip-ink">
              pip is listening…
            </span>
            <Link
              href="/tools/interview"
              className="btn-pill-pip text-xs py-1 px-3"
            >
              finish in interview prep
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function RoadmapCard({ data }) {
  const roadmap = data.roadmap || [];

  return (
    <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4] my-2 text-left w-full max-w-xl">
      <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-2 mb-3">
        <span className="font-pixel text-[11px] bg-pip-soft text-pip-ink px-2.5 py-0.5 rounded-full">
          weekly gap-closing roadmap
        </span>
        <Link href="/tools/roadmap" className="text-xs text-pip hover:underline">
          view all
        </Link>
      </div>

      <div className="space-y-2.5">
        {roadmap.slice(0, 2).map((w, idx) => (
          <div key={idx} className="p-2.5 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4] text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-text">{w.week}: {w.title}</span>
              <span className="font-pixel text-[10px] text-pip-ink">closes {w.frequency} job gaps</span>
            </div>
            <p className="text-muted text-[11px] mb-2">targets: {w.closedFor.join(", ")}</p>
            <div className="space-y-1">
              {w.tasks.map((t, tidx) => (
                <div key={tidx} className="flex items-center gap-1.5 text-[11px]">
                  <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${t.done ? "bg-pip text-white" : "border border-[#ECEAE4] bg-white"}`}>
                    {t.done ? "✓" : ""}
                  </span>
                  <span className={t.done ? "line-through text-muted" : "text-text"}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
