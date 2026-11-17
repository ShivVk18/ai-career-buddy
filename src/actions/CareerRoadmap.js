"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { runAIStructured, runAIText } from "@/lib/ai";
import { roadmapSchema } from "@/lib/ai/schemas";
import { safeErr } from "@/lib/utils";
import { z } from "zod";
import { buildSources, formatCatalogForPrompt, validateSourceIds, snapshot } from "@/lib/ai/sources";
import { countGaps, deriveStepTargets } from "@/lib/roadmap/derive";

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

export async function generateCareerRoadmap(rawData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsedInput = inputSchema.safeParse(rawData ?? {});
  if (!parsedInput.success) return fail("INVALID", "Please enter your current and target role.");
  const data = parsedInput.data;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, industry: true, skills: true, bio: true, experience: true },
  });
  if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

  const resume = await db.resume.findUnique({ where: { userId: user.id } });
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
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.careerPath.findMany({
    where: {
      userId: user.id,
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
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.careerPath.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function updateRoadmapProgress(id, stepId, progress) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const careerPath = await db.careerPath.findUnique({
    where: { id, userId: user.id },
  });

  if (!careerPath) throw new Error("Career path not found");

  // Use the progress the caller passed (clamped to 0-100). Only when it is missing or not a number is it
  // recomputed from the completed steps. (It used to ignore the argument.)
  const steps = Array.isArray(careerPath.steps) ? careerPath.steps : [];
  const given = typeof progress === "number" && Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : null;
  const newProgress = given ?? stepProgress(steps);

  return await db.careerPath.update({
    where: {
      id,
      userId: user.id,
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
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const careerPath = await db.careerPath.findUnique({
    where: { id, userId: user.id },
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
    },
    data: {
      steps: updatedSteps,
      progress: newProgress,
      currentStep: stepId + 1,
      updatedAt: new Date(),
    },
  });
}

export async function deleteCareerRoadmap(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.careerPath.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function generateProgressRecommendations(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const careerPath = await db.careerPath.findUnique({
    where: { id, userId: user.id },
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
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

    for (let attempt = 0; attempt < 3; attempt++) {
      const path = await db.careerPath.findFirst({ where: { id: parsed.data.id, userId: user.id } });
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
        where: { id: path.id, userId: user.id, updatedAt: path.updatedAt },
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
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return { gaps: [], resultCount: 0 };
    const rows = await db.aTSScore.findMany({
      where: { userId: user.id },
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
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    const path = await db.careerPath.findFirst({ where: { id: parsed.data, userId: user.id }, select: { steps: true } });
    if (!path) return fail("NOT_FOUND", "Roadmap not found.");

    const pick = { companyName: true, jobTitle: true, jobDescription: true };
    const [ats, letters, emails] = await Promise.all([
      db.aTSScore.findMany({ where: { userId: user.id, jobDescription: { not: null } }, orderBy: { createdAt: "desc" }, take: 100, select: pick }),
      db.coverLetter.findMany({ where: { userId: user.id, jobDescription: { not: null } }, orderBy: { createdAt: "desc" }, take: 100, select: pick }),
      db.coldEmail.findMany({ where: { userId: user.id, jobDescription: { not: null } }, orderBy: { createdAt: "desc" }, take: 100, select: pick }),
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
