"use server";

import { db } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { safeErr } from "@/lib/utils";
import { primaryEmail } from "@/lib/clerkEmail";
import { z } from "zod";

const profileSchema = z.object({
  industry: z.string().trim().min(1).max(100),
  experience: z.coerce.number().int().min(0).max(60),
  skills: z.array(z.string().trim().min(1).max(50)).max(50).optional().nullable(),
  bio: z.string().trim().max(500).optional().nullable(),
});

const fail = (code, error) => ({ error, code });

/**
 * Validates and saves the onboarding profile. Signed-out THROWS Error("Unauthorized"); every other failure is
 * RETURNED as { error, code } (INVALID | NOT_FOUND | FAILED). Success returns the updated user plus success: true.
 */
export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = profileSchema.safeParse(data ?? {});
  if (!parsed.success) {
    return fail(
      "INVALID",
      "Please check your profile: pick an industry, enter experience between 0 and 60 years, up to 50 skills (50 characters each) and a bio under 500 characters."
    );
  }
  const input = parsed.data;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please sign in again.");

  try {
    const updatedUser = await db.$transaction(async (tx) => {
      // Ensure the IndustryInsight record exists to satisfy the User.industry foreign key.
      // PLACEHOLDER ONLY: these rows carry no real data (growthRate 0, "Medium", "Neutral"). Nothing reads or
      // shows them; keep it that way until Phase 8 (sourced industry insights) replaces them.
      let industryInsight = await tx.industryInsight.findUnique({
        where: {
          industry: input.industry,
        },
      });

      if (!industryInsight) {
        await tx.industryInsight.create({
          data: {
            industry: input.industry,
            salaryRanges: [],
            growthRate: 0.0,
            demandLevel: "Medium",
            topSkills: [],
            marketOutlook: "Neutral",
            keyTrends: [],
            recommendedSkills: [],
            jobAvailability: [],
            hiringTrends: [],
            hybridWorkTrends: [],
            nextUpdate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Far future update
          },
        });
      }

      // Update the user details
      return await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          industry: input.industry,
          experience: input.experience,
          bio: input.bio ?? "",
          skills: input.skills ?? [],
        },
      });
    }, {
      timeout: 10000,
    });

    revalidatePath("/");
    return { ...updatedUser, success: true };
  } catch (error) {
    console.error("updateUser failed:", safeErr(error));
    return fail("FAILED", "We couldn't save your profile. Please try again.");
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
        email: primaryEmail(clerkUser),
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