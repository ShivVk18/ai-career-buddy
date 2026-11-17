"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { toast } from "sonner";
import ChatSlideOver from "@/components/chat/ChatSlideOver";

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
};

export default function DashboardView({ data }) {
  const d = data || EMPTY_DATA;
  const counts = d.counts || EMPTY_DATA.counts;
  const targets = d.targets || [];
  const nextTasks = d.nextTasks || [];
  const [selectedToolId, setSelectedToolId] = useState("resume");
  const [quickInput, setQuickInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

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

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    toast.success("pip received your request!");
    setChatOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ─── AscendAI Signature: Greeting Card with Time of Day = Progress Scene ─── */}
      <div className="panel-cozy overflow-hidden border border-[#ECEAE4] bg-white relative shadow-sm">
        {/* Background Pixel Scene */}
        <div className="h-44 sm:h-56 w-full relative">
          <PixelScene variant={sceneVariant} seed={505} />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent" />

          {/* Time of Day Progress Badge */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 max-w-[calc(100%-1.5rem)]">
            <span className="font-pixel text-[10px] sm:text-[11px] bg-white/90 backdrop-blur-sm text-text border border-[#ECEAE4] px-2.5 sm:px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5 truncate">
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
        <div className="p-4 sm:p-6 bg-white border-t border-[#ECEAE4]">
          <form
            onSubmit={handleQuickSubmit}
            className="flex flex-col sm:flex-row items-center gap-2.5 max-w-3xl"
          >
            <div className="relative w-full flex-1">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="ask pip about your scores, roadmap or documents…"
                className="w-full bg-[#FBFAF7] text-text placeholder:text-[#A8A6AE] text-xs sm:text-sm px-4 py-3 rounded-full border border-[#ECEAE4] focus:border-pip focus:bg-white outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="btn-pill-primary text-xs sm:text-sm py-3 px-6 w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>ask pip</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
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
                    ? "border-pip ring-1 ring-pip bg-white shadow-sm"
                    : "border-[#ECEAE4] bg-white hover:border-[#DDD9CF]"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4] flex items-center justify-center shrink-0">
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
          {/* Applications List */}
          <div id="applications" className="panel-cozy p-5 sm:p-6 bg-white border border-[#ECEAE4]">
            <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3 mb-4">
              <div>
                <h2 className="font-bold text-base text-text lowercase">
                  targets & pipeline
                </h2>
                <span className="text-xs text-muted">
                  companies and roles from your own documents
                </span>
              </div>
              <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-1 rounded-full">
                {d.totalTargets ?? targets.length} {(d.totalTargets ?? targets.length) === 1 ? "target" : "targets"}
              </span>
            </div>

            {targets.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-[#ECEAE4] bg-[#FBFAF7]/40 text-center">
                <p className="text-sm text-text mb-1">No targets yet.</p>
                <p className="text-xs text-muted mb-3">
                  Targets appear here when you run an ATS check or write a cover letter or cold email for a company and role.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href="/resume-parser" className="btn-pill-secondary text-xs py-1 px-3">run an ats check</Link>
                  <Link href="/cover-letter" className="btn-pill-secondary text-xs py-1 px-3">write a cover letter</Link>
                  <Link href="/cold-email" className="btn-pill-secondary text-xs py-1 px-3">draft a cold email</Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {targets.map((t) => (
                  <div
                    key={t.key}
                    className="p-3.5 rounded-xl border border-[#ECEAE4] hover:border-pip/50 transition bg-[#FBFAF7]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0"
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
            )}
          </div>

          {/* This Week List */}
          <div className="panel-cozy p-5 sm:p-6 bg-white border border-[#ECEAE4]">
            <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3 mb-4">
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
              <div className="p-5 rounded-xl border border-dashed border-[#ECEAE4] bg-[#FBFAF7]/40 text-center">
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
                    className="p-3 rounded-xl border border-[#ECEAE4] hover:bg-[#FBFAF7] transition flex items-center justify-between gap-3"
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
          <div className="panel-cozy p-5 bg-white border border-[#ECEAE4]">
            <div className="flex items-center justify-between mb-3 border-b border-[#ECEAE4] pb-2.5">
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

            <p className="text-xs text-[#6D6B75] leading-relaxed mb-4">
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
          <div className="panel-cozy p-5 bg-[#FBFAF7] border border-[#ECEAE4]">
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
      <ChatSlideOver isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
