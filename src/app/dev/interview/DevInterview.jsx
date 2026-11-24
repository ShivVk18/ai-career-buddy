"use client";

import { useMemo } from "react";
import PracticeScreen from "@/components/interview/PracticeScreen";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const Q = [
  { index: 0, topic: "frontend performance", timeLimitSec: 120, question: "walk me through how you cut load time from 3.8s to 1.1s. what would you try next?", sources: [{ id: "proj:1", kind: "project", label: "trading dashboard rewrite", excerpt: "cut load time from 3.8s to 1.1s" }] },
  { index: 1, topic: "system design", timeLimitSec: 120, question: "the job says you will own the order book view. how would you keep it fast with 10 updates per second?", sources: [{ id: "jd:4", kind: "jd", label: "line 4", excerpt: "own the order book view for retail traders" }] },
  { index: 2, topic: "react", timeLimitSec: 90, question: "which react skills on your resume would you use first in this role, and why?", sources: [{ id: "profile:skills", kind: "profile", label: "your skills", excerpt: "react, typescript" }] },
];

function rubric(text, weak) {
  const sent = text.split(/[.!?]/).map((s) => s.trim()).filter((s) => s.length >= 12);
  const pick = (i) => {
    const quote = sent[i] || null;
    const start = quote ? text.indexOf(quote) : -1;
    return { quote, quoteRange: quote ? [start, start + quote.length] : null };
  };
  const mk = (name, weight, score, fb, i) => ({ name, weight, score, feedback: fb, ...pick(i) });
  const criteria = weak
    ? [mk("clarity", 30, 7, "the point was easy to follow.", 0), mk("depth", 40, 4, "no detail on how the layout was split.", 1), mk("evidence", 30, 6, "the numbers are yours, which helps.", 0)]
    : [mk("clarity", 30, 9, "clear and in order.", 0), mk("depth", 40, 8, "good detail on the trade-offs.", 1), mk("evidence", 30, 9, "backed by your own numbers.", 0)];
  const overall = weak ? 52 : 86;
  return { answerText: text, overall, createdAt: new Date().toISOString(), rubric: { criteria, summary: "", overall } };
}

export default function DevInterview({ mode }) {
  const actions = useMemo(
    () => ({
      generateOpenQuestions: async () => {
        await wait(mode === "loading" ? 3_600_000 : 700);
        if (mode === "error") return { error: "mock failure", code: "FAILED" };
        if (mode === "empty") return { error: "no sources", code: "NO_SOURCES" };
        return { sessionId: "s1", questions: Q, application: null };
      },
      getOpenSession: async () => {
        await wait(mode === "loading" ? 3_600_000 : 400);
        if (mode === "error") return { error: "mock failure", code: "FAILED" };
        return { sessionId: "s1", questions: Q.map((x) => ({ ...x, answer: null })), application: { id: "a1", company: "Zerodha", title: "Frontend Engineer", interviewAt: new Date(Date.now() + 2 * 86400000).toISOString() } };
      },
      scoreOpenAnswer: async (_s, i, text) => (await wait(900), { index: i, ...rubric(text, i !== 2) }),
      saveWeakSpot: async ({ skill }) => (await wait(500), { task: { taskId: "t1", title: `Practise ${skill}` }, created: true }),
    }),
    [mode],
  );
  return (
    <PracticeScreen
      key={mode}
      actions={actions}
      sessionId={mode === "resume" || mode === "loading" ? "s1" : null}
      invite={mode === "resume"}
      onFinish={() => {}}
    />
  );
}
