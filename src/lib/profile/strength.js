// Profile strength (D59): deterministic, no AI. A percentage plus ONE next action. Not a "use server" file.
import { db } from "@/lib/prisma";

const hasText = (v) => typeof v === "string" && v.trim().length > 0;
const count = (v) => (Array.isArray(v) ? v.filter((e) => e && typeof e === "object").length : 0);

/** Pure: parts in priority order. `facts` = { resume, user, hasJob }. */
export function strengthFrom({ resume, user, hasJob }) {
  const hasResume = !!resume && (hasText(resume.content) || hasText(resume.summary) || count(resume.experience) + count(resume.projects) + count(resume.education) > 0);
  const skillCount = Math.max(Array.isArray(user?.skills) ? user.skills.length : 0, hasText(resume?.skills) ? resume.skills.split(/[,\n]/).filter((s) => s.trim()).length : 0);
  const defs = [
    { name: "Resume added", done: hasResume, label: "Add your resume", href: "/onboarding" },
    { name: "Experience or projects", done: count(resume?.experience) + count(resume?.projects) > 0, label: "Add a role or project to your resume", href: "/resume" },
    { name: "Skills", done: skillCount >= 3, label: "Add at least 3 skills", href: "/resume" },
    { name: "Target role", done: hasText(user?.targetRole), label: "Pick the role you're aiming for", href: "/onboarding" },
    { name: "Job search stage", done: !!user?.jobSearchStage, label: "Tell Pip where you are in your search", href: "/onboarding" },
    { name: "First job added", done: !!hasJob, label: "Paste a job you're interested in", href: "/dashboard" },
  ];
  const done = defs.filter((d) => d.done).length;
  const next = defs.find((d) => !d.done);
  return {
    percent: Math.round((done / defs.length) * 100),
    nextAction: next ? { label: next.label, href: next.href } : null,
    parts: defs.map(({ name, done: d }) => ({ name, done: d })),
  };
}

/** Owner-scoped load + strengthFrom. */
export async function computeProfileStrength(userDbId) {
  const [user, resume, jobCount] = await Promise.all([
    db.user.findUnique({ where: { id: userDbId }, select: { skills: true, targetRole: true, jobSearchStage: true } }),
    db.resume.findUnique({ where: { userId: userDbId, deletedAt: null }, select: { content: true, summary: true, skills: true, experience: true, projects: true, education: true } }),
    db.job.count({ where: { userId: userDbId, deletedAt: null } }),
  ]);
  return strengthFrom({ resume, user, hasJob: jobCount > 0 });
}
