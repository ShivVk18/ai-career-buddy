"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import AiServices from "@/services/AiServices";

export async function generateCareerRoadmap(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const roadmapData = await AiServices.generateCareerRoadmap(data, user);

    const careerPath = await db.careerPath.create({
      data: {
        currentRole: data.currentRole,
        targetRole: data.targetRole,
        industry: data.industry,
        steps: roadmapData.steps,
        milestones: roadmapData.milestones,
        resources: roadmapData.resources,
        timeline: roadmapData.timeline,
        progress: 0,
        currentStep: 0,
        status: "active",
        userId: user.id,
      },
    });

    return careerPath;
  } catch (error) {
    console.error("Error generating career roadmap:", error.message);
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