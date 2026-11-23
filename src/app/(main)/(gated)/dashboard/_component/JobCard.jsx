"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";
import PipAvatar from "@/components/ui/PipAvatar";
import Skeleton from "@/components/ui/Skeleton";
import { Chip } from "@/components/ui/Chip";

/**
 * The in-place job card. card = { phase: "reading"|"ready"|"failed", source, jobId, chips, bots:{completedCount,total,run} }.
 * Missing chip values render as skeleton chips (they fill in when the server finishes reading the page).
 */
export default function JobCard({ card, onRetry }) {
  const { chips, bots } = card;
  const company = chips?.company;
  const role = chips?.role;
  const title = role || company ? [role, company].filter(Boolean).join(" · ") : null;
  const reqs = chips?.requirementCount;
  const done = bots?.completedCount ?? 0;
  const total = bots?.total ?? 4;
  const failed = bots?.run === "failed";

  return (
    <div className="fade-up flex items-center gap-4 rounded-[20px] border border-line bg-panel p-4 sm:gap-5 sm:p-6" aria-busy={card.phase === "reading"}>
      <PipAvatar outfit="detective" size="lg" working={card.phase === "reading"} alt="" className="hidden sm:inline-block" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-doc text-xs text-faint">new job · details pulled from the link</p>
        {title ? (
          <h2 className="mt-0.5 break-words text-xl font-bold tracking-tight text-text sm:text-2xl">{title}</h2>
        ) : (
          <Skeleton className="mt-1.5 h-7 w-3/4 max-w-sm" />
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips?.location ? <Chip value={chips.location} editable={false} /> : <Skeleton className="h-8 w-24" />}
          {!company || !role ? <Skeleton className="h-8 w-20" /> : null}
          {chips?.employmentType && <Chip value={chips.employmentType} editable={false} />}
          {chips?.experience && <Chip value={chips.experience} editable={false} />}
          {reqs ? (
            <Chip value={`${reqs} requirement${reqs === 1 ? "" : "s"}`} tone="brand" editable={false} />
          ) : card.phase === "reading" ? (
            <Skeleton className="h-8 w-28" />
          ) : null}
        </div>
        {card.phase !== "reading" && card.jobId && (
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span>{failed ? "a bot hit a snag." : done >= total ? "the bots are done." : `bots working, ${done} of ${total} steps done.`}</span>
            <Link href={`/jobs/${card.jobId}`} className="inline-flex min-h-11 items-center font-medium text-brand-ink underline-offset-4 hover:underline sm:min-h-8">
              see the bots working
            </Link>
            {failed && onRetry && (
              <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-text underline-offset-4 hover:underline sm:min-h-8">
                <RotateCw className="size-3.5" aria-hidden="true" /> retry
              </button>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
