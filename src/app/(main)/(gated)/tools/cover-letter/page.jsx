"use client";

import React, { useState } from "react";
import Link from "next/link";
import PipStatus from "@/components/pixel/PipStatus";
import { MOCK_JOBS, MOCK_PROFILE } from "@/lib/mock";
import {
  Copy,
  Sparkles,
  Sliders,
  Check,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export default function CoverLetterToolPage() {
  const [selectedJobId, setSelectedJobId] = useState("job-razorpay");
  const [tone, setTone] = useState("confident"); // "stiff" | "confident" | "eager"
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedJob = MOCK_JOBS.find((j) => j.id === selectedJobId) || MOCK_JOBS[0];

  const letterVariants = {
    stiff: `Dear Hiring Team at ${selectedJob.company},

I am submitting my formal application for the ${selectedJob.role} position. With over three years of professional frontend engineering experience within fintech and commerce, I have maintained high adherence to web standards and scalable component systems.

During my tenure at KredX Technologies, I was responsible for merchant dashboard surfaces and payment integrations, helping maintain system uptime and processing critical disbursements. My core competencies include React, Next.js, and TypeScript.

I look forward to discussing how my background aligns with your engineering requirements in a subsequent interview.

Sincerely,
${MOCK_PROFILE.name}`,

    confident: `Dear ${selectedJob.company} Engineering Team,

Building checkout surfaces where sub-100ms latency directly determines transaction completion is why I'm reaching out about the ${selectedJob.role} role.

At KredX Technologies, I architected our merchant invoice dashboard in Next.js 15, cutting LCP from 3.2s to 1.1s and boosting invoice upload throughput by 28%. When payment drop-offs occurred during intermittent connectivity, I engineered a headless checkout SDK with client-side retry fallback that safeguarded ₹14Cr+ in monthly disbursements.

${selectedJob.company}'s focus on merchant checkout reliability mirrors the exact problems I solve daily. I'd love to show you how our performance patterns can translate directly to your roadmap.

Best regards,
${MOCK_PROFILE.name}`,

    eager: `Hey ${selectedJob.company} Team!

I've followed ${selectedJob.company}'s checkout infrastructure with huge admiration, and I'd love to bring my frontend performance toolkit to the ${selectedJob.role} team.

Over the past three years at KredX and UrbanPiper, I've obsessed over eliminating web vitals bottlenecks—dropping dashboard LCP to 1.1s and shipping real-time WebSocket menu sync across 2,400+ active merchant kitchens.

I love building fast, reliable, pixel-perfect user experiences that merchants rely on every second. I can't wait to chat with the team!

Warmly,
${MOCK_PROFILE.name}`,
  };

  const [letterContent, setLetterContent] = useState(letterVariants.confident);

  const handleToneChange = (newTone) => {
    setTone(newTone);
    setIsGenerating(true);
    setTimeout(() => {
      setLetterContent(letterVariants[newTone]);
      setIsGenerating(false);
      toast.success(`tone shifted to ${newTone}`);
    }, 400);
  };

  const handleMakeShorter = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const shorter = letterContent
        .split("\n\n")
        .filter((_, i) => i !== 1)
        .join("\n\n");
      setLetterContent(shorter);
      setIsGenerating(false);
      toast.success("trimmed 60 words for maximum brevity");
    }, 400);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(letterContent);
    toast.success("cover letter copied to clipboard!");
  };

  const wordCount = letterContent.trim().split(/\s+/).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-0.5 rounded-full font-medium">
              tool 03 • cover letter
            </span>
            <span className="text-xs text-muted">/tools/cover-letter</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text lowercase">
            targeted cover letter (no corporate clichés)
          </h1>
        </div>

        {/* Target job selector */}
        <div className="flex items-center gap-2 bg-[#FBFAF7] border border-[#ECEAE4] px-3.5 py-1.5 rounded-full text-xs max-w-full min-w-0">
          <span className="font-pixel text-[11px] text-muted shrink-0">role target:</span>
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
        {/* Center: Work Area (Tone Bar + Letter Paper Doc + Actions) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tone Bar */}
          <div className="panel-cozy p-4 bg-white border border-[#ECEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pip" />
              <span className="font-pixel text-xs text-muted uppercase">
                tone selector:
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-[#FBFAF7] p-1 rounded-full border border-[#ECEAE4]">
              {[
                { id: "stiff", label: "stiff (formal)" },
                { id: "confident", label: "confident (solution-focused)" },
                { id: "eager", label: "eager (startup energy)" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleToneChange(t.id)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                    tone === t.id
                      ? "bg-text text-white shadow-xs"
                      : "text-muted hover:text-text"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Letter Document (Paper Doc) */}
          <div className="paper-doc rounded-xl p-6 sm:p-10 bg-white border border-[#ECEAE4] text-text shadow-sm relative space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3 mb-4">
              <span className="font-pixel text-[11px] text-pip-ink bg-pip-soft px-2.5 py-0.5 rounded-full">
                tailored letter • {selectedJob.company}
              </span>
              <span className="font-pixel text-xs text-muted">
                word count: <strong className="text-text">{wordCount}</strong> words (ideal: 250-320)
              </span>
            </div>

            {isGenerating ? (
              <div className="py-20 text-center space-y-3">
                <PipStatus step="wizard" text="pip is adjusting phrasing & tone…" size="md" />
              </div>
            ) : (
              <textarea
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                rows={14}
                className="w-full font-serif text-sm leading-relaxed text-[#23222B] bg-transparent outline-none resize-none"
              />
            )}
          </div>

          {/* Quick Modifier Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleMakeShorter}
                className="btn-pill-secondary text-xs py-1.5 px-3.5"
              >
                shorter (-60 words)
              </button>
              <button
                onClick={() => handleToneChange("stiff")}
                className="btn-pill-secondary text-xs py-1.5 px-3.5"
              >
                more formal
              </button>
              <button
                onClick={() => handleToneChange("confident")}
                className="btn-pill-secondary text-xs py-1.5 px-3.5 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> regenerate
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="btn-pill-primary text-xs py-2 px-5 flex items-center gap-1.5 shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" /> use / copy letter
            </button>
          </div>
        </div>

        {/* Right: Pip's Notes + Flagged Clichés */}
        <div className="lg:col-span-4 space-y-5">
          <PipStatus
            step="wizard"
            text="pip eliminated generic phrases ('i am thrilled to apply') and led with checkout latency impact"
            size="md"
            className="w-full"
          />

          {/* Flagged Sentences Audit */}
          <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4]">
            <div className="flex items-center gap-2 mb-3 border-b border-[#ECEAE4] pb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#8B6B45]" />
              <span className="font-pixel text-xs text-muted uppercase">
                flagged sentences (resolved)
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4]">
                <span className="strike-weak block mb-1">
                  "I am writing to express my eager excitement regarding the open role."
                </span>
                <span className="text-pip-ink font-sans text-[11px] block">
                  → Replaced with immediate hook addressing Razorpay checkout latency.
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4]">
                <span className="strike-weak block mb-1">
                  "I have great communication skills and work well in teams."
                </span>
                <span className="text-pip-ink font-sans text-[11px] block">
                  → Replaced with concrete proof: authored shared component library adopted by 4 squads.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
