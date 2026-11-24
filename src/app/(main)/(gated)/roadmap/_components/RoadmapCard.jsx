"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Chip } from "@/components/ui/Chip";

const RoadmapCard = ({ roadmap, completed = false }) => {
  const completedSteps = roadmap.steps?.filter((step) => step.completed).length || 0;
  const totalSteps = roadmap.steps?.length || 0;
  const pct = Math.max(0, Math.min(100, Math.round(roadmap.progress || 0)));

  return (
    <div className="rounded-[20px] border border-line bg-panel p-5 shadow-card transition-colors hover:border-brand/60 sm:p-6">
      <h3 className="font-doc text-xl leading-snug text-text">
        {roadmap.currentRole} <span className="text-faint" aria-hidden="true">→</span> <span className="sr-only">to</span> {roadmap.targetRole}
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {roadmap.industry && <Chip editable={false} value={roadmap.industry} />}
        <Chip editable={false} value={roadmap.timeline?.estimatedDuration || "no timeline"} />
        {completed && <Chip tone="brand" editable={false} value="all done" />}
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{completedSteps} of {totalSteps} steps done</span>
          <span className="flex items-center gap-1 font-medium text-text">
            {completed && <CheckCircle className="size-3.5 text-brand-ink" aria-hidden="true" />} {pct}%
          </span>
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="roadmap progress" className="h-1.5 overflow-hidden rounded-full bg-soft">
          <div className="h-full rounded-full bg-brand transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-xs text-faint">{formatDistanceToNow(new Date(roadmap.createdAt), { addSuffix: true })}</span>
        <Link
          href={`/roadmap/${roadmap.id}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm text-text outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring"
        >
          {completed ? "review" : "continue"} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

export default RoadmapCard;
