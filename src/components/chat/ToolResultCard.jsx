"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Check, MapPin } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

// Cards are built on the server from the signed-in user's own records.
// Shapes: docs/ai/API-CONTRACT.md section 3. Known: ats_score, cover_letter, cold_email, roadmap, assessment.
// Also read (when the server sends them): job, edit_summary, task, roadmap_item. Unknown types render as plain text.
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
    case "job":
    case "job_card":
      return <JobCard data={data} />;
    case "edit_summary":
    case "resume_edit":
      return <EditSummaryCard data={data} />;
    case "task":
      return <TaskCard data={data} />;
    case "roadmap_item":
    case "roadmap_task":
      return <RoadmapItemCard data={data} />;
    default:
      return <PlainCard type={type} data={data} />;
  }
}

const str = (v) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

// Unknown card: show only readable text, never raw JSON.
function PlainCard({ type, data }) {
  const text = [data.title, data.summary, data.text, data.message, data.description].map(str).filter(Boolean).join(" · ");
  if (!text) return null;
  return (
    <Shell label={str(type).replace(/_/g, " ") || "note"} date={formatDate(data.createdAt)} href={safeHref(data.href)} linkText="open">
      <p className="text-sm text-text">{text}</p>
    </Shell>
  );
}

const safeHref = (h) => (typeof h === "string" && h.startsWith("/") && !h.startsWith("//") ? h : undefined);

function JobCard({ data }) {
  const role = str(data.role || data.title);
  const chips = Array.isArray(data.chips) ? data.chips : [];
  return (
    <Shell label="job" date={formatDate(data.createdAt)} href={safeHref(data.href) || (data.recordId ? `/jobs/${data.recordId}` : undefined)} linkText="open job">
      <span className="block text-sm font-medium text-text">{[data.company, role].map(str).filter(Boolean).join(" · ") || "untitled job"}</span>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {data.location && (
          <span className="inline-flex h-7 items-center gap-1 rounded-[9px] bg-soft px-2.5 text-xs text-text">
            <MapPin className="size-3" aria-hidden="true" /> {str(data.location)}
          </span>
        )}
        {data.status && <Chip tone="brand" editable={false} value={str(data.status).toLowerCase()} className="h-7 text-xs" />}
        {typeof data.requirementCount === "number" && <Chip editable={false} value={`${data.requirementCount} requirements`} className="h-7 text-xs" />}
        {chips.slice(0, 4).map((c, i) => (
          <Chip key={i} editable={false} value={[c.label, c.value].map(str).filter(Boolean).join(" ")} className="h-7 text-xs" tone={c.tone === "bad" ? "gap" : c.tone === "warn" ? "warn" : c.tone === "good" ? "brand" : "neutral"} />
        ))}
      </div>
    </Shell>
  );
}

function EditSummaryCard({ data }) {
  const edits = Array.isArray(data.edits) ? data.edits.slice(0, 3) : [];
  const count = typeof data.count === "number" ? data.count : edits.length;
  return (
    <Shell label="edit summary" date={formatDate(data.createdAt)} href={safeHref(data.href)} linkText="review edits">
      <span className="block text-sm font-medium text-text">{str(data.title) || `${count} edit${count === 1 ? "" : "s"}`}</span>
      {data.summary && <p className="mt-1 text-xs text-muted">{str(data.summary)}</p>}
      {edits.map((e, i) => (
        <div key={i} className="mt-2 rounded-[9px] bg-soft p-2.5 text-xs">
          {e.before && <p className="text-faint line-through">{str(e.before)}</p>}
          {e.after && <p className="text-text">{str(e.after)}</p>}
        </div>
      ))}
    </Shell>
  );
}

function TaskCard({ data }) {
  const due = formatDate(data.dueAt);
  return (
    <Shell label="task" date={formatDate(data.createdAt)} href={safeHref(data.href)} linkText="open">
      <div className="flex items-start gap-2.5">
        <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border", data.done ? "border-brand bg-brand text-white" : "border-line")} aria-hidden="true">
          {data.done && <Check className="size-3.5" />}
        </span>
        <div className="min-w-0">
          <span className={cn("block text-sm text-text", data.done && "line-through opacity-70")}>{str(data.title)}</span>
          {data.note && <p className="mt-0.5 text-xs text-muted">{str(data.note)}</p>}
          {due && (
            <span className="mt-1.5 inline-flex h-7 items-center gap-1 rounded-[9px] bg-warn-soft px-2.5 text-xs text-warn-ink">
              <Calendar className="size-3" aria-hidden="true" /> due {due}
            </span>
          )}
        </div>
      </div>
    </Shell>
  );
}

function RoadmapItemCard({ data }) {
  return (
    <Shell label="roadmap step" date={formatDate(data.createdAt)} href={safeHref(data.href)} linkText="open roadmap">
      <span className="block text-sm font-medium text-text">{str(data.title)}</span>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {data.roadmapTitle && <Chip editable={false} value={str(data.roadmapTitle)} className="h-7 text-xs" />}
        <Chip tone={data.done || data.completed ? "brand" : "neutral"} editable={false} value={data.done || data.completed ? "done" : "to do"} className="h-7 text-xs" />
      </div>
    </Shell>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function Shell({ label, date, children, href, linkText }) {
  return (
    <div className="fade-up my-2 w-full max-w-xl rounded-[20px] border border-line bg-panel p-4 text-left shadow-card sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Chip tone="brand" editable={false} value={label} className="h-7 text-xs" />
        {date && <span className="text-xs text-faint">{date}</span>}
      </div>
      {children}
      {href && (
        <div className="mt-3 flex justify-end border-t border-dashed border-line pt-2">
          <Link href={href} className="inline-flex min-h-10 items-center gap-1 rounded-full px-2 text-sm text-brand-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
            {linkText} <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}

function ATSScoreCard({ data }) {
  const title = [data.company, data.role].filter(Boolean).join(" • ");
  return (
    <Shell label="ats score" date={formatDate(data.createdAt)} href={data.href} linkText="open ats checker">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title && <span className="text-sm font-medium text-text block">{title}</span>}
          {typeof data.matchPercentage === "number" && (
            <span className="text-[11px] text-muted block">{data.matchPercentage}% keyword match</span>
          )}
        </div>
        <span className="font-doc text-3xl text-brand-ink shrink-0">
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
      <span className="text-sm font-medium text-text block">
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
      <span className="text-sm font-medium text-text block">
        {data.currentRole} → {data.targetRole}
      </span>
      <div className="mt-2">
        <div className="h-1.5 rounded-full bg-soft overflow-hidden">
          <div className="h-full bg-brand" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[11px] text-muted block mt-1">
          {data.completedSteps} of {data.totalSteps} steps done
        </span>
      </div>
      {next.length > 0 && (
        <div className="mt-2 space-y-1">
          <span className="text-xs text-faint block">next steps</span>
          {next.map((st) => (
            <div key={st.id} className="text-xs text-text p-2 rounded-[9px] bg-soft">
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
        <span className="text-sm font-medium text-text">{data.category}</span>
        <span className="font-doc text-3xl text-brand-ink shrink-0">
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
