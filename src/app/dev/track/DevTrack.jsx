"use client";

import { useMemo, useRef } from "react";
import AppSidebar from "@/components/shared/AppSidebar";
import ApplicationsBoard from "@/app/(main)/(gated)/applications/_components/ApplicationsBoard";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const app = (id, status, company, title, extra = {}) => ({
  id: `a${id}`,
  status,
  job: { id: `j${id}`, company, title, location: "bengaluru", url: null },
  appliedAt: null,
  interviewAt: null,
  prepSessionId: null,
  nextActionAt: null,
  nextAction: null,
  quietDays: null,
  isQuiet: false,
  updatedAt: new Date().toISOString(),
  ...extra,
});
const SEED = () => [
  app(1, "SAVED", "CRED", "frontend engineer"),
  app(2, "SAVED", "Razorpay", "frontend engineer"),
  app(3, "APPLIED", "Meesho", "frontend intern", { quietDays: 1 }),
  app(4, "APPLIED", "PhonePe", "ui engineer", { quietDays: 2 }),
  app(5, "APPLIED", "Swiggy", "frontend engineer", { quietDays: 5, isQuiet: true }),
  app(6, "INTERVIEWING", "Zerodha", "round 2"),
];
const DRAFT = {
  id: "FOLLOW_UP_DRAFT:e1",
  type: "FOLLOW_UP_DRAFT",
  company: "Swiggy",
  href: "/cold-email/e1",
  applicationId: "a5",
  draft: { subject: "following up", text: "Hi Priya, since applying I shipped a typed API layer much like your team's. Happy to show it in 15 minutes." },
};

// Mock server: keeps state in memory so moves, mark applied and undo really work.
export default function DevTrack({ mode }) {
  const state = useRef(SEED());
  const tokens = useRef({});
  const actions = useMemo(() => {
    const find = (id) => state.current.find((a) => a.id === id);
    const set = (id, status) => {
      const a = find(id);
      const previousStatus = a.status;
      Object.assign(a, { status, quietDays: status === "APPLIED" ? 0 : null, isQuiet: false });
      const undoToken = `t${Math.random()}`;
      tokens.current[undoToken] = { id, previousStatus };
      return { application: { ...a }, previousStatus, previousInterviewAt: null, undoToken };
    };
    return {
      getApplications: async () => {
        await wait(mode === "loading" ? 60 * 60000 : 250);
        if (mode === "error") return { error: "mock failure", code: "FAILED" };
        return { applications: mode === "empty" ? [] : state.current.map((a) => ({ ...a })) };
      },
      getNeedsYou: async () => ({ count: 1, items: mode === "empty" ? [] : [DRAFT] }),
      markApplied: async (id) => (await wait(300), set(id, "APPLIED")),
      setApplicationStatus: async (id, status) => (await wait(300), set(id, status)),
      undo: async (token) => {
        await wait(200);
        const t = tokens.current[token];
        const a = find(t.id);
        a.status = t.previousStatus;
        a.quietDays = null;
        return { success: true, kind: "status_move", application: { ...a } };
      },
      createInterviewPrep: async () => ({ prepSessionId: "p1" }),
      approveAndCopy: async (itemId) => (await wait(300), { success: true, itemId, text: DRAFT.draft.text, subject: "", applicationId: "a5", alreadyApproved: false }),
    };
  }, [mode]);
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text md:h-screen md:flex-row md:overflow-hidden">
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto pb-20 md:pb-8">
        <ApplicationsBoard actions={actions} />
      </main>
    </div>
  );
}
