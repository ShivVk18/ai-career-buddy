"use client";

import React, { useState } from "react";
import Link from "next/link";
import PipStatus from "@/components/pixel/PipStatus";
import { MOCK_JOBS, MOCK_ATS_REQUIREMENTS, MOCK_PROFILE } from "@/lib/mock";
import {
  Upload,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export default function ATSToolPage() {
  const [selectedJobId, setSelectedJobId] = useState("job-zomato");
  const [score, setScore] = useState(78);
  const [requirements, setRequirements] = useState(MOCK_ATS_REQUIREMENTS);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("aarav_sharma_resume_2025.pdf");

  const selectedJob =
    MOCK_JOBS.find((j) => j.id === selectedJobId) || MOCK_JOBS[0];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setFileName(file.name);
      setTimeout(() => {
        setIsUploading(false);
        toast.success(`parsed ${file.name} successfully!`);
      }, 800);
    }
  };

  const handleApplyFix = (index) => {
    setRequirements((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              matched: true,
              strength: "Added via Pip",
              quoteInResume: `Added bullet: "${r.requirement} implemented with automated test coverage"`,
            }
          : r
      )
    );

    // Count up animation to new score
    const targetScore = Math.min(100, score + 7);
    let current = score;
    const interval = setInterval(() => {
      current += 1;
      setScore(current);
      if (current >= targetScore) {
        clearInterval(interval);
      }
    }, 40);

    toast.success("1-click fix applied! ATS score increased.");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-0.5 rounded-full font-medium">
              tool 06 • ats scanner
            </span>
            <span className="text-xs text-muted">/tools/ats</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text lowercase">
            ats scanner & 1-click requirement fixes
          </h1>
        </div>

        {/* Target Job Selector */}
        <div className="flex items-center gap-2 bg-[#FBFAF7] border border-[#ECEAE4] px-3 py-1.5 rounded-full text-xs max-w-full min-w-0">
          <span className="font-pixel text-[11px] text-muted shrink-0">scoring against:</span>
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setScore(MOCK_JOBS.find(j => j.id === e.target.value)?.atsScore || 82);
            }}
            className="bg-transparent font-medium text-text outline-none cursor-pointer max-w-[180px] sm:max-w-xs truncate"
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
        {/* Center: Work Area (Upload + Parsed Preview + Big Score + Coverage & Fixes) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Big Score Card Banner */}
          <div className="panel-cozy p-6 sm:p-8 bg-white border border-[#ECEAE4] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1 text-center sm:text-left">
              <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-0.5 rounded-full uppercase">
                ats pass probability
              </span>
              <h2 className="text-lg font-bold text-text">
                {selectedJob.company} • {selectedJob.role}
              </h2>
              <p className="text-xs text-muted">
                evaluated using real ATS parsing filters (keyword density, seniority, and formatting)
              </p>
            </div>

            {/* Big Pixel-Font Score */}
            <div className="text-center sm:text-right shrink-0 bg-[#FBFAF7] p-4 rounded-2xl border border-[#ECEAE4] min-w-[140px]">
              <span className="font-pixel text-5xl sm:text-6xl font-bold text-pip tracking-tight block">
                {score}
              </span>
              <span className="font-pixel text-xs text-muted">
                out of 100 points
              </span>
            </div>
          </div>

          {/* Upload & Parsed Profile Preview */}
          <div className="panel-cozy p-5 bg-white border border-[#ECEAE4] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECEAE4] pb-3">
              <div>
                <span className="font-pixel text-xs text-muted uppercase block">
                  current resume file
                </span>
                <span className="text-xs font-semibold text-text">
                  {fileName}
                </span>
              </div>

              {/* Upload trigger */}
              <label className="btn-pill-secondary text-xs py-1.5 px-4 cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>upload new pdf</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Parsed Profile Overview */}
            <div className="p-3.5 rounded-xl bg-[#FBFAF7] border border-[#ECEAE4] text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text">parsed candidate profile:</span>
                <span className="font-pixel text-[10px] text-pip-ink">3 years exp</span>
              </div>
              <p className="text-muted leading-relaxed text-[11px]">
                {MOCK_PROFILE.summary}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {MOCK_PROFILE.skills.frameworks.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="font-pixel text-[10px] bg-white border border-[#ECEAE4] px-2 py-0.5 rounded text-text"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Requirement Coverage & 1-Click Fixes */}
          <div className="panel-cozy p-6 bg-white border border-[#ECEAE4] space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3">
              <div>
                <h3 className="font-bold text-sm text-text lowercase">
                  requirement coverage & one-click fixes
                </h3>
                <span className="text-xs text-muted">
                  clicking 1-click fix weaves the verified requirement into your resume and re-scores live
                </span>
              </div>
            </div>

            <div className="space-y-3 font-sans text-xs">
              {requirements.map((req, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    req.matched
                      ? "bg-pip-soft/20 border-pip/30"
                      : "bg-[#FFF9F9] border-[#FBD5D5]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text">
                        {req.requirement}
                      </span>
                      <span
                        className={`font-pixel text-[10px] px-2 py-0.2 rounded-full ${
                          req.matched
                            ? "bg-pip-soft text-pip-ink"
                            : "bg-[#F6B9CB]/40 text-[#A45564]"
                        }`}
                      >
                        {req.matched ? `matched • ${req.strength}` : "gap detected"}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted">
                      {req.matched
                        ? `found in resume: "${req.quoteInResume}"`
                        : `recommendation: ${req.suggestion}`}
                    </p>
                  </div>

                  {!req.matched && (
                    <button
                      onClick={() => handleApplyFix(idx)}
                      className="btn-pill-primary text-xs py-1.5 px-3.5 shrink-0 flex items-center gap-1 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pastel-lemon" /> 1-click fix
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Existing Resume Parser Link */}
          <div className="panel-cozy p-4 bg-[#FBFAF7] border border-[#ECEAE4] flex items-center justify-between text-xs">
            <span className="text-muted">
              want raw JSON telemetry from our Gemini 2.5 Flash ATS engine?
            </span>
            <Link
              href="/resume-parser"
              className="text-pip hover:underline flex items-center gap-1 font-medium"
            >
              open deep parser tool <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Pip's Notes + ATS Scoring Rules */}
        <div className="lg:col-span-4 space-y-5">
          <PipStatus
            step="thinking"
            text="pip scans for exact technical keywords, semantic synonyms, and quantifiable metrics without penalizing clean formatting"
            size="md"
            className="w-full"
          />

          <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4]">
            <span className="font-pixel text-xs text-muted uppercase block mb-3 border-b border-[#ECEAE4] pb-2">
              ats evaluation weights
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded bg-[#FBFAF7]">
                <span className="text-text">Hard Skills Match</span>
                <span className="font-pixel font-bold text-pip">40%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[#FBFAF7]">
                <span className="text-text">Quantified Experience</span>
                <span className="font-pixel font-bold text-pip">40%</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-[#FBFAF7]">
                <span className="text-text">Format & Parseability</span>
                <span className="font-pixel font-bold text-pip">20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
