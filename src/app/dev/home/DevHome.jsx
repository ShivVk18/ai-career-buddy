"use client";

import AppSidebar from "@/components/shared/AppSidebar";
import DashboardView from "@/app/(main)/(gated)/dashboard/_component/DashboardView";

const NOW = Date.now();
const iso = (mins) => new Date(NOW - mins * 60000).toISOString();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const app = (id, status, company, title, bot, nextAction) => ({
  id: `a${id}`,
  status,
  job: { id: `j${id}`, company, title, location: "bengaluru", url: null },
  appliedAt: null,
  interviewAt: null,
  prepSessionId: null,
  nextActionAt: null,
  nextAction,
  updatedAt: iso(id * 90),
  bot,
});

const SEEDED = {
  stage: "noon",
  needsYou: {
    count: 2,
    items: [
      { id: "n1", title: "review the razorpay packet", company: "razorpay", jobTitle: "frontend engineer", href: "/jobs/j1", dueAt: null },
      { id: "n2", title: "follow up with meesho", company: "meesho", jobTitle: "sde 1", href: "/jobs/j2", dueAt: iso(60) },
    ],
  },
  applications: [
    app(1, "SAVED", "razorpay", "frontend engineer", { state: "needs_you", step: "writer", completedCount: 3, total: 4 }, { label: "review packet", href: "/jobs/j1" }),
    app(2, "APPLIED", "meesho", "sde 1", { state: "done", step: null, completedCount: 4, total: 4 }, { label: "send follow-up", href: "/jobs/j2" }),
    app(3, "INTERVIEWING", "cred", "ui engineer", { state: "done", step: null, completedCount: 4, total: 4 }, { label: "prep for interview", href: "/jobs/j3" }),
    app(4, "SAVED", "groww", "web developer", { state: "running", step: "tailor", completedCount: 1, total: 4 }, { label: "see progress", href: "/jobs/j4" }),
  ],
  tasks: [
    { roadmapId: "r1", roadmapTitle: "frontend developer", stepId: 1, title: "build one project with react server components", href: "/roadmap/r1" },
    { roadmapId: "r1", roadmapTitle: "frontend developer", stepId: 2, title: "practice two system design questions", href: "/roadmap/r1" },
  ],
  bots: {
    running: 1,
    failed: 0,
    needsYou: 1,
    done: 2,
    items: [
      { applicationId: "a4", company: "groww", title: "web developer", state: "running", step: "tailor", completedCount: 1, total: 4 },
      { applicationId: "a1", company: "razorpay", title: "frontend engineer", state: "needs_you", step: "writer", completedCount: 3, total: 4 },
      { applicationId: "a2", company: "meesho", title: "sde 1", state: "done", step: null, completedCount: 4, total: 4 },
    ],
  },
  unreadNotifications: 2,
  generatedAt: iso(0),
};
const EMPTY = { stage: "dawn", needsYou: { count: 0, items: [] }, applications: [], tasks: [], bots: { running: 0, failed: 0, needsYou: 0, done: 0, items: [] }, unreadNotifications: 0, generatedAt: iso(0) };

export default function DevHome({ mode }) {
  const data = mode === "empty" ? EMPTY : SEEDED;
  const actions = {
    getHomeState: async () => {
      if (mode === "loading") await wait(60 * 60000);
      if (mode === "error") return { error: "mock failure", code: "FAILED" };
      return data;
    },
    startIntake: async ({ input }) => {
      await wait(1500);
      if (!/^https?:\/\//.test(input)) return { kind: "question", text: input };
      return {
        kind: "job",
        jobId: "j9",
        applicationId: "a9",
        job: { id: "j9" },
        notice: null,
        chips: { company: "razorpay", role: "frontend engineer", location: "bengaluru", requirementCount: 14 },
      };
    },
    getDashboardData: async () => ({
      targets: mode === "empty" ? [] : [
        { key: "t1", company: "swiggy", role: "frontend developer", lastActivityAt: iso(300), ats: { score: 72, href: "/resume-parser" }, coverLetter: null, coldEmail: null },
        { key: "t2", company: "zerodha", role: "ui engineer", lastActivityAt: iso(900), ats: null, coverLetter: { href: "/cover-letter" }, coldEmail: null },
      ],
      totalTargets: mode === "empty" ? 0 : 2,
      dueFollowUps: mode === "empty" ? [] : [{ id: "f1", company: "zomato", role: "sde 1", recipientName: "priya", subject: "frontend role", followUpAt: iso(60), href: "/cold-email/f1" }],
    }),
    retryPipeline: async () => ({ started: true }),
  };
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text md:h-screen md:flex-row md:overflow-hidden">
      <AppSidebar demo={{ name: "shivansh", needsCount: data.needsYou.count, notifications: { unreadCount: 0, items: [] } }} />
      <main className="min-w-0 flex-1 overflow-y-auto pb-20 md:pb-8">
        <DashboardView actions={actions} initialData={mode === "loading" || mode === "error" ? null : data} name="shivansh" />
      </main>
    </div>
  );
}
