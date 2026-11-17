"use client";

import React, { useState } from "react";
import { Check, RotateCcw, Sparkles } from "lucide-react";

export default function ResumePaperDoc({
  candidate = {
    name: "Aarav Sharma",
    title: "Frontend Engineer (React / Next.js / TypeScript)",
    contact: "Bengaluru, India • aarav.sharma.dev@gmail.com • +91 98765 43210",
  },
  company = "Razorpay",
  interactive = true,
  className = "",
  initialEdits = null,
}) {
  const defaultEdits = [
    {
      id: 1,
      role: "Frontend Engineer",
      company: "KredX Technologies",
      period: "2023 - Present",
      weakText: "Worked on merchant dashboard and payment settlement pages using React and Redux.",
      improvedText: "Architected real-time merchant invoice dashboard in Next.js 15, reducing LCP from 3.2s to 1.1s and boosting daily invoice uploads by 28%.",
      matchedSkill: "Next.js 15 & Web Vitals",
      sourceFootnote: "merchant dashboard release telemetry (Q3 2024)",
      accepted: true,
    },
    {
      id: 2,
      role: "Frontend Engineer",
      company: "KredX Technologies",
      period: "2023 - Present",
      weakText: "Helped team integrate third-party payment gateways and fixed checkout bugs.",
      improvedText: "Engineered headless payment checkout SDK with resilient fallback retries, processing ₹14Cr+ in monthly disbursements with 99.4% success rate.",
      matchedSkill: "Payment SDKs",
      sourceFootnote: "datadog checkout telemetry logs",
      accepted: false,
    },
    {
      id: 3,
      role: "Associate Software Engineer",
      company: "UrbanPiper",
      period: "2022 - 2023",
      weakText: "Built food aggregator menu management features for restaurant partners.",
      improvedText: "Implemented optimistic UI updates and WebSocket sync for restaurant live menu editors across 2,400+ active kitchens.",
      matchedSkill: "WebSockets & Real-time Sync",
      sourceFootnote: "restaurant partner portal release logs",
      accepted: true,
    },
  ];

  const [edits, setEdits] = useState(initialEdits || defaultEdits);

  const toggleAccept = (id) => {
    if (!interactive) return;
    setEdits((prev) =>
      prev.map((e) => (e.id === id ? { ...e, accepted: !e.accepted } : e))
    );
  };

  const acceptAll = () => {
    if (!interactive) return;
    setEdits((prev) => prev.map((e) => ({ ...e, accepted: true })));
  };

  return (
    <div
      className={`paper-doc rounded-xl p-4 sm:p-8 bg-white border border-[#ECEAE4] text-[#23222B] shadow-lg max-w-2xl mx-auto transition-all ${className}`}
    >
      {/* Header Bar with subtle Pip indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECEAE4] pb-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[10px] uppercase tracking-wide text-[#6D6B75] border border-[#ECEAE4] bg-[#F4F2EC] px-2 py-1 rounded-full inline-block">
            Sample
          </span>
          <span className="font-pixel text-[11px] text-pip-ink bg-pip-soft px-2.5 py-1 rounded-full inline-block">
            pip's live edit • tailored for {company.toLowerCase()}
          </span>
        </div>
        {interactive && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={acceptAll}
              className="font-sans text-xs font-medium text-[#2F9E77] hover:text-[#1E7356] transition flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E3F4EC]"
            >
              <Check className="w-3.5 h-3.5" />
              accept all edits
            </button>
          </div>
        )}
      </div>

      {/* Candidate Resume Header */}
      <div className="text-center mb-6">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-[#23222B] mb-1">
          {candidate.name}
        </h2>
        <p className="font-serif text-xs text-[#6D6B75] italic mb-1">
          {candidate.title}
        </p>
        <p className="font-sans text-[11px] text-[#A8A6AE] tracking-wide break-words">
          {candidate.contact}
        </p>
      </div>

      {/* Experience Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between border-b border-[#23222B]/20 pb-1 mb-3">
          <span className="font-serif font-bold text-xs uppercase tracking-widest text-[#23222B]">
            Professional Experience
          </span>
          <span className="font-pixel text-[10px] text-[#A8A6AE]">
            tracked changes active
          </span>
        </div>

        {/* Edit Blocks */}
        <div className="space-y-5">
          {edits.map((item) => (
            <div
              key={item.id}
              className="group relative pl-3 border-l-2 border-[#ECEAE4] hover:border-pip transition"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-serif font-semibold text-xs text-[#23222B]">
                  {item.role} — <span className="font-normal italic text-[#6D6B75]">{item.company}</span>
                </span>
                <span className="font-sans text-[10px] text-[#A8A6AE]">
                  {item.period}
                </span>
              </div>

              {/* The Struck / Rewritten Line */}
              <div className="text-[13px] leading-relaxed font-serif pt-1">
                {item.accepted ? (
                  <div>
                    <span className="measurable-line">
                      {item.improvedText}
                    </span>
                    <sup className="footnote-chip" title={item.sourceFootnote}>
                      [{item.id}]
                    </sup>
                    <span className="ml-2 font-pixel text-[10px] text-pip-ink bg-pip-soft px-1.5 py-0.5 rounded">
                      match: {item.matchedSkill}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="strike-weak">
                      {item.weakText}
                    </span>
                    <div className="mt-1.5 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-pip shrink-0 mt-0.5" />
                      <span className="text-[12px] text-pip-ink font-sans">
                        pip suggestion: "{item.improvedText}"
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Accept / Revert Chip */}
              {interactive && (
                <div className="mt-2 flex items-center justify-between text-[11px] font-sans">
                  <span className="font-pixel text-[10px] text-[#6D6B75]">
                    source footnote [{item.id}]: {item.sourceFootnote}
                  </span>
                  <button
                    onClick={() => toggleAccept(item.id)}
                    className={`px-2.5 py-0.5 rounded-full font-medium transition flex items-center gap-1 ${
                      item.accepted
                        ? "bg-[#F4F2EC] text-[#6D6B75] hover:bg-[#ECEAE4]"
                        : "bg-pip text-white hover:bg-pip-ink"
                    }`}
                  >
                    {item.accepted ? (
                      <>
                        <RotateCcw className="w-3 h-3" /> revert line
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" /> accept change
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Verified Footnotes Section */}
      <div className="mt-6 pt-3 border-t border-[#ECEAE4] bg-[#FBFAF7] p-3 rounded-lg">
        <span className="font-pixel text-[10px] uppercase text-[#6D6B75] tracking-wider block mb-1">
          pip verified footnotes (zero hallucinations)
        </span>
        <ul className="space-y-1 text-[11px] font-sans text-[#6D6B75]">
          {edits.map((item) => (
            <li key={item.id} className="flex items-center gap-1.5">
              <span className="font-pixel text-pip-ink font-bold">[{item.id}]</span>
              <span>{item.sourceFootnote} • matched for <strong className="text-text font-medium">{item.matchedSkill}</strong></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
