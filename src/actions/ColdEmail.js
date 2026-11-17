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

const MAX_CONTENT = 10000;
const fail = (code, error) => ({ error, code });

export async function generateColdEmail(data) {
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
You are an expert career strategist and cold outreach specialist.

Write a high-impact, personalized cold email for a ${jobTitle || "position"} role at ${companyName || "the company"}.
Candidate name (for the sign-off only): ${user.name || "not provided"}

SOURCES (the ONLY facts about the candidate and the job you may use; each line is [id] label: text):
${formatCatalogForPrompt(catalog)}

EMAIL STYLE REQUIREMENTS:
1. Start with a strong opening (NOT "I hope you're doing well")
2. Demonstrate understanding of the role needs from the SOURCES
3. Position the candidate as a solution, not just an applicant
4. Highlight 1-2 relevant achievements or strengths that appear in the SOURCES
5. Modern, conversational but professional tone; avoid cliches and buzzwords
6. Concise: 100-140 words in total
7. Include a subtle but confident call-to-action
8. NEVER invent employers, titles, dates, degrees, metrics or credentials that are not in the SOURCES
9. No subject line, no markdown, no placeholders, no email address

OUTPUT: valid JSON only, no markdown fences, no explanation:
{
  "paragraphs": [
    { "kind": "greeting", "text": "Hi there,", "sourceIds": [] },
    { "kind": "body", "text": "paragraph text", "sourceIds": ["id copied from SOURCES"] },
    { "kind": "closing", "text": "call-to-action and sign-off", "sourceIds": [] }
  ]
}
RULES FOR THE JSON:
- Exactly one greeting first, 1-3 body paragraphs, exactly one closing last.
- Every body paragraph MUST list one or more sourceIds, copied exactly from the SOURCES list, for the facts it uses.
- Each paragraph is a single block of text with no blank lines inside it.
`;

  try {
    const { content, sources } = await generateSourcedParagraphs({ prompt, catalog, userId });

    const coldEmail = await db.coldEmail.create({
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

    return coldEmail;
  } catch (error) {
    console.error("generateColdEmail failed:", safeErr(error));
    if (error?.code === "NO_SOURCES") return fail("NO_SOURCES", NO_SOURCES_MSG);
    if (error?.code === "AI_LIMIT") return fail("AI_LIMIT", "Daily AI limit reached. Please try again tomorrow.");
    if (error?.code === "AI_UNAVAILABLE") return fail("AI_UNAVAILABLE", "AI is temporarily unavailable. Please try again later.");
    return fail("FAILED", "Failed to generate cold email. Please try again.");
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

const updateSchema = z.object({
  id: z.string().trim().min(1).max(100),
  content: z.string().trim().min(1).max(MAX_CONTENT),
});

/**
 * Saves the user's edited text. Owner-scoped. Keeps the stored `sources` untouched (the UI shows a
 * "Based on" list when paragraphs no longer line up). Returns the updated row or { error, code }.
 */
export async function updateColdEmail(id, content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = updateSchema.safeParse({ id, content });
  if (!parsed.success) {
    return fail("INVALID", "Please enter some text (up to {MAX} characters) before saving.".replace("{MAX}", String(MAX_CONTENT)));
  }

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

    const result = await db.coldEmail.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: { content: parsed.data.content },
    });
    if (result.count === 0) return fail("NOT_FOUND", "We couldn't find that item.");

    return await db.coldEmail.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  } catch (error) {
    console.error("updateColdEmail failed:", safeErr(error));
    return fail("FAILED", "We couldn't save your changes. Please try again.");
  }
}
