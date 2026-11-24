"use client";

import { useState } from "react";
import Chip from "@/components/ui/Chip";
import BotStepList from "@/components/ui/BotStepList";
import TrackedChangeDoc from "@/components/ui/TrackedChangeDoc";
import KanbanBoard from "@/components/ui/KanbanBoard";
import AppWindow from "@/components/ui/AppWindow";

export function ChipsMock() {
  const [extra, setExtra] = useState(["intern · northwind 2026"]);
  return (
    <AppWindow title="ascendai · getting to know you">
      <p className="mb-3 font-pixel text-sm text-muted">what pip found · click a chip to fix it</p>
      <div className="flex flex-wrap gap-2">
        {["react", "next.js", "typescript", "postgres"].map((s) => <Chip key={s} editable={false} value={s} tone="brand" />)}
        {extra.map((s, i) => (
          <Chip key={s} value={s} onChange={(v) => setExtra((p) => p.map((x, j) => (j === i ? v : x)))} onRemove={() => setExtra((p) => p.filter((_, j) => j !== i))} />
        ))}
        <Chip editable={false} value="project · sample app" tone="warn" />
      </div>
      <p className="mt-4 text-sm text-muted">sample data. you edit anything pip got wrong before it is used.</p>
    </AppWindow>
  );
}

export function BotsMock() {
  const steps = [
    { id: "check", label: "checker", detail: "match requirements to your profile", status: "done", result: "6 of 9 match", chips: [{ label: "have", value: "6", tone: "good" }, { label: "gap", value: "3", tone: "bad" }] },
    { id: "tailor", label: "tailor", detail: "propose resume edits", status: "done", result: "4 edits" },
    { id: "write", label: "writer", detail: "draft letter and email", status: "running" },
    { id: "prep", label: "connector", detail: "find who to contact", status: "waiting" },
  ];
  return (
    <AppWindow title="ascendai · pip is working">
      <BotStepList steps={steps} />
    </AppWindow>
  );
}

const LINES = [
  { id: "k1", kind: "keep", text: "frontend engineer, three years building web apps." },
  { id: "c1", kind: "change", before: "worked on the dashboard", after: "built the dashboard in react and typescript", source: { n: 1, text: "from your resume, project 2" } },
  { id: "c2", kind: "change", before: "team player with great skills", after: "paired with design on a shared component library", source: { n: 2, text: "from your profile" } },
];

export function ReviewMock() {
  return (
    <AppWindow title="ascendai · needs you">
      <TrackedChangeDoc title="resume, sample" subtitle="for a sample job. hover a source to check it." lines={LINES} animate={false} className="text-base" />
    </AppWindow>
  );
}

const COLS = [
  { id: "SAVED", title: "saved" },
  { id: "APPLIED", title: "applied" },
  { id: "INTERVIEWING", title: "interview" },
];

export function TrackMock() {
  const [cards, setCards] = useState([
    { id: "a", col: "SAVED", title: "product designer", sub: "northwind" },
    { id: "b", col: "APPLIED", title: "frontend engineer", sub: "brightfork", badge: { text: "follow up", tone: "warn" } },
    { id: "c", col: "INTERVIEWING", title: "ux researcher", sub: "lumenly" },
  ]);
  return (
    <AppWindow title="ascendai · applications">
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="sample board">
        <div className="min-w-[420px]">
          <KanbanBoard columns={COLS} cards={cards} onMove={(id, to) => setCards((p) => p.map((c) => (c.id === id ? { ...c, col: to } : c)))} />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">sample cards. drag one, or tap it then tap a column.</p>
    </AppWindow>
  );
}
