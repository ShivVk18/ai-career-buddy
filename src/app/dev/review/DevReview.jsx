"use client";

import ReviewScreen from "@/components/review/ReviewScreen";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const LINES = [
  { id: "k1", kind: "keep", text: "Built a typed API layer over 22 REST endpoints, removing a class of runtime errors.", hl: "Built a typed API layer over 22 REST endpoints" },
  {
    id: "p1",
    kind: "change",
    before: "Worked on improving dashboard performance.",
    after: "Cut dashboard load from 3.8s to 1.1s by code-splitting routes",
    source: { n: 1, text: "your resume, experience: frontend intern · \"dashboard load 3.8s to 1.1s\" · job description line 4: performance" },
  },
  {
    id: "p2",
    kind: "change",
    before: "Helped with the design system.",
    after: "Shipped 14 shared components used across 3 product surfaces",
    source: { n: 2, text: "your resume, project: component library · job description line 6: design systems" },
  },
  { id: "k2", kind: "keep", text: "React + Next.js app with AI agents and a searchable profile store.", hl: "React + Next.js app with AI agents" },
];

const DATA = {
  title: "Shivansh Saxena",
  subtitle: "resume v1 · for razorpay · frontend engineer",
  wants: "razorpay wants",
  windowTitle: "ascendai · needs you (3)",
  lines: LINES,
  requirements: [
    { id: "r1", label: "react + typescript", status: "have" },
    { id: "r2", label: "performance", status: "have" },
    { id: "r3", label: "design systems", status: "partial" },
    { id: "r4", label: "payments", status: "gap" },
  ],
  invented: 0,
};

export default function DevReview({ mode }) {
  const status = mode === "loading" ? "loading" : mode === "error" ? "error" : "ready";
  const data = mode === "empty" ? { ...DATA, lines: [LINES[0]] } : DATA;
  return (
    <main className="min-h-screen bg-bg text-text">
      <ReviewScreen
        status={status}
        error="the draft expired. tailor again to get fresh edits."
        onRetry={() => {}}
        data={data}
        onCommit={async ({ ids }) => {
          await wait(mode === "slow" ? 1500 : 400);
          return { count: ids.length, undoToken: "mock" };
        }}
        onUndo={async () => {
          await wait(300);
          return { success: true };
        }}
        onAddGap={async () => {
          await wait(500);
          return { success: true };
        }}
      />
    </main>
  );
}
