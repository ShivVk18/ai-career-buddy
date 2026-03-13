"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import AiServices from "@/services/AiServices";
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
You are an expert career strategist and professional cover letter writer.

Write a compelling, personalized cover letter for a ${data.jobTitle} role at ${data.companyName}.

CANDIDATE PROFILE:
- Industry: ${user.industry || "N/A"}
- Experience: ${user.experience || "N/A"}
- Skills: ${user.skills?.join(", ") || "N/A"}
- Background: ${user.bio || "N/A"}

JOB DESCRIPTION:
${data.jobDescription || "N/A"}

OBJECTIVE:
Create a high-impact cover letter that positions the candidate as a strong solution to the company’s needs.

WRITING STYLE RULES:

1. Use a confident, professional, and modern tone
2. Avoid generic phrases (e.g., "I am excited to apply")
3. Start with a strong engaging opening
4. Demonstrate clear understanding of company challenges or goals
5. Highlight 2–3 relevant achievements or strengths
6. Show measurable impact where possible
7. Align candidate skills directly with job requirements
8. Avoid repeating resume content verbatim
9. Maintain logical flow and storytelling
10. Keep length between 250–350 words

STRUCTURE:

• Professional header  
• Personalized greeting  
• Strong opening paragraph  
• Skills + achievements paragraph  
• Company alignment paragraph  
• Confident closing with call-to-action  
• Professional signature  

FORMATTING RULES:

- Format in clean markdown
- Use proper business letter structure
- Do NOT use bullet points inside paragraphs
- Do NOT include placeholders like [Company Name]
- Do NOT include explanations outside the letter

Write like a strategic candidate, not a generic applicant.
`;

  try {
    const content = await client.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    const coverLetter = await db.coverLetter.create({
      data: {
        content: content.text,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error.message);
    throw new Error("Failed to generate cover letter");
  }
}

export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}
