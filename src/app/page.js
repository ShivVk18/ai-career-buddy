"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import PixelScene from "@/components/pixel/PixelScene";
import PipStatus from "@/components/pixel/PipStatus";
import ResumePaperDoc from "@/components/shared/ResumePaperDoc";
import {
  Sparkles,
  ArrowRight,
  Check,
  ChevronDown,
  Layers,
  FileText,
  Mail,
  BrainCircuit,
  ClipboardCheck,
  ExternalLink,
} from "lucide-react";

export default function LandingPage() {
  const [activeJob, setActiveJob] = useState("razorpay");
  const [openFaq, setOpenFaq] = useState(null);

  const jobsData = {
    razorpay: {
      company: "Razorpay",
      role: "Frontend Engineer II",
      have: ["React 19 & Next.js 15", "Web Vitals & Performance", "TypeScript"],
      partial: ["Payment SDK Integration"],
      gap: ["Playwright E2E testing"],
      matchRate: 92,
    },
    swiggy: {
      company: "Swiggy",
      role: "Senior UI Engineer",
      have: ["Design Systems", "Web Vitals", "Component Architecture"],
      partial: ["Micro-frontends"],
      gap: ["Apollo GraphQL Federation"],
      matchRate: 86,
    },
    cred: {
      company: "CRED",
      role: "Frontend Developer",
      have: ["Next.js App Router", "TypeScript", "Fluid UI Animation"],
      partial: ["Canvas / WebGL"],
      gap: ["Financial Security Standards"],
      matchRate: 94,
    },
  };

  const selectedJob = jobsData[activeJob];

  const toolsData = [
    {
      name: "resume builder",
      outfit: "wizard",
      scene: "morning",
      oldText: "generic resume stuffed with buzzwords and unverified claims",
      newText: "paper doc with match highlights, struck lines, and source telemetry footnotes",
      href: "/tools/resume",
    },
    {
      name: "interview prep",
      outfit: "headphones",
      scene: "peaks",
      oldText: "scary mock interviews with robotic generic multiple-choice quizzes",
      newText: "one question at a time with rubric scoring, evidence quotes, and timers",
      href: "/tools/interview",
    },
    {
      name: "cover letter",
      outfit: "wizard",
      scene: "pink",
      oldText: "fluffy corporate letters that start with 'i am thrilled to apply'",
      newText: "stiff-to-eager tone slider, flagged clichés, and 250-word targeted clarity",
      href: "/tools/cover-letter",
    },
    {
      name: "cold email",
      outfit: "rocket",
      scene: "sea",
      oldText: "templated spam messages sent to 50 recruiters that get ignored",
      newText: "concise <120 word outreach with matched projects highlighted and mailto links",
      href: "/tools/cold-email",
    },
    {
      name: "career roadmap",
      outfit: "detective",
      scene: "meadow",
      oldText: "overwhelming 2-year roadmaps with random youtube playlist links",
      newText: "weekly tasks mapped directly to the job gaps holding back your applications",
      href: "/tools/roadmap",
    },
    {
      name: "ats scanner",
      outfit: "thinking",
      scene: "lemon",
      oldText: "cryptic percentage scores that leave you guessing what failed",
      newText: "big pixel font score per role with 1-click fixes that count up live",
      href: "/tools/ats",
    },
  ];

  const faqs = [
    {
      q: "why is pip better than generic ai chat tools?",
      a: "general chat tools hallucinate metrics and vomit out corporate clichés ('dynamic problem solver'). pip treats your experience like an audit: it strikes weak lines, insists on measurable evidence, and adds source footnotes from your real projects so you can defend every word in interviews.",
    },
    {
      q: "how does 'time of day = progress' work?",
      a: "the pixel sky behind your dashboard isn't tied to your clock — it mirrors your real job search pipeline. when you just start, it's dawn. as you apply, it shifts to noon. when you're interviewing, it turns to a warm sunset. when an offer comes in, stars light up the night.",
    },
    {
      q: "are the 6 tools really connected to one pip?",
      a: "yes. when pip reviews your resume for a razorpay role, it remembers the missing web vitals metric. when you jump into interview prep, pip asks you about that exact gap. when you open roadmap, it assigns a task to close it.",
    },
    {
      q: "can i download my resume as a real pdf?",
      a: "yes. the paper document editor exports clean, formatted, ats-friendly pdfs without watermarks or weird table layouts.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#23222B] selection:bg-pip-soft selection:text-pip-ink font-sans">
      {/* ─── Navigation ─── */}
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-pip-soft flex items-center justify-center p-1 pip-hop">
            <Image
              src="/pip/pip-coffee.svg"
              alt="pip"
              width={26}
              height={26}
              style={{ imageRendering: "pixelated" }}
              unoptimized
            />
          </div>
          <span className="font-semibold text-base tracking-tight text-text">
            ascendai
          </span>
          <span className="font-pixel text-[11px] text-pip-ink bg-pip-soft px-2 py-0.5 rounded-full">
            with pip
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-xs text-muted font-medium">
          <a href="#tools" className="hover:text-text transition">six tools</a>
          <a href="#remembers" className="hover:text-text transition">pip remembers</a>
          <a href="#how" className="hover:text-text transition">how it works</a>
          <a href="#faq" className="hover:text-text transition">questions</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xs font-medium text-text hover:text-pip transition px-3 py-1.5"
          >
            sign in
          </Link>
          <Link
            href="/dashboard"
            className="btn-pill-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
          >
            <span>open app</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ─── Hero Section with Morning Scene ─── */}
      <section className="relative pt-6 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Pixel Scene Card Backdrop */}
        <div className="max-w-6xl mx-auto rounded-[24px] overflow-hidden border border-[#ECEAE4] bg-white shadow-sm relative">
          {/* Top Canvas Banner: Morning Scene */}
          <div className="h-56 sm:h-72 w-full relative">
            <PixelScene variant="morning" seed={101} />
            {/* Soft gradient fade into white panel */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />

            {/* Floating Pip Greeting Badge */}
            <div className="absolute bottom-4 left-4 sm:left-10 z-10 max-w-[calc(100%-2rem)]">
              <PipStatus
                step="detective"
                text="reading the job description & your verified achievements…"
                size="md"
              />
            </div>
          </div>

          {/* Hero Typography & CTA */}
          <div className="px-4 sm:px-12 pt-4 pb-12 text-center max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text lowercase mb-4 leading-tight break-words">
              meet pip. it gets you hired as yourself.
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed mb-8">
              your cozy ai career coach. pip highlights matches, strikes weak lines, and writes measurable bullet points with verified source footnotes.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#demo"
                className="btn-pill-primary text-sm py-2.5 px-6 shadow-sm flex items-center gap-2"
              >
                <span>try the live demo</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/dashboard"
                className="btn-pill-secondary text-sm py-2.5 px-6"
              >
                enter dashboard
              </Link>
            </div>
          </div>

          {/* ─── Live Demo Panel ─── */}
          <div id="demo" className="border-t border-[#ECEAE4] bg-[#FBFAF7] p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="font-pixel text-[11px] text-pip-ink uppercase tracking-wider block mb-1">
                    live interactive demo
                  </span>
                  <span className="text-sm font-semibold text-text">
                    select a target job or see how pip edits:
                  </span>
                </div>

                {/* Job Selector Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {Object.keys(jobsData).map((key) => (
                    <button
                      key={key}
                      onClick={() => setActiveJob(key)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                        activeJob === key
                          ? "bg-text text-white"
                          : "bg-white text-muted border border-[#ECEAE4] hover:bg-[#F4F2EC]"
                      }`}
                    >
                      {jobsData[key].company} ({jobsData[key].matchRate}%)
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid: Resume Paper Doc + Have/Partial/Gap Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Paper Resume Edit (Signature 1) */}
                <div className="lg:col-span-8">
                  <ResumePaperDoc company={selectedJob.company} />
                </div>

                {/* Have / Partial / Gap Checklist */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="panel-cozy p-5 bg-white border border-[#ECEAE4]">
                    <div className="flex items-center justify-between mb-4 border-b border-[#ECEAE4] pb-2">
                      <span className="font-pixel text-xs text-muted uppercase">
                        role breakdown
                      </span>
                      <span className="font-pixel text-lg font-bold text-pip">
                        {selectedJob.matchRate}% match
                      </span>
                    </div>

                    {/* Have list */}
                    <div className="mb-4">
                      <span className="font-pixel text-[11px] text-pip-ink bg-pip-soft px-2 py-0.5 rounded block w-fit mb-2">
                        ✓ strong matches ({selectedJob.have.length})
                      </span>
                      <ul className="space-y-1 text-xs text-text">
                        {selectedJob.have.map((item, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-pip" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Partial list */}
                    <div className="mb-4">
                      <span className="font-pixel text-[11px] text-[#8B6B45] bg-[#FFE48A]/40 px-2 py-0.5 rounded block w-fit mb-2">
                        ~ partial overlaps ({selectedJob.partial.length})
                      </span>
                      <ul className="space-y-1 text-xs text-muted">
                        {selectedJob.partial.map((item, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-pastel-lemon" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Gap list */}
                    <div>
                      <span className="font-pixel text-[11px] text-[#A45564] bg-[#F6B9CB]/40 px-2 py-0.5 rounded block w-fit mb-2">
                        ✕ current gaps ({selectedJob.gap.length})
                      </span>
                      <ul className="space-y-1 text-xs text-[#A45564]">
                        {selectedJob.gap.map((item, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-pastel-pink" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pip Status helper */}
                  <PipStatus
                    step="thinking"
                    text={`pip is actively matching your verified experience against ${selectedJob.company} requirements`}
                    size="sm"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── One-line Intro ─── */}
      <section className="py-12 border-y border-[#ECEAE4] bg-[#F4F2EC]/40 text-center px-4">
        <p className="text-base sm:text-lg text-text font-serif italic max-w-2xl mx-auto">
          &quot;no generic bullet points. no automated hallucinations. just your real work, sharpened for the role you actually want.&quot;
        </p>
      </section>

      {/* ─── Six Tools. One Pip Who Knows You. ─── */}
      <section id="tools" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
            connected toolkit
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text lowercase mb-3">
            six tools. one pip who knows you.
          </h2>
          <p className="text-sm text-muted">
            every tool shares the same memory of your projects, gaps, and interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolsData.map((tool, idx) => (
            <Link
              key={idx}
              href={tool.href}
              className="panel-cozy overflow-hidden group hover:border-pip transition-all hover:shadow-md flex flex-col bg-white"
            >
              {/* Mini Pixel Scene Canvas Header */}
              <div className="h-28 w-full relative">
                <PixelScene variant={tool.scene} seed={200 + idx * 17} />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />

                {/* Pip in specific outfit */}
                <div className="absolute bottom-2 left-3 z-10 w-8 h-8 p-1 rounded-full bg-white/95 border border-[#ECEAE4] shadow-xs pip-hop">
                  <Image
                    src={`/pip/pip-${tool.outfit}.svg`}
                    alt={tool.outfit}
                    width={26}
                    height={26}
                    style={{ imageRendering: "pixelated" }}
                    unoptimized
                  />
                </div>
              </div>

              {/* Tool Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-base text-text lowercase mb-2 flex items-center justify-between">
                    <span>{tool.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-pip group-hover:translate-x-1 transition" />
                  </h3>

                  {/* Old version struck through */}
                  <div className="text-xs text-muted mb-2">
                    <span className="strike-weak block mb-1">{tool.oldText}</span>
                  </div>

                  {/* New one-liner */}
                  <p className="text-xs text-pip-ink font-medium leading-relaxed">
                    → {tool.newText}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Pip Remembers (Meadow Scene + 3 Panels) ─── */}
      <section id="remembers" className="py-20 px-4 sm:px-6 bg-[#FBFAF7]">
        <div className="max-w-6xl mx-auto rounded-[24px] overflow-hidden border border-[#ECEAE4] bg-white shadow-sm">
          {/* Meadow scene banner */}
          <div className="h-48 sm:h-64 w-full relative">
            <PixelScene variant="meadow" seed={777} />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
            <div className="absolute bottom-4 left-6 sm:left-10 z-10">
              <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-3 py-1 rounded-full uppercase tracking-wider block mb-1">
                shared memory
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-text lowercase">
                pip remembers.
              </h2>
            </div>
          </div>

          {/* 3 Memory Panels */}
          <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Panel 1: Profile Sources */}
            <div className="panel-soft p-5 bg-[#FBFAF7] border border-[#ECEAE4]">
              <span className="font-pixel text-[11px] text-pip-ink uppercase tracking-wider block mb-2">
                1. profile sources
              </span>
              <h3 className="text-sm font-semibold text-text mb-2">
                verified project evidence
              </h3>
              <p className="text-xs text-muted leading-relaxed mb-3">
                pip connects to your actual GitHub PRs, telemetry logs, and release metrics so bullet points never fabricate numbers.
              </p>
              <div className="p-2.5 rounded bg-white border border-[#ECEAE4] text-[11px] font-pixel text-pip-ink">
                • 4 squads adopted shared UI components
                <br />• ₹14Cr+ monthly payment disbursements
              </div>
            </div>

            {/* Panel 2: Interview Weak Spots */}
            <div className="panel-soft p-5 bg-[#FBFAF7] border border-[#ECEAE4]">
              <span className="font-pixel text-[11px] text-[#A45564] uppercase tracking-wider block mb-2">
                2. interview weak spots
              </span>
              <h3 className="text-sm font-semibold text-text mb-2">
                real answer coaching
              </h3>
              <p className="text-xs text-muted leading-relaxed mb-3">
                when you hesitate on web vitals or state machines in mock rounds, pip flags it with quoted evidence and retrains you.
              </p>
              <div className="p-2.5 rounded bg-white border border-[#ECEAE4] text-[11px] font-pixel text-[#A45564]">
                • flagged: INP input delay explanation
                <br />• practice: scheduler.yield() code pattern
              </div>
            </div>

            {/* Panel 3: Gaps This Week */}
            <div className="panel-soft p-5 bg-[#FBFAF7] border border-[#ECEAE4]">
              <span className="font-pixel text-[11px] text-[#8B6B45] uppercase tracking-wider block mb-2">
                3. gaps this week
              </span>
              <h3 className="text-sm font-semibold text-text mb-2">
                targeted weekly plan
              </h3>
              <p className="text-xs text-muted leading-relaxed mb-3">
                gaps are ranked by how often they show up across your active job targets, so you only learn what gets you interviews.
              </p>
              <div className="p-2.5 rounded bg-white border border-[#ECEAE4] text-[11px] font-pixel text-[#8B6B45]">
                • 5 jobs need playwright testing
                <br />• 3 jobs need WebSocket sync
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4 Steps ─── */}
      <section id="how" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
          how it works
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text lowercase mb-12">
          four steps to getting hired as yourself.
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {[
            {
              step: "01",
              title: "paste any job link",
              desc: "paste a link from linkedin, naukri, or company careers page. pip extracts hard requirements and company context.",
            },
            {
              step: "02",
              title: "pip matches your work",
              desc: "pip audits your profile, highlights authentic matches, and strikes lines that fail modern ats screening.",
            },
            {
              step: "03",
              title: "accept edits & practice",
              desc: "review tracked bullet edits on a clean paper doc, then practice answering technical questions with live rubric scores.",
            },
            {
              step: "04",
              title: "track pipeline to offer",
              desc: "send targeted cold emails and watch your dashboard sky progress from dawn to night with stars when the offer arrives.",
            },
          ].map((item, idx) => (
            <div key={idx} className="panel-cozy p-6 bg-white border border-[#ECEAE4]">
              <span className="font-pixel text-xl font-bold text-pip block mb-3">
                {item.step}
              </span>
              <h3 className="font-semibold text-sm text-text lowercase mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Questions (FAQ) ─── */}
      <section id="faq" className="py-20 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
            clear answers
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text lowercase">
            frequently asked questions.
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="panel-cozy bg-white border border-[#ECEAE4] overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-medium text-sm text-text hover:text-pip transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted transition-transform shrink-0 ${
                    openFaq === idx ? "rotate-180 text-pip" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs text-muted leading-relaxed border-t border-[#ECEAE4]/60">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Dusk Closing Scene "Meet Pip" ─── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-[24px] overflow-hidden border border-[#ECEAE4] shadow-md relative bg-[#1C162E] text-white">
          <div className="h-72 sm:h-80 w-full relative">
            <PixelScene variant="dusk" seed={888} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C162E] via-[#1C162E]/40 to-transparent" />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm p-1.5 border border-white/20 mb-3 pip-hop">
                <Image
                  src="/pip/pip-coffee.svg"
                  alt="pip"
                  width={40}
                  height={40}
                  style={{ imageRendering: "pixelated" }}
                  unoptimized
                />
              </div>

              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight lowercase mb-3" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                meet pip.
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-md mx-auto mb-6" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
                ready to land your next tech role as yourself? no hype words, no generic templates.
              </p>

              <Link
                href="/dashboard"
                className="btn-pill-pip text-sm py-2.5 px-7 shadow-lg"
              >
                start free with pip
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#ECEAE4] bg-white py-12 px-4 sm:px-6 text-xs text-muted">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-pip-soft flex items-center justify-center p-0.5">
              <Image
                src="/pip/pip-coffee.svg"
                alt="pip"
                width={18}
                height={18}
                style={{ imageRendering: "pixelated" }}
                unoptimized
              />
            </div>
            <span className="font-semibold text-text">ascendai</span>
            <span>•</span>
            <span className="font-pixel text-[11px] text-pip-ink">
              pip by stick it up (mit)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/tools/resume" className="hover:text-text transition">resume builder</Link>
            <Link href="/tools/interview" className="hover:text-text transition">interview prep</Link>
            <Link href="/tools/cover-letter" className="hover:text-text transition">cover letter</Link>
            <Link href="/tools/cold-email" className="hover:text-text transition">cold email</Link>
            <Link href="/tools/roadmap" className="hover:text-text transition">career roadmap</Link>
            <Link href="/tools/ats" className="hover:text-text transition">ats scanner</Link>
          </div>

          <div>
            <span>built with care for tech job seekers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
