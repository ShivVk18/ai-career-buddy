"use client";

import React, { useState } from "react";
import Link from "next/link";
import PipStatus from "@/components/pixel/PipStatus";
import { MOCK_JOBS, MOCK_PROFILE } from "@/lib/mock";
import {
  Mail,
  Copy,
  ExternalLink,
  Calendar,
  Sparkles,
  Clock,
  ArrowRight,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export default function ColdEmailToolPage() {
  const [selectedJobId, setSelectedJobId] = useState("job-zomato");
  const [recipientName, setRecipientName] = useState("Karan Verma");
  const [recipientRole, setRecipientRole] = useState("Engineering Director (Frontend)");
  const [recipientEmail, setRecipientEmail] = useState("karan.v@zomato.com");
  const [subject, setSubject] = useState("Frontend Engineer (Next.js 15 / Web Vitals) — Aarav Sharma");
  const [followUpDays, setFollowUpDays] = useState(3);

  const selectedJob = MOCK_JOBS.find((j) => j.id === selectedJobId) || MOCK_JOBS[0];

  const emailBody = `Hi ${recipientName.split(" ")[0]},

Saw your team is scaling Zomato's web surfaces and dining-out flow.

At KredX, I architected merchant dashboards in Next.js 15, dropping LCP from 3.2s to 1.1s and boosting daily throughput by 28%. Prior to that at UrbanPiper, I built optimistic WebSocket state sync for live restaurant menus across 2,400+ kitchens.

I'd love to contribute to Zomato's core web vitals and mobile-web checkout speed. Would you be open to a 10-minute chat this Thursday at 4 PM?

Best,
${MOCK_PROFILE.name}
${MOCK_PROFILE.github}`;

  const wordCount = emailBody.trim().split(/\s+/).length;
  const isUnderLimit = wordCount <= 120;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${emailBody}`);
    toast.success("cold email copied to clipboard!");
  };

  const handleOpenMail = () => {
    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
    toast.success("opening mail client…");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-0.5 rounded-full font-medium">
              tool 04 • cold email
            </span>
            <span className="text-xs text-muted">/tools/cold-email</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text lowercase">
            concise cold outreach (&lt;120 words)
          </h1>
        </div>

        {/* Target Job Selector */}
        <div className="flex items-center gap-2 bg-[#FBFAF7] border border-[#ECEAE4] px-3.5 py-1.5 rounded-full text-xs max-w-full min-w-0">
          <span className="font-pixel text-[11px] text-muted shrink-0">target company:</span>
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
        {/* Center: Work Area (Recipient Fields + Preview + Word Counter + Actions) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Recipient Form Fields */}
          <div className="panel-cozy p-5 bg-white border border-[#ECEAE4] space-y-3">
            <span className="font-pixel text-xs text-muted uppercase block border-b border-[#ECEAE4] pb-2">
              recipient details (pasted by you)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-text block mb-1">
                  recipient name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#ECEAE4] bg-[#FBFAF7] focus:bg-white focus:border-pip outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-text block mb-1">
                  their role / title
                </label>
                <input
                  type="text"
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#ECEAE4] bg-[#FBFAF7] focus:bg-white focus:border-pip outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-text block mb-1">
                  email address
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#ECEAE4] bg-[#FBFAF7] focus:bg-white focus:border-pip outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-text block mb-1">
                subject line (curated for 65%+ open rate)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#ECEAE4] bg-[#FBFAF7] focus:bg-white focus:border-pip outline-none font-medium"
              />
            </div>
          </div>

          {/* Email Preview Card */}
          <div className="panel-cozy p-6 bg-white border border-[#ECEAE4] space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#ECEAE4] pb-3">
              <span className="font-pixel text-[11px] text-pip-ink bg-pip-soft px-2.5 py-0.5 rounded-full">
                email preview • to: {recipientEmail}
              </span>

              {/* Strict <120 Word Counter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">length:</span>
                <span
                  className={`font-pixel text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    isUnderLimit
                      ? "bg-pip-soft text-pip-ink border border-pip/30"
                      : "bg-[#FFF0F0] text-[#A45564] border border-[#FBD5D5]"
                  }`}
                >
                  {wordCount} / 120 words {isUnderLimit ? "✓ perfect" : "⚠ too long"}
                </span>
              </div>
            </div>

            {/* Email Body with Matched Project Highlighted */}
            <div className="p-4 rounded-xl bg-[#FBFAF7] border border-[#ECEAE4] font-sans text-xs sm:text-sm text-text leading-relaxed whitespace-pre-wrap">
              {emailBody.split("UrbanPiper").map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="highlight-match">
                      UrbanPiper (2,400+ kitchens WebSocket sync)
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Follow-up Reminder Picker */}
            <div className="p-3 bg-[#FBFAF7] rounded-lg border border-[#ECEAE4] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text">
                <Calendar className="w-4 h-4 text-pip" />
                <span>follow-up reminder:</span>
                <select
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(Number(e.target.value))}
                  className="bg-white border border-[#ECEAE4] rounded px-2 py-1 text-xs font-medium outline-none cursor-pointer"
                >
                  <option value={2}>in 2 days (fast)</option>
                  <option value={3}>in 3 days (recommended)</option>
                  <option value={5}>in 5 days (patient)</option>
                </select>
              </div>
              <span className="font-pixel text-[11px] text-muted">
                pip will notify your dashboard if no response
              </span>
            </div>

            {/* Action Buttons: Copy / Open in Mail */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handleCopy}
                className="btn-pill-secondary text-xs py-2 px-5 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> copy email text
              </button>

              <button
                onClick={handleOpenMail}
                className="btn-pill-pip text-xs py-2 px-6 flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> open in mail client
              </button>
            </div>
          </div>
        </div>

        {/* Right: Pip's Notes + Outreach Rules */}
        <div className="lg:col-span-4 space-y-5">
          <PipStatus
            step="rocket"
            text="pip strictly caps emails under 120 words. engineering directors read emails on their phones in 15 seconds."
            size="md"
            className="w-full"
          />

          <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4]">
            <span className="font-pixel text-xs text-muted uppercase block mb-3 border-b border-[#ECEAE4] pb-2">
              pip cold outreach rules
            </span>
            <ul className="space-y-2.5 text-xs text-text">
              <li className="flex items-start gap-2">
                <span className="font-pixel text-pip-ink font-bold mt-0.5">1.</span>
                <span>No "I hope this finds you well". Start with the exact problem their team faces.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-pixel text-pip-ink font-bold mt-0.5">2.</span>
                <span>Cite 1 measurable metric from your past work (LCP 1.1s, 2,400+ kitchens).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-pixel text-pip-ink font-bold mt-0.5">3.</span>
                <span>Close with a specific, frictionless call-to-action (10 min chat on Thursday).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
