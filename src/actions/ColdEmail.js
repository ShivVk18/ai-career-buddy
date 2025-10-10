"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

import { GoogleGenAI } from "@google/genai";


const client = new GoogleGenAI({ apiKey: 'AIzaSyAMjXbGRCMAywCkc4eZ0jCrKk0AAz_NGRs' });  

export async function generateColdEmail(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

     


  const prompt = `Write a professional and compelling cold email for a ${
  data.jobTitle || "position"
} position at ${data.companyName || "the company"}.

About the candidate:
- Industry: ${user.industry || "N/A"}
- Years of Experience: ${user.experience || "N/A"}
- Name:${user.name}
- Email:${user.email}

Job Description:
${data.jobDescription || "N/A"}

Requirements for the email:
1. Keep it concise (max 100-150 words)
2. Use a confident, professional, and approachable tone
3. Grab attention in the first line
4. Highlight key achievements and relevant skills
5. Show understanding of the company's needs
6. Include a call-to-action (e.g., request a meeting, interview, or call)
7. Avoid generic phrases; personalize based on the job description
8. Format in a professional email structure (greeting, body, closing, signature)

Output ONLY the email text (no extra commentary, JSON not required).`;
  

  try {
    const content = await client.models.generateContent({
       model:'gemini-2.5-flash-lite',
       contents:prompt,
       config:{
        temperature:0.3
       }
    })  

    

    const coldEmail = await db.coldEmail.create({
      data: {
        content:content.text,
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
