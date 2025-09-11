"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import AiServices from "@/services/AiServices";

export const generateAIInsights = async (industry) => {
  return await AiServices.generateIndustryInsights(industry);
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  
  if (!user.industryInsight) {
    try {
      const insights = await  AiServices.generateIndustryInsights(user.industry);

      const industryInsight = await db.industryInsight.create({
        data: {
          industry: user.industry,
          ...insights,
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return industryInsight;
    } catch (error) {
      console.error("Error generating industry insights:", error);
      throw new Error("Failed to generate industry insights");
    }
  }

  return user.industryInsight;
}
