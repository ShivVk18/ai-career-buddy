import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { primaryEmail } from "./clerkEmail";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: primaryEmail(user),
      },
    });

    return newUser;
  } catch (error) {
    console.log(error.message);
  }
};
