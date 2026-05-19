"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

import { GoogleGenAI } from "@google/genai";


const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });  

export async function generateColdEmail(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

     


  const prompt = `
You are an expert career strategist and cold outreach specialist.

Write a high-impact, personalized cold email for a ${
  data.jobTitle || "position"
} role at ${data.companyName || "the company"}.

Candidate Profile:
- Name: ${user.name}
- Industry: ${user.industry || "N/A"}
- Experience: ${user.experience || "N/A"}
- Email: ${user.email}

Job Context:
${data.jobDescription || "N/A"}

CRITICAL OBJECTIVE:
The email must feel human-written, confident, and tailored — not generic.

EMAIL STYLE REQUIREMENTS:

1. Start with a strong, attention-grabbing opening (NOT "I hope you're doing well")
2. Demonstrate clear understanding of the company / role needs
3. Position candidate as a solution, not just an applicant
4. Highlight 1–2 relevant achievements or strengths
5. Show enthusiasm without sounding desperate
6. Use a modern, conversational but professional tone
7. Keep it concise (100–140 words)
8. Avoid clichés and generic phrases
9. Include a subtle but confident call-to-action
10. Make it feel like a real human wrote it

STRUCTURE:

• Personalized greeting  
• Hooking opening line  
• Value proposition / relevance  
• Achievement or capability highlight  
• Alignment with company goals  
• Clear call-to-action  
• Professional closing & signature  

OUTPUT RULES:

- Output ONLY the email text
- Do NOT include subject line
- Do NOT include explanations
- Do NOT include markdown
- Do NOT include placeholders
- Do NOT use overly formal or robotic language
- Avoid buzzwords like "synergy", "leverage", "dynamic professional"

Write like a smart, ambitious candidate reaching out strategically.
`;
  

  try {
    const content = await client.models.generateContent({
       model:'gemini-2.5-flash',
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
