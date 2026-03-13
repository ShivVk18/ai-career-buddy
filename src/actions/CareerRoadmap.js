"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI } from "@google/genai" 
import AiServices  from "@/services/AiServices";

/* ---------- Initialize Gemini Client ---------- */
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* ---------- Utility: Clean JSON ---------- */
function cleanJsonResponse(response) {
  let cleaned = response.replace(/```(?:json)?\n?/g, "").trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}") + 1;
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd);
  }
  return cleaned;
}

/* ---------- Utility: Safe Parse ---------- */
function safeJsonParse(jsonString, fallbackData = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON Parse Error:", error.message);
    console.error("Problematic JSON:", jsonString.substring(0, 500) + "...");
    if (fallbackData) return fallbackData;
    throw new Error(`Invalid JSON response: ${error.message}`);
  }
}


export async function generateCareerRoadmap(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, industry: true, skills: true },
  });
  if (!user) throw new Error("User not found");

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
      "completed": false
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
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.4 },
    });

    // ✅ Correctly access Gemini output
    const rawText =
  result?.candidates?.[0]?.content?.parts
    ?.map(p => p.text)
    ?.join("")
    ?.trim();
    if (!rawText) {
      console.error("Empty response from Gemini:", JSON.stringify(result, null, 2));
      throw new Error("No content received from AI");
    }

    console.log("Raw AI Output:", rawText);
    const cleaned = cleanJsonResponse(rawText);
    const roadmapData = safeJsonParse(cleaned);

    // ✅ Validate
    if (!roadmapData.steps || !Array.isArray(roadmapData.steps)) {
      throw new Error("Invalid roadmap format received from AI");
    }

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
    console.error("Error generating career roadmap:", error);
    throw new Error("Failed to generate career roadmap");
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

  // Calculate new progress
  const steps = careerPath.steps;
  const completedSteps = steps.filter(step => step.completed).length;
  const newProgress = (completedSteps / steps.length) * 100;

  return await db.careerPath.update({
    where: {
      id,
      userId: user.id,
    },
    data: {
      progress: newProgress,
      currentStep: stepId,
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


    const recommendations = await AiServices.generateProgressUpdate(
      careerPath,
      completedSteps,
      "User is making good progress"
    );

    return recommendations;
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw new Error("Failed to generate recommendations");
  }
}