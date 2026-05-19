"use server";

import { db } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const updatedUser = await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        industry: data.industry,
        experience: data.experience,
        bio: data.bio,
        skills: data.skills,
      },
    });

    revalidatePath("/");
    return updatedUser;
  } catch (error) {
    console.error("Error updating user profile:", error.message);
    throw new Error("Failed to update profile");
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  // 👇 auto-create user record if it doesn't exist
  if (!user) {
    const client = await clerkClient();  // ✅ Call clerkClient as a function
    const clerkUser = await client.users.getUser(userId);

    user = await db.user.create({
      data: {
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        industry: null,
        experience: null,
        bio: "",
        skills: [],
      },
    });
  }

  return {
    isOnboarded: !!user?.industry,
  };
}