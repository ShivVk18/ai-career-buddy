"use client";

import { useMemo, useRef } from "react";
import PipelineProgress from "@/app/(main)/(gated)/jobs/[id]/_components/PipelineProgress";
import usePipelineStatus from "@/app/(main)/(gated)/jobs/[id]/_components/usePipelineStatus";

const META = [
  ["checker", "CHECKER", "Checker"],
  ["tailor", "TAILOR", "Tailor"],
  ["writer", "WRITER", "Writer"],
  ["connector", "CONNECTOR", "Connector"],
];
const DONE_CHIPS = {
  checker: [{ label: "Match", value: "86%", tone: "good" }, { label: "ATS", value: "78", tone: "neutral" }, { label: "Gaps", value: "2", tone: "warn" }],
  tailor: [{ label: "Edits", value: "5", tone: "neutral" }, { label: "Invented", value: "0", tone: "good" }],
  writer: [{ label: "Cover letter", value: "drafted", tone: "good" }],
  connector: [{ label: "Cold email", value: "drafted", tone: "good" }],
};

// phase: number of finished steps (0-4). failedAt: index of a failed step.
function build(phase, failedAt = -1) {
  const steps = META.map(([id, step, label], i) => {
    const failed = i === failedAt;
    const done = i < phase && !failed;
    return {
      id, step, label, task: "", ids: done ? { coverLetterId: "c1", draftId: "d1", coldEmailId: "e1" } : {},
      status: failed ? "failed" : done ? "done" : i === phase ? "running" : "pending",
      chips: done ? DONE_CHIPS[id] : [],
      needsYou: done && id !== "checker",
      error: failed ? { code: "AI_UNAVAILABLE", error: "" } : null,
    };
  });
  const completedCount = steps.filter((s) => s.status === "done").length;
  const run = failedAt >= 0 ? "failed" : phase >= 4 ? "needs_you" : "running";
  return { applicationId: "a1", jobId: "j1", run, completedCount, total: 4, steps };
}

export default function DevBots({ mode }) {
  const polls = useRef(0);
  const fixed = { step1: build(0), step3: build(2), done: build(4), failed: build(2, 2) }[mode];
  const actions = useMemo(
    () => ({
      getPipelineStatus: async () => {
        if (mode === "loading") await new Promise((r) => setTimeout(r, 60 * 60000));
        if (mode === "error") return { error: "mock failure", code: "FAILED" };
        if (fixed) return fixed;
        polls.current += 1;
        return build(Math.min(4, Math.floor(polls.current / 2)));
      },
      retryPipeline: async () => ({ started: true }),
    }),
    [mode, fixed],
  );
  const bots = usePipelineStatus("a1", actions);
  return (
    <main className="mx-auto max-w-5xl space-y-4 bg-bg p-4 text-text sm:p-8">
      
      <PipelineProgress status={bots.status} loading={bots.loading} error={bots.error} retrying={bots.retrying} onRetry={bots.retry} />
    </main>
  );
}
