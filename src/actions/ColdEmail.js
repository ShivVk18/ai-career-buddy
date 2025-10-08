"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import AiServices from "@/services/AiServices";

export async function generateColdEmail(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const content = await AiServices.generateColdEmail(data, user);

    const coldEmail = await db.coldEmail.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: "completed",
        userId: user.id,
      },
    });

    return coldEmail;
  } catch (error) {
    console.error("Error generating cold email:", error.message);
    throw new Error("Failed to generate cold email");
  }
}

export async function getColdEmails() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coldEmail.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getColdEmail(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coldEmail.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteColdEmail(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coldEmail.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}