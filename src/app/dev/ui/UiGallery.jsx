"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import PixelScene, { PIXEL_SCENE_VARIANTS } from "@/components/ui/PixelScene";
import AppWindow from "@/components/ui/AppWindow";
import StepCaption from "@/components/ui/StepCaption";
import PipAvatar, { PIP_OUTFITS } from "@/components/ui/PipAvatar";
import PipStatus from "@/components/ui/PipStatus";
import { Chip, ChipList } from "@/components/ui/Chip";
import ProgressRing from "@/components/ui/ProgressRing";
import BotStepList from "@/components/ui/BotStepList";
import TrackedChangeDoc from "@/components/ui/TrackedChangeDoc";
import KanbanBoard from "@/components/ui/KanbanBoard";
import UndoToast from "@/components/ui/UndoToast";
import Confetti from "@/components/ui/Confetti";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";

const TOKENS = ["bg", "panel", "soft", "line", "text", "muted", "faint", "brand", "brand-soft", "brand-ink", "warn-soft", "warn-ink", "gap-soft", "gap-ink", "ink"];

const LINES = [
  { id: "a", kind: "keep", text: "Built a typed API layer over 22 REST endpoints, removing a class of runtime errors.", hl: "Built a typed API layer over 22 REST endpoints" },
  { id: "b", kind: "change", before: "Worked on improving dashboard performance.", after: "Cut dashboard load from 3.8s to 1.1s by code-splitting routes", source: { n: 1, text: "from your project: dashboard rebuild, resume line 4" } },
  { id: "c", kind: "keep", text: "React + Next.js app with AI agents and a searchable profile store." },
];

const COLS = [
  { id: "saved", title: "saved" },
  { id: "applied", title: "applied" },
  { id: "interviewing", title: "interviewing" },
  { id: "offer", title: "offer" },
];

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-line pb-2 font-pixel text-lg text-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function UiGallery() {
  const [skills, setSkills] = useState(["react", "typescript", "next.js", "sql"]);
  const [ring, setRing] = useState(72);
  const [cards, setCards] = useState([
    { id: "1", col: "saved", title: "CRED", sub: "frontend engineer" },
    { id: "2", col: "applied", title: "Meesho", sub: "frontend intern" },
    { id: "3", col: "applied", title: "Razorpay", sub: "frontend engineer", badge: { text: "quiet 5 days", tone: "warn" } },
    { id: "4", col: "interviewing", title: "Zerodha", sub: "round 2" },
  ]);
  const [toast, setToast] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [docKey, setDocKey] = useState(0);
  const steps = [
    { id: "1", label: "checker", detail: "scoring the match", status: "done", result: "86% match" },
    { id: "2", label: "tailor", detail: "writing your resume", status: "running" },
    { id: "3", label: "writer", detail: "drafting the cover letter", status: "waiting" },
    { id: "4", label: "connector", detail: "writing outreach", status: "waiting" },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-8">
      <header>
        <h1 className="font-pixel text-4xl">ui gallery</h1>
        <p className="mt-1 text-muted">dev only. every component and state.</p>
      </header>

      <Section title="tokens">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {TOKENS.map((t) => (
            <div key={t} className="rounded-[14px] border border-line p-2 text-xs">
              <div className="h-10 rounded-[9px] border border-line" style={{ background: `var(--${t})` }} />
              <p className="mt-1 text-muted">{t}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ink">primary</Button>
          <Button variant="outline">secondary</Button>
          <span className="font-doc text-2xl">newsreader doc</span>
          <span className="font-pixel text-2xl">pixelify label</span>
          <span className="text-2xl">geist body</span>
        </div>
      </Section>

      <Section title="pixel scene (9 variants)">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {PIXEL_SCENE_VARIANTS.map((v) => (
            <figure key={v} className="overflow-hidden rounded-[18px] border border-line">
              <div className="h-36"><PixelScene variant={v} seed={11} /></div>
              <figcaption className="px-3 py-1.5 font-pixel text-xs text-muted">{v}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section title="app window + step caption">
        <div className="relative overflow-hidden rounded-[20px] p-4 sm:p-8">
          <div className="absolute inset-0"><PixelScene variant="lemon" seed={3} /></div>
          <div className="relative space-y-4">
            <StepCaption n={4}>you review. every line has a source.</StepCaption>
            <AppWindow title="ascendai · needs you (3)">
              <p className="font-doc text-muted">window body</p>
            </AppWindow>
          </div>
        </div>
      </Section>

      <Section title="pip avatar + status">
        <div className="flex flex-wrap items-end gap-6">
          {PIP_OUTFITS.map((o) => (
            <div key={o} className="text-center">
              <PipAvatar outfit={o} size="xl" working />
              <p className="font-pixel text-xs text-muted">{o}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-6">
          <PipStatus outfit="detective" text="reading the job…" />
          <PipStatus outfit="coffee" working={false} text="done. your turn" />
        </div>
      </Section>

      <Section title="chips (click to edit, x remove, + add)">
        <ChipList values={skills} onChange={setSkills} addLabel="add skill" />
        <div className="flex flex-wrap gap-2">
          <Chip value="have" tone="brand" editable={false} />
          <Chip value="partial" tone="warn" editable={false} />
          <Chip value="gap → roadmap" tone="gap" editable={false} />
        </div>
      </Section>

      <Section title="progress ring">
        <div className="flex items-center gap-4">
          <ProgressRing value={ring} />
          <Button variant="outline" size="sm" onClick={() => setRing((r) => (r >= 100 ? 0 : r + 25))}>+25</Button>
        </div>
      </Section>

      <Section title="bot step list">
        <div className="rounded-[20px] border border-line bg-panel px-5">
          <BotStepList steps={steps} />
        </div>
      </Section>

      <Section title="tracked change doc">
        <div className="rounded-[20px] border border-line bg-panel p-6">
          <TrackedChangeDoc key={docKey} title="Shivansh Saxena" subtitle="resume v1 · for razorpay · frontend engineer" lines={LINES} />
          <Button variant="outline" size="sm" className="mt-6" onClick={() => setDocKey((k) => k + 1)}>replay</Button>
        </div>
      </Section>

      <Section title="kanban (drag, or tap a card then a column)">
        <KanbanBoard
          columns={COLS}
          cards={cards}
          onMove={(id, to) => {
            setCards((cs) => cs.map((c) => (c.id === id ? { ...c, col: to } : c)));
            setToast(true);
          }}
        />
      </Section>

      <Section title="undo toast + confetti">
        <div className="relative h-40 overflow-hidden rounded-[20px] border border-line">
          <Confetti key={confetti} active={confetti > 0} />
          <div className="relative flex h-full items-center justify-center gap-3">
            <Button variant="ink" onClick={() => setToast(true)}>show toast</Button>
            <Button variant="outline" onClick={() => setConfetti((c) => c + 1)}>confetti</Button>
          </div>
        </div>
        <UndoToast open={toast} message="3 edits accepted · nothing sent yet" onUndo={() => {}} onClose={() => setToast(false)} />
      </Section>

      <Section title="states: loading, empty, error">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3 rounded-[20px] border border-line bg-panel p-5">
            <PipStatus outfit="detective" text="loading…" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <EmptyState outfit="coffee" title="nothing here yet" text="paste a job link to start." action={<Button variant="ink">paste a job</Button>} />
          <EmptyState outfit="thinking" title="that did not work" text="check your connection and try again." action={<Button variant="outline">retry</Button>} />
        </div>
      </Section>
    </main>
  );
}
