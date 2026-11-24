"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { runAIStructured, runAIText, withAiAction } from "@/lib/ai";
import { roadmapSchema } from "@/lib/ai/schemas";
import { safeErr } from "@/lib/utils";
import { undoCutoff } from "@/lib/softDelete";
import { z } from "zod";
import { buildSources, formatCatalogForPrompt, validateSourceIds, snapshot } from "@/lib/ai/sources";
import { countGaps, deriveStepTargets } from "@/lib/roadmap/derive";
import { gapSteps } from "@/lib/applications/derive";
import { makeUndoToken } from "@/lib/undo";

const NO_SOURCES_MSG =
  "We couldn't ground a roadmap in your details. Add skills or experience to your profile or resume, then try again.";
const inputSchema = z.object({
  currentRole: z.string().trim().min(1).max(200),
  targetRole: z.string().trim().min(1).max(200),
  industry: z.string().trim().max(200).default(""),
});
const fail = (code, error) => ({ error, code });
const stepProgress = (steps) =>
  steps.length ? (steps.filter((st) => st && st.completed).length / steps.length) * 100 : 0;

// D50: one cap-counted action, however many AI calls it makes.
export async function generateCareerRoadmap(rawData) {
  return withAiAction(() => generateCareerRoadmapImpl(rawData));
}

async function generateCareerRoadmapImpl(rawData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsedInput = inputSchema.safeParse(rawData ?? {});
  if (!parsedInput.success) return fail("INVALID", "Please enter your current and target role.");
  const data = parsedInput.data;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, industry: true, skills: true, bio: true, experience: true },
  });
  if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

  const resume = await db.resume.findUnique({ where: { userId: user.id, deletedAt: null } });
  const catalog = buildSources({
    profile: user,
    resume,
    extra: [
      { id: "input:currentRole", kind: "input", label: "Your current role", text: data.currentRole },
      { id: "input:targetRole", kind: "input", label: "Your target role", text: data.targetRole },
      ...(data.industry ? [{ id: "input:industry", kind: "input", label: "Your industry", text: data.industry }] : []),
    ],
  });

  const prompt = `
You are an expert AI career coach.

Generate a structured, realistic, and actionable career roadmap.

User Profile:
- Current Role: ${data.currentRole}
- Target Role: ${data.targetRole}
- Industry: ${data.industry}

CRITICAL RULES:
- Output ONLY valid JSON
- No markdown
- No explanation
- No comments
- No extra keys
- Keep output concise but useful
- Avoid generic advice
- Ensure logical career progression
- Steps must be practical and achievable

SOURCES (the ONLY facts about the user you may rely on; each line is [id] label: text):
${formatCatalogForPrompt(catalog)}

SOURCE RULE:
- Every step MUST have "sourceIds": one or more ids copied exactly from the SOURCES list that justify the step (for example the target role, a current skill or an experience entry).
- Never claim the user has skills, jobs or credentials that are not in the SOURCES.

IMPORTANT RESOURCE RULE:
- Do NOT generate URLs
- Only provide resource names
- Use real well-known platforms (e.g., Coursera, FreeCodeCamp, React Docs, AWS Docs)

OUTPUT STRUCTURE:

{
  "steps": [
    {
      "id": number (start from 1),
      "title": "short actionable step",
      "description": "clear practical explanation",
      "category": "skill | experience | networking | education | certification",
      "priority": "high | medium | low",
      "resources": ["resource name"],
      "completed": false,
      "sourceIds": ["id from SOURCES"]
    }
  ],
  "milestones": [
    {
      "title": "milestone name",
      "targetDate": "realistic timeline like '3 months'",
      "summary": "achievement description"
    }
  ],
  "resources": [
    {
      "category": "Courses | Certifications | Communities | Books",
      "items": [
        {
          "title": "resource name"
        }
      ]
    }
  ],
  "timeline": {
    "estimatedDuration": "realistic total duration like '12 months'",
    "phaseBreakdown": [
      {
        "title": "Beginner Phase",
        "description": "focus of this phase",
        "duration": "3 months"
      },
      {
        "title": "Intermediate Phase",
        "description": "focus of this phase",
        "duration": "6 months"
      },
      {
        "title": "Advanced Phase",
        "description": "focus of this phase",
        "duration": "3 months"
      }
    ]
  }
}

GENERATION RULES:
1. Generate 6–10 steps only
2. First steps should focus on core skill building
3. Include at least one real-world project step
4. Include at least one networking step
5. Include certification only if relevant
6. Prioritize high-impact skills first
7. Avoid repeating similar steps
8. Timeline must feel realistic
9. Use industry-relevant progression
10. Make roadmap suitable for someone transitioning roles

Return ONLY JSON.
`;

  try {
    const generate = async (note) => {
      const r = await runAIStructured("write", roadmapSchema, () => [["user", prompt + note]], { userId });
      const kept = r.steps
        .map((st) => ({ ...st, sourceIds: validateSourceIds(st.sourceIds, catalog) }))
        .filter((st) => st.sourceIds.length > 0);
      return { r, kept };
    };

    let { r: roadmapData, kept } = await generate("");
    if (kept.length < roadmapData.steps.length) {
      try {
        const retry = await generate(
          "\n\nIMPORTANT: your previous answer had steps without valid sourceIds. Every step MUST list at least one id copied exactly from the SOURCES list."
        );
        const dropped = (x) => x.r.steps.length - x.kept.length;
        if (dropped(retry) <= roadmapData.steps.length - kept.length) ({ r: roadmapData, kept } = retry);
      } catch (e) {
        console.error("roadmap retry failed, keeping first attempt:", safeErr(e));
      }
    }
    if (kept.length === 0) return fail("NO_SOURCES", NO_SOURCES_MSG);

    // Renumber so step ids stay 1..n after dropping unsourced steps.
    roadmapData.steps = kept.map((st, idx) => ({
      ...st,
      id: idx + 1,
      sources: snapshot(st.sourceIds, catalog),
    }));

    // ✅ Ensure timeline is properly formatted as a JSON object
    const timelineData = roadmapData.timeline || {
      estimatedDuration: "12 months",
      phaseBreakdown: []
    };

    const careerPath = await db.careerPath.create({
      data: {
        currentRole: data.currentRole,
        targetRole: data.targetRole,
        industry: data.industry,
        steps: roadmapData.steps,
        milestones: roadmapData.milestones || [],
        resources: roadmapData.resources || [],
        timeline: timelineData, // Pass as-is, Prisma will handle Json type
        progress: 0,
        currentStep: 0,
        status: "active",
        userId: user.id,
      },
    });

    return careerPath;
  } catch (error) {
    console.error("generateCareerRoadmap failed:", safeErr(error));
    if (error?.code === "AI_LIMIT") return fail("AI_LIMIT", "Daily AI limit reached. Please try again tomorrow.");
    if (error?.code === "AI_UNAVAILABLE") return fail("AI_UNAVAILABLE", "AI is temporarily unavailable. Please try again later.");
    return fail("FAILED", "Failed to generate career roadmap. Please try again.");
  }
}


export async function getCareerRoadmaps() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.careerPath.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCareerRoadmap(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.careerPath.findUnique({
    where: {
      id,
      userId: user.id,
      deletedAt: null,
    },
  });
}

export async function updateRoadmapProgress(id, stepId, progress) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  const careerPath = await db.careerPath.findUnique({
    where: { id, userId: user.id, deletedAt: null },
  });

  if (!careerPath) throw new Error("Career path not found");

  // The caller's number is ignored (kept for signature compatibility): progress is recomputed from the steps.
  const steps = Array.isArray(careerPath.steps) ? careerPath.steps : [];
  const newProgress = stepProgress(steps);

  return await db.careerPath.update({
    where: {
      id,
      userId: user.id,
      deletedAt: null,
    },
    data: {
      progress: newProgress,
      currentStep: Number.isFinite(Number(stepId)) ? Number(stepId) : careerPath.currentStep,
      updatedAt: new Date(),
    },
  });
}

export async function completeRoadmapStep(id, stepId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  const careerPath = await db.careerPath.findUnique({
    where: { id, userId: user.id, deletedAt: null },
  });

  if (!careerPath) throw new Error("Career path not found");

  // Update the specific step as completed
  const updatedSteps = careerPath.steps.map(step => 
    step.id === stepId ? { ...step, completed: true, completedAt: new Date() } : step
  );

  // Calculate progress
  const completedSteps = updatedSteps.filter(step => step.completed).length;
  const newProgress = (completedSteps / updatedSteps.length) * 100;

  return await db.careerPath.update({
    where: {
      id,
      userId: user.id,
      deletedAt: null,
    },
    data: {
      steps: updatedSteps,
      progress: newProgress,
      currentStep: stepId + 1,
      updatedAt: new Date(),
    },
  });
}

/**
 * Soft delete (7-day undo, D60): sets `deletedAt`. Returns { success: true, id } or { error, code: INVALID | NOT_FOUND | FAILED }.
 * Undo with restoreCareerRoadmap(id).
 */
export async function deleteCareerRoadmap(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = z.string().trim().min(1).max(64).safeParse(id);
  if (!parsed.success) return fail("INVALID", "Invalid roadmap.");

  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    const res = await db.careerPath.updateMany({ where: { id: parsed.data, userId: user.id, deletedAt: null }, data: { deletedAt: new Date() } });
    if (res.count === 0) return fail("NOT_FOUND", "Roadmap not found.");
    return { success: true, id: parsed.data };
  } catch (error) {
    console.error("deleteCareerRoadmap failed:", safeErr(error));
    return fail("FAILED", "Could not delete the roadmap. Please try again.");
  }
}

/** Undo of deleteCareerRoadmap (7 days, then NOT_FOUND). Returns { success: true, id } or { error, code }. */
export async function restoreCareerRoadmap(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = z.string().trim().min(1).max(64).safeParse(id);
  if (!parsed.success) return fail("INVALID", "Invalid roadmap.");

  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    const res = await db.careerPath.updateMany({
      where: { id: parsed.data, userId: user.id, deletedAt: { not: null, gte: undoCutoff() } },
      data: { deletedAt: null },
    });
    if (res.count === 0) return fail("NOT_FOUND", "Roadmap not found.");
    return { success: true, id: parsed.data };
  } catch (error) {
    console.error("restoreCareerRoadmap failed:", safeErr(error));
    return fail("FAILED", "Could not restore the roadmap. Please try again.");
  }
}

// D50: one cap-counted action, however many AI calls it makes.
export async function generateProgressRecommendations(id) {
  return withAiAction(() => generateProgressRecommendationsImpl(id));
}

async function generateProgressRecommendationsImpl(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  const careerPath = await db.careerPath.findUnique({
    where: { id, userId: user.id, deletedAt: null },
  });

  if (!careerPath) throw new Error("Career path not found");

  try {
    const completedSteps = careerPath.steps.filter(step => step.completed);


    const prompt = `
Analyze the career roadmap progress and provide personalized recommendations.

Current roadmap progress:
- Total steps: ${careerPath.steps.length}
- Completed steps: ${completedSteps.length}
- Current step: ${careerPath.currentStep}
- Overall progress: ${careerPath.progress}%

User feedback on completed steps:
User is making good progress

Provide specific, actionable advice for the next 2-3 steps and any adjustments needed.
Keep the response encouraging and practical.
Maximum 200 words.
`;

    let recommendations;
    try {
      recommendations = await runAIText("write", () => [["user", prompt]], { userId });
    } catch {
      recommendations =
        "Continue following your roadmap. Focus on the next step and track your progress regularly.";
    }

    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations");
    throw new Error("Failed to generate recommendations");
  }
}

// ---------------------------------------------------------------------------------------------------------
// Phase 6 (D47, roadmap parity). Read-only helpers use no AI.

const setDoneSchema = z.object({
  id: z.string().min(1).max(64),
  stepId: z.number().int(),
  done: z.boolean(),
});

/** Sets one step done / not done (undo) and recomputes progress. Owner-scoped; safe against concurrent toggles. */
export async function setRoadmapStepDone(id, stepId, done) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = setDoneSchema.safeParse({ id, stepId, done });
  if (!parsed.success) return fail("INVALID", "Invalid roadmap step.");

  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

    for (let attempt = 0; attempt < 3; attempt++) {
      const path = await db.careerPath.findFirst({ where: { id: parsed.data.id, userId: user.id, deletedAt: null } });
      if (!path) return fail("NOT_FOUND", "Roadmap not found.");
      const steps = Array.isArray(path.steps) ? path.steps : [];
      if (!steps.some((st) => st && st.id === parsed.data.stepId)) return fail("NOT_FOUND", "Step not found.");

      const updated = steps.map((st) => {
        if (!st || st.id !== parsed.data.stepId) return st;
        if (parsed.data.done) return { ...st, completed: true, completedAt: new Date().toISOString() };
        const { completedAt: _drop, ...rest } = st;
        return { ...rest, completed: false };
      });
      const progress = stepProgress(updated);
      const next = updated.find((st) => st && !st.completed);
      const currentStep = next ? Number(next.id) || 0 : updated.length;

      // Optimistic lock on updatedAt: a concurrent toggle makes this miss, and we re-read and retry.
      const res = await db.careerPath.updateMany({
        where: { id: path.id, userId: user.id, deletedAt: null, updatedAt: path.updatedAt },
        data: { steps: updated, progress, currentStep },
      });
      if (res.count === 1) {
        return { success: true, id: path.id, stepId: parsed.data.stepId, done: parsed.data.done, progress, currentStep, steps: updated };
      }
    }
    return fail("FAILED", "Could not save the change. Please try again.");
  } catch (error) {
    console.error("setRoadmapStepDone failed:", safeErr(error));
    return fail("FAILED", "Could not save the change. Please try again.");
  }
}

/** Missing skills ranked by how many of the user's own ATS results list them. No AI. */
export async function getGapFrequency() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return { gaps: [], resultCount: 0 };
    const rows = await db.aTSScore.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { missingSkills: true },
    });
    return { gaps: countGaps(rows), resultCount: rows.length };
  } catch (error) {
    console.error("getGapFrequency failed:", safeErr(error));
    return fail("FAILED", "Failed to load skill gaps.");
  }
}

/**
 * For each step of the roadmap, the user's own targets (D18: ATS results, cover letters, cold emails; company
 * and role) whose stored job description names the step's skill or title. Deterministic, no AI.
 * Returns { targets: { [stepId]: [{ company, role, jdExcerpt, kinds }] } } with every step present.
 */
export async function getStepTargets(roadmapId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = z.string().min(1).max(64).safeParse(roadmapId);
  if (!parsed.success) return fail("INVALID", "Invalid roadmap.");

  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    const path = await db.careerPath.findFirst({ where: { id: parsed.data, userId: user.id, deletedAt: null }, select: { steps: true } });
    if (!path) return fail("NOT_FOUND", "Roadmap not found.");

    const pick = { companyName: true, jobTitle: true, jobDescription: true };
    const [ats, letters, emails] = await Promise.all([
      db.aTSScore.findMany({ where: { userId: user.id, deletedAt: null, jobDescription: { not: null } }, orderBy: { createdAt: "desc" }, take: 100, select: pick }),
      db.coverLetter.findMany({ where: { userId: user.id, deletedAt: null, jobDescription: { not: null } }, orderBy: { createdAt: "desc" }, take: 100, select: pick }),
      db.coldEmail.findMany({ where: { userId: user.id, deletedAt: null, jobDescription: { not: null } }, orderBy: { createdAt: "desc" }, take: 100, select: pick }),
    ]);
    const docs = [
      ...ats.map((d) => ({ kind: "ats", company: d.companyName, role: d.jobTitle, jobDescription: d.jobDescription })),
      ...letters.map((d) => ({ kind: "coverLetter", company: d.companyName, role: d.jobTitle, jobDescription: d.jobDescription })),
      ...emails.map((d) => ({ kind: "coldEmail", company: d.companyName, role: d.jobTitle, jobDescription: d.jobDescription })),
    ];
    return { targets: deriveStepTargets(path.steps, docs) };
  } catch (error) {
    console.error("getStepTargets failed:", safeErr(error));
    return fail("FAILED", "Failed to load targets.");
  }
}

const addGapSchema = z.object({
  skill: z.string().trim().min(1).max(80),
  applicationId: z.string().trim().min(1).max(100).optional(),
});
const GAP_TRIES = 3;

/**
 * Adds one skill gap as a "Skill gap" step ("Learn <skill>") to the most recently updated active roadmap. No AI.
 * Idempotent per skill: if a step for it already exists nothing is added (created: false, same stepId).
 * Returns { success: true, roadmapId, stepId, roadmapItemId (= stepId), created, undoToken? } (undoToken only when created;
 * undo(token) removes that step if it is still untouched) or { error, code: INVALID | NOT_FOUND | NO_ROADMAP | FAILED }.
 */
export async function addGapToRoadmap(input) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const p = addGapSchema.safeParse(input ?? {});
  if (!p.success) return fail("INVALID", "Add the skill you want to learn (up to 80 characters).");
  const { skill, applicationId } = p.data;
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    let job = null;
    if (applicationId) {
      const app = await db.application.findFirst({
        where: { id: applicationId, userId: user.id, deletedAt: null },
        select: { jobId: true, job: { select: { title: true, company: true } } },
      });
      if (!app) return fail("NOT_FOUND", "We couldn't find that application.");
      job = { jobId: app.jobId, title: app.job?.title, company: app.job?.company };
    }
    for (let i = 0; i < GAP_TRIES; i++) {
      const path = await db.careerPath.findFirst({ where: { userId: user.id, status: "active", deletedAt: null }, orderBy: { updatedAt: "desc" } });
      if (!path) return fail("NO_ROADMAP", "You don't have an active roadmap yet. Create one first.");
      const steps = Array.isArray(path.steps) ? path.steps : [];
      const added = gapSteps([skill], steps, { company: job?.company, title: job?.title, jobId: job?.jobId });
      if (added.length === 0) {
        const k = skill.toLowerCase();
        const existing = steps.find((st) => st && String(st.title ?? "").toLowerCase().includes(k));
        return { success: true, roadmapId: path.id, stepId: existing?.id ?? null, roadmapItemId: existing?.id ?? null, created: false };
      }
      const all = [...steps, ...added];
      const progress = stepProgress(all);
      const res = await db.careerPath.updateMany({
        where: { id: path.id, userId: user.id, deletedAt: null, updatedAt: path.updatedAt },
        data: { steps: all, progress },
      });
      if (res.count === 1) {
        const stepId = added[0].id;
        return { success: true, roadmapId: path.id, stepId, roadmapItemId: stepId, created: true, undoToken: makeUndoToken("roadmap_gap", path.id, { s: stepId }) };
      }
    }
    return fail("FAILED", "We couldn't save that. Please try again.");
  } catch (error) {
    console.error("addGapToRoadmap failed:", safeErr(error));
    return fail("FAILED", "We couldn't save that. Please try again.");
  }
}

/** Undo of addGapToRoadmap: removes that one "Skill gap" step if it is still not completed. Idempotent. Owner-scoped. */
export async function removeGapFromRoadmap(roadmapId, stepId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (typeof roadmapId !== "string" || !roadmapId || !Number.isInteger(stepId)) return fail("INVALID", "Nothing to undo.");
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    for (let i = 0; i < GAP_TRIES; i++) {
      const path = await db.careerPath.findFirst({ where: { id: roadmapId, userId: user.id, deletedAt: null } });
      if (!path) return fail("NOT_FOUND", "Roadmap not found.");
      const steps = Array.isArray(path.steps) ? path.steps : [];
      const step = steps.find((st) => st && st.id === stepId);
      if (!step) return { success: true };
      if (step.category !== "Skill gap" || step.completed) return fail("NOT_FOUND", "That step has changed, so it was kept.");
      const left = steps.filter((st) => st !== step);
      const progress = stepProgress(left);
      const next = left.find((st) => st && !st.completed);
      const res = await db.careerPath.updateMany({
        where: { id: path.id, userId: user.id, deletedAt: null, updatedAt: path.updatedAt },
        data: { steps: left, progress, currentStep: next ? Number(next.id) || 0 : left.length },
      });
      if (res.count === 1) return { success: true };
    }
    return fail("FAILED", "We couldn't undo that. Please try again.");
  } catch (error) {
    console.error("removeGapFromRoadmap failed:", safeErr(error));
    return fail("FAILED", "We couldn't undo that. Please try again.");
  }
}
