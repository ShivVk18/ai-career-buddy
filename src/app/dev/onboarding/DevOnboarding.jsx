"use client";

import OnboardingFlow from "@/app/(main)/onboarding/_components/OnboardingFlow";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const chip = (kind, label, detail) => ({ kind, label, ...(detail ? { detail } : {}) });

const MOCK = [
  ...["React", "TypeScript", "Next.js", "Node", "REST", "GraphQL", "Postgres", "Tailwind", "Jest", "Docker", "AWS", "Git"].map((s) => chip("skill", s)),
  chip("project", "Shipmate", "route planner for couriers"),
  chip("project", "Notely", "offline-first notes app"),
  chip("role", "Frontend Intern", "Acme Labs"),
  chip("role", "Frontend Developer", "Northwind"),
];

export default function DevOnboarding({ delay, fail, editing }) {
  const actions = {
    parseResumeToProfile: async () => {
      await wait(delay);
      if (fail) return { error: "mock failure", code: "FAILED" };
      return { chips: MOCK, suggestedTargetRole: "Frontend Developer", suggestedIndustry: "software" };
    },
    getProfileChips: async () => {
      await wait(delay);
      return { chips: MOCK.map((c, i) => ({ ...c, id: `p${i}` })), industry: "software", targetRole: "Frontend Developer", jobSearchStage: "APPLYING" };
    },
    saveResumeVersion: async () => ({ id: "v1" }),
    restoreResumeVersion: async () => ({ ok: true }),
    saveProfileChips: async () => {
      await wait(400);
      return { success: true };
    },
    saveOnboardingAnswers: async () => ({ success: true }),
  };
  return <OnboardingFlow editing={editing} actions={actions} />;
}
