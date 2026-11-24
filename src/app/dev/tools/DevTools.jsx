"use client";

import CoverLetterGenerator from "@/app/(main)/(gated)/cover-letter/_components/CoverLetterGen";
import ColdEmailGenerator from "@/app/(main)/(gated)/cold-email/_components/ColdEmailGen";
import ColdEmailPreview from "@/app/(main)/(gated)/cold-email/_components/ColdEmailPreview";
import CoverLetterPreview from "@/app/(main)/(gated)/cover-letter/_components/CoverLetterPreview";
import ResumeParserForm from "@/app/(main)/(gated)/resume-parser/_components/ResumeParserForm";
import RoadmapDashboard from "@/app/(main)/(gated)/roadmap/_components/RoadmapDashboard";
import CreateRoadmapModal from "@/app/(main)/(gated)/roadmap/_components/CreateRoadmapModal";
import ResumeBuilder from "@/app/(main)/(gated)/resume/_components/ResumeBuilder";
import InterviewHub from "@/app/(main)/(gated)/interview/_components/InterviewHub";
import MockInterviewPage from "@/app/(main)/(gated)/interview/mock/page";
import ToolResultCard from "@/components/chat/ToolResultCard";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const JOBS = [
  { job: { id: "j1", company: "razorpay", title: "frontend engineer" } },
  { job: { id: "j2", company: "stripe", title: "product engineer" } },
  { job: { id: "j3", company: "notion", title: "design engineer" } },
];
const source = {
  listJobs: () => wait(150).then(() => JOBS),
  getJob: (id) => wait(200).then(() => ({ ...JOBS.find((j) => j.job.id === id).job, jdText: "we want someone who ships fast react and typescript, cares about performance, and has worked on design systems." })),
};
const emptySource = { listJobs: () => Promise.resolve([]), getJob: () => Promise.resolve(null) };

const genFor = (mode) => async () => {
  if (mode === "busy") return new Promise(() => {});
  if (mode === "error") return { error: "daily limit", code: "AI_LIMIT" };
  await wait(500);
  return { id: "mock" };
};

const RESUME = {
  contactInfo: { fullName: "Alex Morgan", email: "alex@example.com", mobile: "+1 555 010 0100", linkedin: "", twitter: "", socialLinks: [] },
  summary: "Frontend engineer who ships fast, accessible interfaces. Cut dashboard load from 3.8s to 1.1s and led a design-system rollout across three products.",
  skills: "react, typescript, next.js, sql, accessibility",
  experience: [{ id: "e1", title: "frontend intern", organization: "acme", startDate: "Jun 2024", endDate: "Aug 2024", current: false, description: "Cut dashboard load from 3.8s to 1.1s by code-splitting routes." }],
  education: [{ id: "d1", title: "b.sc. computer science", organization: "state university", startDate: "2021", endDate: "2025", current: false, description: "Graduated with honours." }],
  projects: [],
  templateId: "minimal-classic",
};

const ATS = {
  id: "a1", atsScore: 78, matchPercentage: 71, companyName: "razorpay", jobTitle: "frontend engineer",
  finalSummary: "strong react and performance evidence. payments is the main gap.",
  strengths: ["shipped a measurable performance win", "design system rollout"], weaknesses: ["no payments experience shown"],
  recommendations: [{ category: "experience", priority: "high", action: "add one line on any payments or checkout work.", impact: "closes the biggest gap" }],
  relevantSkills: ["react", "typescript", "performance"], missingSkills: ["payments", "pci"],
  candidateLevel: "junior", candidateYears: 1, hasResumeText: false,
  evidence: {
    strengths: [], weaknesses: [], recommendations: [],
    requirements: [
      { requirement: "react + typescript", match: "have", sources: [{ type: "resume_quote", quote: "react, typescript, next.js" }] },
      { requirement: "performance", match: "have", sources: [{ type: "resume_quote", quote: "cut dashboard load from 3.8s to 1.1s" }] },
      { requirement: "design systems", match: "partial", sources: [{ type: "resume_quote", quote: "design-system rollout" }] },
      { requirement: "payments", match: "gap", sources: [{ type: "jd", id: "jd:3" }] },
      { requirement: "mentoring (older result)", status: "matched", sources: [] },
    ],
  },
};

const ROADMAPS = [
  { id: "r1", status: "active", currentRole: "frontend engineer", targetRole: "staff engineer", industry: "technology", timeline: { estimatedDuration: "18 months" }, progress: 35, createdAt: new Date(Date.now() - 6e8).toISOString(), steps: [{ completed: true }, { completed: true }, { completed: false }, { completed: false }, { completed: false }, { completed: false }] },
  { id: "r2", status: "completed", currentRole: "intern", targetRole: "frontend engineer", industry: "technology", timeline: { estimatedDuration: "6 months" }, progress: 100, createdAt: new Date(Date.now() - 6e9).toISOString(), steps: [{ completed: true }, { completed: true }] },
];

const profile = (mode) => async () => {
  await wait(200);
  if (mode === "empty") return { chips: [], targetRole: null };
  return { chips: [{ kind: "role", label: "frontend engineer" }], targetRole: "staff engineer", industry: "technology" };
};

const CARDS = [
  { tool: "job", data: { recordId: "j1", company: "razorpay", role: "frontend engineer", location: "bengaluru", status: "SAVED", requirementCount: 8, chips: [{ label: "match", value: "71%", tone: "good" }, { label: "invented", value: "0", tone: "good" }], href: "/jobs/j1", createdAt: new Date().toISOString() } },
  { tool: "edit_summary", data: { title: "3 edits ready", summary: "nothing invented. nothing sent.", edits: [{ before: "Worked on improving dashboard performance.", after: "Cut dashboard load from 3.8s to 1.1s by code-splitting routes" }], href: "/needs-you" } },
  { tool: "task", data: { title: "practice payments questions", note: "weak spot from open practice", dueAt: new Date(Date.now() + 4 * 864e5).toISOString(), href: "/dashboard" } },
  { tool: "roadmap_item", data: { title: "ship one checkout project", roadmapTitle: "frontend to staff", done: false, href: "/roadmap/r1" } },
  { tool: "ats_score", data: { recordId: "a1", score: 78, matchPercentage: 71, company: "razorpay", role: "frontend engineer", summary: "strong react evidence; payments is the gap.", createdAt: new Date().toISOString(), href: "/resume-parser" } },
  { tool: "mystery_card", data: { title: "a card type the client doesn't know", summary: "shown as plain text" } },
];

export default function DevTools({ tool, mode }) {
  const src = mode === "empty" ? emptySource : source;
  const gen = genFor(mode);
  let body = null;
  switch (tool) {
    case "cover":
      body = <CoverLetterGenerator source={src} generate={gen} onDone={() => {}} />;
      break;
    case "cold":
      body = <ColdEmailGenerator source={src} generate={gen} onDone={() => {}} />;
      break;
    case "ats":
      body = <ResumeParserForm source={src} scan={async () => (mode === "error" ? { success: false, code: "AI_LIMIT" } : mode === "busy" ? new Promise(() => {}) : { success: true, data: ATS })} loadResume={async () => (mode === "empty" ? null : { id: "x" })} skipHistory />;
      break;
    case "ats-result":
      body = <ResumeParserForm source={src} initialResult={ATS} skipHistory loadResume={async () => ({ id: "x" })} />;
      break;
    case "roadmap":
      body = <RoadmapDashboard roadmaps={ROADMAPS} gapData={{ gaps: [{ skill: "payments", count: 4 }, { skill: "system design", count: 3 }, { skill: "testing", count: 2 }], resultCount: 4 }} />;
      break;
    case "roadmap-empty":
      body = <RoadmapDashboard roadmaps={[]} gapData={{ gaps: [], resultCount: 0 }} />;
      break;
    case "roadmap-new":
      body = <CreateRoadmapModal open onClose={() => {}} loadProfile={profile(mode)} generate={genFor(mode)} onCreated={() => {}} />;
      break;
    case "resume":
      body = <ResumeBuilder initialContent={RESUME} initialResume={RESUME} />;
      break;
    case "hub":
      body = (
        <InterviewHub
          assessments={mode === "empty" ? [] : [{ id: "q2", quizScore: 80, createdAt: new Date().toISOString(), questions: [1, 2, 3, 4, 5], improvementTip: "review closures" }, { id: "q1", quizScore: 60, createdAt: new Date(Date.now() - 864e5 * 3).toISOString(), questions: [1, 2, 3, 4, 5] }]}
          practiceHistory={mode === "empty" ? { sessions: [] } : { sessions: [{ sessionId: "s1", createdAt: new Date().toISOString(), answered: 4, total: 5, completed: true, topics: ["react", "performance"], averageOverall: 72 }] }}
          weakAreas={mode === "empty" ? { topics: [], minAnswers: 3, hiddenTopics: 0 } : { topics: [{ topic: "payments", average: 41, count: 3 }], minAnswers: 3, hiddenTopics: 0 }}
        />
      );
      break;
    case "quiz":
      body = <MockInterviewPage />;
      break;
    case "cold-preview":
      body = <ColdEmailPreview title="frontend engineer at razorpay" id="c1" content={"Hi Priya,\n\nI saw razorpay is hiring a frontend engineer. I cut dashboard load from 3.8s to 1.1s at acme and would love to bring that to checkout.\n\nOpen to a 5-minute chat next week?\n\nAlex"} sources={null} recipientName="priya sharma" recipientRole="engineering manager" recipientEmail="priya@razorpay.com" subject="question about the frontend role" followUpAt="" />;
      break;
    case "letter-preview":
      body = <div className="mx-auto max-w-4xl px-4 py-8"><CoverLetterPreview id="l1" content={"Dear hiring team,\n\nI cut dashboard load from 3.8s to 1.1s and led a design-system rollout. I would like to bring that to razorpay.\n\nBest,\nAlex"} sources={null} tone="confident" /></div>;
      break;
    case "chat":
      body = (
        <div className="mx-auto max-w-xl space-y-1 p-4">
          {CARDS.map((c, i) => <ToolResultCard key={i} type={c.tool} data={c.data} />)}
        </div>
      );
      break;
  }
  return <main className="min-h-screen bg-bg text-text">{body}</main>;
}
