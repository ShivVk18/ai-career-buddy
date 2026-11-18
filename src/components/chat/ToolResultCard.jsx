"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GlowCard } from "@/components/ui/aceternity/glow-card";

// Cards are built on the server from the signed-in user's own records.
// Shapes: docs/ai/API-CONTRACT.md section 3. Unknown types render nothing.
export default function ToolResultCard({ type, data }) {
  if (!data) return null;

  switch (type) {
    case "ats_score":
      return <ATSScoreCard data={data} />;
    case "cover_letter":
      return <DocumentCard data={data} label="cover letter" linkText="open cover letter" />;
    case "cold_email":
      return <DocumentCard data={data} label="cold email" linkText="open cold email" />;
    case "roadmap":
      return <RoadmapCard data={data} />;
    case "assessment":
      return <AssessmentCard data={data} />;
    default:
      return null;
  }
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function Shell({ label, date, children, href, linkText }) {
  return (
    <GlowCard className="p-4 sm:p-5 my-2 text-left w-full max-w-xl">
      <div className="flex items-center justify-between border-b border-line pb-2.5 mb-3 gap-2">
        <span className="font-pixel text-[11px] bg-pip-soft text-pip-ink px-2.5 py-0.5 rounded-full font-medium">
          {label}
        </span>
        {date && <span className="text-[10px] text-muted">{date}</span>}
      </div>
      {children}
      {href && (
        <div className="mt-3 pt-2 border-t border-line flex justify-end text-xs">
          <Link href={href} className="text-pip hover:underline flex items-center gap-1 font-medium">
            {linkText} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </GlowCard>
  );
}

function ATSScoreCard({ data }) {
  const title = [data.company, data.role].filter(Boolean).join(" • ");
  return (
    <Shell label="ats score" date={formatDate(data.createdAt)} href={data.href} linkText="open ats checker">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title && <span className="font-sans text-sm font-semibold text-text block">{title}</span>}
          {typeof data.matchPercentage === "number" && (
            <span className="text-[11px] text-muted block">{data.matchPercentage}% keyword match</span>
          )}
        </div>
        <span className="font-pixel text-2xl font-bold text-pip shrink-0">
          {data.score}
          <span className="text-sm font-normal text-muted">/100</span>
        </span>
      </div>
      {data.summary && <p className="mt-2 text-xs text-muted leading-relaxed">{data.summary}</p>}
    </Shell>
  );
}

function DocumentCard({ data, label, linkText }) {
  return (
    <Shell label={label} date={formatDate(data.createdAt)} href={data.href} linkText={linkText}>
      <span className="font-sans text-sm font-semibold text-text block">
        {[data.company, data.role].filter(Boolean).join(" • ")}
      </span>
      {data.status && <span className="text-[11px] text-muted block mt-0.5">status: {data.status}</span>}
    </Shell>
  );
}

function RoadmapCard({ data }) {
  const next = data.nextSteps || [];
  const progress = Math.max(0, Math.min(100, Number(data.progress) || 0));
  return (
    <Shell label="career roadmap" date={formatDate(data.createdAt)} href={data.href} linkText="open roadmap">
      <span className="font-sans text-sm font-semibold text-text block">
        {data.currentRole} → {data.targetRole}
      </span>
      <div className="mt-2">
        <div className="h-1.5 rounded-full bg-line overflow-hidden">
          <div className="h-full bg-pip" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[11px] text-muted block mt-1">
          {data.completedSteps} of {data.totalSteps} steps done
        </span>
      </div>
      {next.length > 0 && (
        <div className="mt-2 space-y-1">
          <span className="font-pixel text-[10px] uppercase text-muted block">next steps</span>
          {next.map((st) => (
            <div key={st.id} className="text-xs text-text p-2 rounded-lg bg-bg border border-line">
              {st.title}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

function AssessmentCard({ data }) {
  return (
    <Shell label="interview quiz" date={formatDate(data.createdAt)} href={data.href} linkText="open interview prep">
      <div className="flex items-start justify-between gap-3">
        <span className="font-sans text-sm font-semibold text-text">{data.category}</span>
        <span className="font-pixel text-2xl font-bold text-pip shrink-0">
          {Math.round(data.score)}
          <span className="text-sm font-normal text-muted">%</span>
        </span>
      </div>
      {data.improvementTip && (
        <p className="mt-2 text-xs text-muted leading-relaxed">{data.improvementTip}</p>
      )}
    </Shell>
  );
}
