"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import PixelScene from "@/components/pixel/PixelScene";
import PipStatus from "@/components/pixel/PipStatus";
import {
  MOCK_JOBS,
  MOCK_WEEKLY_ROADMAP,
  MOCK_ATS_REQUIREMENTS,
} from "@/lib/mock";
import {
  ScrollText,
  Sparkles,
  FileText,
  Mail,
  BrainCircuit,
  ClipboardCheck,
  ArrowRight,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import ChatSlideOver from "@/components/chat/ChatSlideOver";

export default function DashboardView() {
  const { user } = useUser();
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [selectedToolId, setSelectedToolId] = useState("resume");
  const [quickInput, setQuickInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [tasks, setTasks] = useState(
    MOCK_WEEKLY_ROADMAP[1].tasks.map((t, idx) => ({ ...t, id: idx }))
  );

  const candidateName = user?.firstName || "Aarav";

  // AscendAI Signature: Time of day = pipeline progress
  // dawn (just started) → noon (applying) → sunset (interviewing) → night with stars (offer received)
  const hasOffer = jobs.some((j) => j.status === "offer");
  const hasInterview = jobs.some((j) => j.status === "interviewing");
  const hasApplying = jobs.some((j) => j.status === "applying");

  let sceneVariant = "morning"; // dawn
  let progressStatusText = "dawn • profile ready, exploring targets";
  let pipOutfit = "coffee";

  if (hasOffer) {
    sceneVariant = "dusk"; // night with stars
    progressStatusText = "night with stars • offer received from cred!";
    pipOutfit = "rocket";
  } else if (hasInterview) {
    sceneVariant = "pink"; // sunset
    progressStatusText = "sunset • 2 active interview loops in progress";
    pipOutfit = "headphones";
  } else if (hasApplying) {
    sceneVariant = "noon"; // noon
    progressStatusText = "noon • applications dispatched, monitoring responses";
    pipOutfit = "thinking";
  }

  const toolCards = [
    {
      id: "resume",
      name: "resume builder",
      icon: ScrollText,
      href: "/tools/resume",
      status: "tailored for razorpay (92% match)",
      badge: "paper doc",
      preview: "3 quantifiable bullets verified with telemetry footnotes. ready to download pdf.",
    },
    {
      id: "interview",
      name: "interview prep",
      icon: Sparkles,
      href: "/tools/interview",
      status: "next: swiggy web vitals simulation",
      badge: "rubric scoring",
      preview: "practice 10 real interview questions with evidence quotes and live timer.",
    },
    {
      id: "cover-letter",
      name: "cover letter",
      icon: FileText,
      href: "/tools/cover-letter",
      status: "razorpay letter drafted (280 words)",
      badge: "tone slider",
      preview: "confident tone, no corporate fluff, directly addresses checkout challenges.",
    },
    {
      id: "cold-email",
      name: "cold email",
      icon: Mail,
      href: "/tools/cold-email",
      status: "zomato outreach ready (118 words)",
      badge: "<120 words",
      preview: "highlights food aggregator menu management experience with mailto launch.",
    },
    {
      id: "roadmap",
      name: "career roadmap",
      icon: BrainCircuit,
      href: "/tools/roadmap",
      status: "week 2: headless components (4 gaps)",
      badge: "weekly sync",
      preview: "closing accessibility & playwright testing gaps across 5 target roles.",
    },
    {
      id: "ats",
      name: "ats scanner",
      icon: ClipboardCheck,
      href: "/tools/ats",
      status: "score: 88/100 average across targets",
      badge: "1-click fix",
      preview: "upload any resume pdf and test match against real Indian tech JDs.",
    },
  ];

  const selectedTool = toolCards.find((t) => t.id === selectedToolId) || toolCards[0];

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    toast.success("pip received your request!");
    setChatOpen(true);
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
    toast.success("task progress updated");
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
              text={`welcome back, ${candidateName.toLowerCase()}. pip is tuned to your tech pipeline.`}
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
                placeholder="paste a job link, or ask pip anything (e.g. 'tailor for razorpay')…"
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
                  active applications & pipeline
                </h2>
                <span className="text-xs text-muted">
                  tracked next action for every company
                </span>
              </div>
              <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-1 rounded-full">
                {jobs.length} in progress
              </span>
            </div>

            <div className="space-y-3">
              {jobs.map((job) => {
                const statusStyles = {
                  offer: "bg-[#E3F4EC] text-pip-ink border-pip/30",
                  interviewing: "bg-[#BCAEF2]/20 text-[#543F8A] border-[#BCAEF2]/40",
                  applying: "bg-[#FFE48A]/30 text-[#8B6B45] border-[#FFE48A]/50",
                  draft: "bg-[#F4F2EC] text-muted border-[#ECEAE4]",
                };

                return (
                  <div
                    key={job.id}
                    className="p-3.5 rounded-xl border border-[#ECEAE4] hover:border-pip/50 transition bg-[#FBFAF7]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-text">
                          {job.company}
                        </span>
                        <span className="text-xs text-muted truncate">• {job.role}</span>
                        <span
                          className={`font-pixel text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                            statusStyles[job.status] || ""
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 text-xs text-[#23222B]">
                        <span className="font-pixel text-[11px] text-pip-ink font-medium shrink-0">
                          next action:
                        </span>
                        <span className="break-words">{job.nextAction}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-pixel text-xs text-pip font-bold">
                          {job.matchRate}% match
                        </span>
                        <span className="block text-[10px] text-muted">{job.salary}</span>
                      </div>
                      <Link
                        href="/tools/resume"
                        className="btn-pill-secondary text-xs py-1 px-3"
                      >
                        tailor
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* This Week List */}
          <div className="panel-cozy p-5 sm:p-6 bg-white border border-[#ECEAE4]">
            <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3 mb-4">
              <div>
                <h2 className="font-bold text-base text-text lowercase">
                  this week with pip
                </h2>
                <span className="text-xs text-muted">
                  high-frequency gaps holding back multiple applications
                </span>
              </div>
              <Link
                href="/tools/roadmap"
                className="text-xs text-pip hover:underline flex items-center gap-1 font-medium"
              >
                view full roadmap <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="p-3 rounded-xl border border-[#ECEAE4] hover:bg-[#FBFAF7] transition flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center transition ${
                        task.done
                          ? "bg-pip text-white"
                          : "border border-[#ECEAE4] bg-white"
                      }`}
                    >
                      {task.done && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span
                      className={`text-xs ${
                        task.done ? "line-through text-muted" : "text-text font-medium"
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>
                  <span className="font-pixel text-[10px] text-pip-ink bg-pip-soft px-2 py-0.5 rounded">
                    closes gaps for razorpay & swiggy
                  </span>
                </div>
              ))}
            </div>
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
                  need live mock scoring or bullet rewrites?
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
