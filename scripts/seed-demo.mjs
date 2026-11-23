// Demo data for the happy-flow redesign. Dev database only; idempotent.
// Run: npm run seed:demo   (loads .env via node --env-file-if-exists, like test:ai)
// Optional: SEED_DEMO_CLERK_USER_ID=<your dev Clerk user id> to seed onto your own sign-in (an existing resume is left alone).
// Only rows with ids starting "demo-" (and the demo user) are written or replaced; nothing else is touched.
import { PrismaClient } from "@prisma/client";
import { checkSeedTarget } from "../src/lib/seed/guard.js";

const guard = checkSeedTarget(process.env);
if (!guard.ok) {
  console.error(`seed:demo refused: ${guard.reason} It only runs against a local dev database.`);
  process.exit(1);
}

const db = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const ago = (d) => new Date(now - d * DAY);
const ahead = (d) => new Date(now + d * DAY);
const clerkUserId = process.env.SEED_DEMO_CLERK_USER_ID || "demo_seed_user";

const doneStep = (extra = {}) => ({ status: "done", startedAt: ago(1).toISOString(), finishedAt: ago(1).toISOString(), ...extra });
const finishedPipeline = {
  v: 1,
  run: { actionId: "demo-run-1", capChecked: true, startedAt: ago(1).toISOString(), finishedAt: ago(1).toISOString() },
  steps: {
    CHECKER: doneStep({ output: { atsScore: 78 } }),
    TAILOR: doneStep({ output: { applied: 3 } }),
    WRITER: doneStep({ ids: { coverLetterId: "demo-letter-1" }, needsYou: true }),
    CONNECTOR: { status: "skipped", reason: "no contact on file" },
  },
};

const jobs = [
  { id: "demo-job-1", company: "Lumen Labs", title: "Frontend Engineer", location: "Remote", status: "SAVED", pipeline: finishedPipeline,
    jd: "We build accessible data tools. You will ship React and TypeScript interfaces, work with designers, and own testing. 3+ years of frontend experience." },
  { id: "demo-job-2", company: "Northwind Co", title: "Full-stack Developer", location: "Berlin", status: "APPLIED", appliedAt: ago(6), followUpCount: 0,
    jd: "Join a small team building logistics software. Node.js, React and PostgreSQL. You will work across the stack." },
  { id: "demo-job-3", company: "Parcel", title: "Software Engineer", location: "London", status: "INTERVIEWING", appliedAt: ago(14), interviewAt: ahead(3),
    jd: "Backend-leaning role on a payments team. Strong fundamentals, TypeScript, and clear communication." },
  { id: "demo-job-4", company: "Fernwood", title: "Product Engineer", location: "Remote", status: "OFFER", appliedAt: ago(30), interviewAt: ago(8),
    jd: "Product engineering at an early-stage climate startup. React, Node.js, ownership from idea to launch." },
];

async function main() {
  let user = await db.user.findUnique({ where: { clerkUserId } });
  const created = !user;
  user ??= await db.user.create({
    data: {
      clerkUserId, email: "demo@example.invalid", name: "Demo User", industry: "Software", experience: 3,
      bio: "Frontend-leaning engineer who likes small, well-tested tools.",
      skills: ["JavaScript", "React", "Node.js", "SQL"], targetRole: "Frontend Engineer", jobSearchStage: "APPLYING",
    },
  });

  const existingResume = await db.resume.findUnique({ where: { userId: user.id } });
  if (created || !existingResume) {
    const resumeData = {
      content: "", summary: "Engineer with 3 years building web apps with React and Node.js.", skills: "JavaScript, React, Node.js, SQL, Testing",
      contactInfo: { email: "demo@example.invalid", mobile: "", linkedin: "" }, deletedAt: null,
      experience: [{ id: "demo-exp-1", title: "Software Engineer", organization: "Brightside", startDate: "2023-01", current: true, description: "Built a React dashboard used by 40 support agents.\nReduced page load time by moving data fetching to the server.\nWrote integration tests for the billing flow." }],
      education: [{ id: "demo-edu-1", title: "BSc Computer Science", organization: "State University", startDate: "2019-09", endDate: "2022-06", description: "" }],
      projects: [{ id: "demo-proj-1", title: "Budget tracker", organization: "Personal project", description: "Small app to track spending with charts.\nUsed by friends and family." }],
    };
    await db.resume.upsert({ where: { userId: user.id }, update: resumeData, create: { ...resumeData, userId: user.id } });
  }

  // Replace only demo-owned rows so reruns give the same result.
  await db.coverLetter.deleteMany({ where: { id: { startsWith: "demo-" }, userId: user.id } });
  await db.job.deleteMany({ where: { id: { startsWith: "demo-" }, userId: user.id } }); // cascades applications
  await db.careerPath.deleteMany({ where: { id: { startsWith: "demo-" }, userId: user.id } });
  await db.notification.deleteMany({ where: { id: { startsWith: "demo-" }, userId: user.id } });

  for (const j of jobs) {
    await db.job.create({ data: { id: j.id, userId: user.id, company: j.company, title: j.title, location: j.location, jdText: j.jd, createdAt: ago(20) } });
    await db.application.create({
      data: {
        id: `demo-app-${j.id.slice(-1)}`, userId: user.id, jobId: j.id, status: j.status, appliedAt: j.appliedAt ?? null, interviewAt: j.interviewAt ?? null,
        followUpCount: j.followUpCount ?? 0, pipeline: j.pipeline ?? undefined,
      },
    });
  }
  await db.coverLetter.create({
    data: { id: "demo-letter-1", userId: user.id, jobId: "demo-job-1", companyName: "Lumen Labs", jobTitle: "Frontend Engineer", status: "draft",
      content: "Hello Lumen Labs team,\n\nI build React interfaces and care about accessibility. At Brightside I built a dashboard used by 40 support agents.\n\nThanks for reading." },
  });
  await db.careerPath.create({
    data: {
      id: "demo-path-1", userId: user.id, currentRole: "Software Engineer", targetRole: "Frontend Engineer", industry: "Software", milestones: [], resources: [], timeline: {},
      steps: [
        { id: 1, title: "Learn TypeScript generics", description: "Work through the handbook chapter and refactor one module.", category: "Skill gap", priority: "medium", resources: [], completed: false, sourceIds: [] },
        { id: 2, title: "Add accessibility tests to the budget tracker", description: "Use axe in the test suite.", category: "Portfolio", priority: "high", resources: [], completed: false, sourceIds: [] },
        { id: 3, title: "Update LinkedIn headline", description: "", category: "Profile", priority: "low", resources: [], completed: true, sourceIds: [] },
      ],
    },
  });
  await db.notification.create({
    data: { id: "demo-note-1", userId: user.id, type: "BOT_DONE", title: "Your drafts for Lumen Labs are ready", body: "Review the cover letter.", href: "/needs-you" },
  });
  console.log(`seed:demo done (${created ? "created" : "reused"} user ${clerkUserId}). 4 applications, 1 finished run, 1 follow-up due, 1 offer.`);
}

main().catch((e) => { console.error("seed:demo failed:", e?.message ?? e); process.exitCode = 1; }).finally(() => db.$disconnect());
