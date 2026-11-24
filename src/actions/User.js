"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { safeErr } from "@/lib/utils";
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
    where: { id: userId },
  });

  if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please sign in again.");

  try {
    const updatedUser = await db.$transaction(async (tx) => {
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

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  // The DB user is created by signUp; a valid session whose row is gone (deleted account) is signed out.
  if (!user) throw new Error("Unauthorized");

  // D59: onboarded = has an industry (existing users), OR a resume, OR both onboarding answers.
  let isOnboarded = !!user.industry || (!!user.targetRole && !!user.jobSearchStage);
  if (!isOnboarded) isOnboarded = (await db.resume.count({ where: { userId: user.id, deletedAt: null } })) > 0;
  return { isOnboarded };
}