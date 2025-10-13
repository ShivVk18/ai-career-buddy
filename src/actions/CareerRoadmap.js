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

/* ---------- Generate Career Roadmap ---------- */
export async function generateCareerRoadmap(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, industry: true, skills: true },
  });
  if (!user) throw new Error("User not found");

  const prompt = `
You are an AI assistant that outputs ONLY valid JSON.

Generate a complete, detailed **career roadmap** for a person currently working as "${data.currentRole}" in the "${data.industry}" industry who wants to become a "${data.targetRole}".

The output MUST follow this structure exactly:

{
  "steps": [
    {
      "id": number,
      "title": "string",
      "description": "string",
      "resources": ["string", "string"],
      "completed": false
    }
  ],
  "milestones": [
    {
      "title": "string",
      "targetDate": "string (e.g., 3 months from now)",
      "summary": "string"
    }
  ],
  "resources": [
    {
      "category": "Courses" | "Certifications" | "Communities" | "Books",
      "items": ["string", "string"]
    }
  ],
  "timeline": {
    "estimatedDuration": "string (e.g., 12 months)",
    "phaseBreakdown": [
      { "phase": "Beginner", "duration": "3 months" },
      { "phase": "Intermediate", "duration": "6 months" },
      { "phase": "Advanced", "duration": "3 months" }
    ]
  }
}

Rules:
1. Output ONLY valid JSON.
2. No comments or markdown.
3. Keep it concise but practical.
`;

  try {
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.4 },
    });

    // ✅ Correctly access Gemini output
    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
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