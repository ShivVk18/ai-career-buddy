"use client";

import React, { useState } from "react";
import Link from "next/link";
import ResumePaperDoc from "@/components/shared/ResumePaperDoc";
import PipStatus from "@/components/pixel/PipStatus";
import { MOCK_JOBS, MOCK_PROFILE } from "@/lib/mock";
import {
  Download,
  Check,
  RotateCcw,
  Sparkles,
  History,
  FileCheck,
  ChevronDown,
  Layers,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function ResumeToolPage() {
  const [selectedJobId, setSelectedJobId] = useState("job-razorpay");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState({
    step: "wizard",
    text: "tailoring quantifiable bullets with verified sources…",
  });
  const [activeVersion, setActiveVersion] = useState("v2-tailored");

  const selectedJob =
    MOCK_JOBS.find((j) => j.id === selectedJobId) || MOCK_JOBS[0];

  const versions = [
    { id: "v2-tailored", name: `v2 tailored for ${selectedJob.company}`, date: "today • 2:30pm", match: "92%" },
    { id: "v1-base", name: "v1 master frontend resume", date: "yesterday", match: "78%" },
  ];

  const handleJobChange = (jobId) => {
    setIsLoading(true);
    setCurrentStep({
      step: "detective",
      text: "reading job requirements for target role…",
    });

    setTimeout(() => {
      setCurrentStep({
        step: "thinking",
        text: "matching candidate experience & finding evidence…",
      });
    }, 500);

    setTimeout(() => {
      setSelectedJobId(jobId);
      setIsLoading(false);
      setCurrentStep({
        step: "coffee",
        text: "tailoring complete! 3 verified edits applied.",
      });
      toast.success("resume tailored for " + (MOCK_JOBS.find(j => j.id === jobId)?.company || "company"));
    }, 1000);
  };

  const handleDownloadPdf = () => {
    window.print();
    toast.success("printing clean PDF…");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-0.5 rounded-full font-medium">
              tool 01 • resume editor
            </span>
            <span className="text-xs text-muted">/tools/resume</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text lowercase">
            the resume edit (paper document)
          </h1>
        </div>

        {/* Job Selector + Export PDF */}
        <div className="flex flex-wrap items-center gap-2.5 max-w-full min-w-0">
          <div className="flex items-center gap-2 bg-[#FBFAF7] border border-[#ECEAE4] px-3 py-1.5 rounded-full text-xs max-w-full min-w-0">
            <span className="font-pixel text-[11px] text-muted shrink-0">target job:</span>
            <select
              value={selectedJobId}
              onChange={(e) => handleJobChange(e.target.value)}
              className="bg-transparent font-medium text-text outline-none cursor-pointer max-w-[170px] sm:max-w-xs truncate"
            >
              {MOCK_JOBS.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.company} — {job.role}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="btn-pill-primary text-xs py-2 px-4 gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>download pdf</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout (Center = Work Area, Right = Pip's Notes + Sources) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Center: Work Area (Paper Document) */}
        <div className="lg:col-span-8 space-y-4">
          {isLoading ? (
            <div className="panel-cozy p-16 bg-white border border-[#ECEAE4] text-center space-y-4">
              <div className="flex justify-center">
                <PipStatus step={currentStep.step} text={currentStep.text} size="lg" />
              </div>
              <p className="font-pixel text-xs text-muted">
                pip is actively editing your resume…
              </p>
            </div>
          ) : (
            <div className="relative">
              <ResumePaperDoc company={selectedJob.company} />
            </div>
          )}

          {/* Quick toggle to existing advanced builder */}
          <div className="panel-cozy p-4 bg-[#FBFAF7] border border-[#ECEAE4] flex items-center justify-between text-xs">
            <span className="text-muted">
              looking for multi-page templates and raw json form entry?
            </span>
            <Link
              href="/resume"
              className="text-pip hover:underline flex items-center gap-1 font-medium"
            >
              open advanced template manager <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Pip's Notes + Sources */}
        <div className="lg:col-span-4 space-y-5">
          {/* Pip Live Status */}
          <PipStatus
            step={currentStep.step}
            text={currentStep.text}
            size="md"
            className="w-full"
          />

          {/* Version History Per Job */}
          <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4]">
            <div className="flex items-center justify-between mb-3 border-b border-[#ECEAE4] pb-2">
              <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-pip" />
                <span className="font-pixel text-xs text-muted uppercase">
                  version history
                </span>
              </div>
              <span className="font-pixel text-[10px] text-pip-ink">
                auto-saved
              </span>
            </div>

            <div className="space-y-2 font-sans text-xs">
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  onClick={() => setActiveVersion(ver.id)}
                  className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                    activeVersion === ver.id
                      ? "bg-pip-soft/40 border-pip"
                      : "bg-[#FBFAF7] border-[#ECEAE4] hover:bg-[#F4F2EC]"
                  }`}
                >
                  <div>
                    <span className="font-medium text-text block lowercase">
                      {ver.name}
                    </span>
                    <span className="text-[10px] text-muted">{ver.date}</span>
                  </div>
                  <span className="font-pixel text-xs text-pip font-bold">
                    {ver.match}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Source Chips & Verified Footnotes */}
          <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4]">
            <div className="flex items-center gap-2 mb-3 border-b border-[#ECEAE4] pb-2">
              <FileCheck className="w-3.5 h-3.5 text-pip" />
              <span className="font-pixel text-xs text-muted uppercase">
                verified sources
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-text">[1] LCP Performance</span>
                  <span className="font-pixel text-[10px] text-pip-ink">verified</span>
                </div>
                <p className="text-muted text-[11px] leading-relaxed">
                  Source: KredX release v2.4 telemetry logs (LCP 3.2s → 1.1s, +28% uploads).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-text">[2] Payment SDK Fallback</span>
                  <span className="font-pixel text-[10px] text-pip-ink">verified</span>
                </div>
                <p className="text-muted text-[11px] leading-relaxed">
                  Source: Datadog checkout telemetry logs (₹14Cr+ volume, 99.4% uptime).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-text">[3] WebSocket Menu Sync</span>
                  <span className="font-pixel text-[10px] text-pip-ink">verified</span>
                </div>
                <p className="text-muted text-[11px] leading-relaxed">
                  Source: UrbanPiper restaurant partner portal analytics (2,400+ active kitchens).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
