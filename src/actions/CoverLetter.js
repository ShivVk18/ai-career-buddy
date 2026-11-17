"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { buildSources, formatCatalogForPrompt } from "@/lib/ai/sources";
import { generateSourcedParagraphs } from "@/lib/ai/paragraphs";
import { safeErr } from "@/lib/utils";

const NO_SOURCES_MSG =
  "We couldn't ground this in your details. Add more to your profile or resume, or paste a fuller job description, then try again.";

const inputSchema = z.object({
  jobTitle: z.string().trim().max(200).default(""),
  companyName: z.string().trim().max(200).default(""),
  jobDescription: z.string().max(20000).nullish(),
});

const fail = (code, error) => ({ error, code });

export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const input = inputSchema.safeParse(data ?? {});
  if (!input.success) return fail("INVALID", "Please check the job title, company and description and try again.");
  const { jobTitle, companyName, jobDescription } = input.data;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

  const resume = await db.resume.findUnique({ where: { userId: user.id } });
  const catalog = buildSources({ profile: user, resume, jobDescription });
  if (catalog.length === 0) return fail("NO_SOURCES", NO_SOURCES_MSG);

  const prompt = `
You are an expert career strategist and professional cover letter writer.

Write a compelling, personalized cover letter for a ${jobTitle || "position"} role at ${companyName || "the company"}.

SOURCES (the ONLY facts about the candidate and the job you may use; each line is [id] label: text):
${formatCatalogForPrompt(catalog)}

OBJECTIVE:
Create a high-impact cover letter that positions the candidate as a strong solution to the company's needs.

WRITING STYLE RULES:
1. Use a confident, professional, and modern tone
2. Avoid generic phrases (e.g., "I am excited to apply")
3. Start with a strong engaging opening
4. Highlight 2-3 relevant achievements or strengths that appear in the SOURCES
5. Align candidate skills directly with job requirements from the SOURCES
6. NEVER invent employers, titles, dates, degrees, metrics, projects or credentials that are not in the SOURCES
7. Keep length between 250-350 words
8. Do NOT use bullet points, markdown or placeholders like [Company Name]

OUTPUT: valid JSON only, no markdown fences, no explanation:
{
  "paragraphs": [
    { "kind": "greeting", "text": "Dear Hiring Manager,", "sourceIds": [] },
    { "kind": "body", "text": "paragraph text", "sourceIds": ["id copied from SOURCES"] },
    { "kind": "closing", "text": "closing line with call-to-action and sign-off", "sourceIds": [] }
  ]
}
RULES FOR THE JSON:
- Exactly one greeting first, 2-4 body paragraphs, exactly one closing last.
- Every body paragraph MUST list one or more sourceIds, copied exactly from the SOURCES list, for the facts it uses.
- Each paragraph is a single block of text with no blank lines inside it.
`;

  try {
    const { content, sources } = await generateSourcedParagraphs({ prompt, catalog, userId });

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        sources,
        jobDescription: jobDescription ?? null,
        companyName,
        jobTitle,
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("generateCoverLetter failed:", safeErr(error));
    if (error?.code === "NO_SOURCES") return fail("NO_SOURCES", NO_SOURCES_MSG);
    if (error?.code === "AI_LIMIT") return fail("AI_LIMIT", "Daily AI limit reached. Please try again tomorrow.");
    return fail("FAILED", "Failed to generate cover letter. Please try again.");
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
