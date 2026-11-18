"use client";

import { useState } from "react";
import PipStatus from "@/components/pixel/PipStatus";
import ResumePaperDoc from "@/components/shared/ResumePaperDoc";

// All names and figures below are made up for illustration (labelled as a sample in the UI).
const JOBS = {
  northwind: {
    company: "Northwind Pay",
    role: "Frontend Engineer II",
    have: ["React and Next.js", "Web performance", "TypeScript"],
    partial: ["Payment SDK integration"],
    gap: ["Playwright E2E testing"],
    matchRate: 92,
  },
  brightfork: {
    company: "Brightfork",
    role: "Senior UI Engineer",
    have: ["Design systems", "Web performance", "Component architecture"],
    partial: ["Micro-frontends"],
    gap: ["GraphQL federation"],
    matchRate: 86,
  },
  lumenly: {
    company: "Lumenly",
    role: "Frontend Developer",
    have: ["Next.js App Router", "TypeScript", "UI animation"],
    partial: ["Canvas / WebGL"],
    gap: ["Financial security standards"],
    matchRate: 94,
  },
};

function Group({ label, tone, items }) {
  return (
    <div>
      <span className={`mb-2 block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tone}`}>
        {label} ({items.length})
      </span>
      <ul className="space-y-1 text-xs text-text">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SampleDemo() {
  const [active, setActive] = useState("northwind");
  const job = JOBS[active];
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-2 inline-flex items-center rounded-full bg-lime px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-lime-foreground">
            sample - not your data
          </span>
          <p className="text-sm text-muted">Pick a made-up job to see how tracked edits and match breakdowns look. All names and figures are invented.</p>
        </div>
        <div role="tablist" aria-label="Sample jobs" className="flex flex-wrap gap-2">
          {Object.entries(JOBS).map(([key, j]) => (
            <button
              key={key}
              role="tab"
              aria-selected={active === key}
              onClick={() => setActive(key)}
              className={`min-h-9 rounded-full border px-3.5 text-xs font-medium transition ${
                active === key ? "border-primary bg-primary text-primary-foreground" : "border-line bg-panel text-muted hover:text-text"
              }`}
            >
              {j.company}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ResumePaperDoc company={job.company} />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-line bg-panel p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
              <span className="text-xs text-muted">{job.role}</span>
              <span className="text-sm font-semibold text-text">{job.matchRate}% match <span className="font-normal text-muted">(sample)</span></span>
            </div>
            <div className="space-y-4">
              <Group label="strong matches" tone="bg-pip-soft text-pip-ink" items={job.have} />
              <Group label="partial overlaps" tone="bg-soft text-text" items={job.partial} />
              <Group label="gaps" tone="bg-soft text-danger" items={job.gap} />
            </div>
          </div>
          <PipStatus step="thinking" text={`comparing a sample resume with ${job.company}`} size="sm" className="w-full" />
        </div>
      </div>
    </div>
  );
}
