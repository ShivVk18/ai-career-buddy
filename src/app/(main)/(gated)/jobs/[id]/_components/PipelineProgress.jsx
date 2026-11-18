"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, Loader2, RotateCw, ChevronRight } from "lucide-react";
import { generationErrorMessage } from "@/components/shared/generationError";

const STEPS = {
  CHECKER: { name: "Checker", outfit: "detective", doing: "reading the job and checking your match", done: "match checked" },
  TAILOR: { name: "Tailor", outfit: "thinking", doing: "suggesting resume edits for this job", done: "resume edits ready" },
  WRITER: { name: "Writer", outfit: "wizard", doing: "writing your cover letter", done: "cover letter drafted" },
  CONNECTOR: { name: "Connector", outfit: "rocket", doing: "drafting an outreach email (no recipient, nothing sent)", done: "email drafted" },
};

function outputLink(s) {
  const ids = s.ids || {};
  switch (s.step) {
    case "CHECKER":
      return { href: "/resume-parser", label: "See ATS result" };
    case "TAILOR":
      return ids.draftId
        ? { href: `/needs-you?item=${encodeURIComponent(`TAILOR_DRAFT:${ids.draftId}`)}`, label: s.needsYou ? "Review edits" : "Open edits" }
        : null;
    case "WRITER":
      return ids.coverLetterId ? { href: `/cover-letter/${ids.coverLetterId}`, label: s.needsYou ? "Review letter" : "Open letter" } : null;
    case "CONNECTOR":
      return ids.coldEmailId ? { href: `/cold-email/${ids.coldEmailId}`, label: s.needsYou ? "Review email" : "Open email" } : null;
    default:
      return null;
  }
}

function summary(s) {
  if (s.step === "CHECKER" && s.output) {
    const bits = [];
    if (typeof s.output.matchPercent === "number") bits.push(`${s.output.matchPercent}% match`);
    if (typeof s.output.atsScore === "number") bits.push(`ATS ${s.output.atsScore}/100`);
    return bits.join(" • ");
  }
  if (s.step === "TAILOR" && s.output && typeof s.output.proposalCount === "number") {
    return `${s.output.proposalCount} suggested edit${s.output.proposalCount === 1 ? "" : "s"}`;
  }
  return "";
}

export default function PipelineProgress({ pipeline, driving, callError, onRetry }) {
  if (!pipeline) return null;
  const waiting = driving && pipeline.busy;
  const total = pipeline.steps.length;

  return (
    <section aria-label="Pipeline progress" className="panel-cozy border border-line bg-white p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-base text-text lowercase">pip is on it</h2>
        <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-1 rounded-full" aria-live="polite">
          {pipeline.completedCount}/{total} {pipeline.complete ? "done" : "steps"}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={pipeline.completedCount}
        className="h-1.5 w-full rounded-full bg-soft overflow-hidden"
      >
        <div className="h-full bg-pip transition-all duration-500" style={{ width: `${(pipeline.completedCount / total) * 100}%` }} />
      </div>

      <ol className="space-y-2.5">
        {pipeline.steps.map((s) => {
          const meta = STEPS[s.step];
          const active = driving && pipeline.next === s.step && s.status !== "done" && s.status !== "skipped";
          const link = s.status === "done" ? outputLink(s) : null;
          const failed = s.status === "failed" && !active;
          return (
            <li
              key={s.step}
              className={`flex items-start gap-3 rounded-xl border p-3 ${
                active ? "border-pip bg-pip-soft/50" : failed ? "border-[#E8C9C0] bg-[#FDF3F0]" : "border-line bg-[#FBFAF7]/40"
              }`}
            >
              <div className={`relative h-10 w-10 shrink-0 ${active ? "pip-hop" : s.status === "pending" ? "opacity-40 grayscale" : ""}`}>
                <Image
                  src={`/pip/pip-${meta.outfit}.svg`}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                  style={{ imageRendering: "pixelated" }}
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-text">{meta.name}</span>
                  {s.status === "done" && <Check className="h-4 w-4 text-pip" aria-label="done" />}
                  {active && <Loader2 className="h-4 w-4 animate-spin text-pip" aria-label="working" />}
                </div>
                <p className="text-xs text-muted">
                  {active
                    ? waiting
                      ? "another tab is working on this step. waiting…"
                      : `${meta.doing}…`
                    : s.status === "done"
                      ? [meta.done, summary(s)].filter(Boolean).join(" • ")
                      : s.status === "skipped"
                        ? s.reason === "NO_RESUME"
                          ? "skipped: add your resume to see your match"
                          : `skipped${s.reason ? `: ${s.reason.toLowerCase().replace(/_/g, " ")}` : ""}`
                        : failed
                          ? generationErrorMessage(s.error ? { code: s.error.code, error: s.error.error } : null, "This step failed.")
                          : "waiting"}
                </p>
                {s.status === "skipped" && s.reason === "NO_RESUME" && (
                  <Link href="/resume" className="mt-1 inline-flex min-h-8 items-center text-xs text-pip-ink underline rounded focus-visible:ring-2 focus-visible:ring-pip/50">
                    add your resume
                  </Link>
                )}
                {failed && !driving && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs text-text hover:border-pip focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95"
                  >
                    <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
                  </button>
                )}
              </div>
              {link && (
                <Link
                  href={link.href}
                  className="shrink-0 inline-flex min-h-9 items-center gap-1 rounded-full bg-white border border-line px-3 text-xs text-text hover:border-pip focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95"
                >
                  {link.label} <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {callError && !driving && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8C9C0] bg-[#FDF3F0] px-4 py-3 text-xs text-text">
          <span className="min-w-0 flex-1">{callError}</span>
          <button type="button" onClick={onRetry} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 hover:border-pip active:scale-95">
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
          </button>
        </div>
      )}
      {pipeline.complete && (
        <p className="text-xs text-muted">
          All done. Everything pip drafted waits in <Link href="/needs-you" className="underline">needs you</Link> for your ok. Nothing is sent.
        </p>
      )}
    </section>
  );
}
