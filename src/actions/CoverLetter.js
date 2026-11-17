"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { buildSources, formatCatalogForPrompt } from "@/lib/ai/sources";
import { generateSourcedParagraphs, allowedNumberText } from "@/lib/ai/paragraphs";
import { runAIStructured } from "@/lib/ai";
import { shortenSchema } from "@/lib/ai/schemas";
import { inventedNumbers } from "@/lib/ai/numberCheck";
import { safeErr } from "@/lib/utils";
import {
  COVER_LETTER_WORDS,
  COVER_LETTER_TONES,
  COVER_LETTER_FORMALITY,
  DEFAULT_TONE,
  TONE_PROMPTS,
  countWords,
} from "@/lib/writing";

const NO_SOURCES_MSG =
  "We couldn't ground this in your details. Add more to your profile or resume, or paste a fuller job description, then try again.";

const inputSchema = z.object({
  jobTitle: z.string().trim().max(200).default(""),
  companyName: z.string().trim().max(200).default(""),
  jobDescription: z.string().max(20000).nullish(),
  tone: z.enum(COVER_LETTER_TONES).optional(),
});

const regenOptsSchema = z
  .object({
    tone: z.enum(COVER_LETTER_TONES).optional(),
    formality: z.enum(COVER_LETTER_FORMALITY).optional(),
  })
  .strict();

const idSchema = z.string().trim().min(1).max(100);

const MAX_CONTENT = 10000;
const fail = (code, error) => ({ error, code });

function letterPrompt({ jobTitle, companyName, catalog, tone, formality }) {
  const t = TONE_PROMPTS[tone || DEFAULT_TONE];
  const formal =
    formality === "formal"
      ? "\nFORMALITY: make it noticeably more formal: full sentences, no contractions, no colloquial phrases."
      : "";
  return `
You are an expert career strategist and professional cover letter writer.

Write a compelling, personalized cover letter for a ${jobTitle || "position"} role at ${companyName || "the company"}.

SOURCES (the ONLY facts about the candidate and the job you may use; each line is [id] label: text):
${formatCatalogForPrompt(catalog)}

OBJECTIVE:
Create a high-impact cover letter that positions the candidate as a strong solution to the company's needs.

TONE: ${t}${formal}

WRITING STYLE RULES:
1. Use the tone above and stay professional
2. Avoid generic phrases (e.g., "I am excited to apply", "team player", "proven track record")
3. Start with a strong engaging opening
4. Highlight 2-3 relevant achievements or strengths that appear in the SOURCES
5. Align candidate skills directly with job requirements from the SOURCES
6. NEVER invent employers, titles, dates, degrees, metrics, projects or credentials that are not in the SOURCES
7. Keep length between ${COVER_LETTER_WORDS.min}-${COVER_LETTER_WORDS.max} words
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
}

function genError(error, what) {
  if (error?.code === "NO_SOURCES") return fail("NO_SOURCES", NO_SOURCES_MSG);
  if (error?.code === "AI_LIMIT") return fail("AI_LIMIT", "Daily AI limit reached. Please try again tomorrow.");
  if (error?.code === "AI_UNAVAILABLE") return fail("AI_UNAVAILABLE", "AI is temporarily unavailable. Please try again later.");
  return fail("FAILED", `Failed to ${what}. Please try again.`);
}

export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const input = inputSchema.safeParse(data ?? {});
  if (!input.success) return fail("INVALID", "Please check the job title, company and description and try again.");
  const { jobTitle, companyName, jobDescription, tone } = input.data;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

  const resume = await db.resume.findUnique({ where: { userId: user.id } });
  const catalog = buildSources({ profile: user, resume, jobDescription });
  if (catalog.length === 0) return fail("NO_SOURCES", NO_SOURCES_MSG);

  const prompt = letterPrompt({ jobTitle, companyName, catalog, tone });

  try {
    const { content, sources } = await generateSourcedParagraphs({
      prompt,
      catalog,
      userId,
      allowedText: allowedNumberText(catalog, jobTitle, companyName),
    });

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
    return genError(error, "generate cover letter");
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

const updateSchema = z.object({
  id: z.string().trim().min(1).max(100),
  content: z.string().trim().min(1).max(MAX_CONTENT),
});

/**
 * Saves the user's edited text. Owner-scoped. Keeps the stored `sources` untouched (the UI shows a
 * "Based on" list when paragraphs no longer line up). Returns the updated row or { error, code }.
 */
export async function updateCoverLetter(id, content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = updateSchema.safeParse({ id, content });
  if (!parsed.success) {
    return fail("INVALID", "Please enter some text (up to {MAX} characters) before saving.".replace("{MAX}", String(MAX_CONTENT)));
  }

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

    const result = await db.coverLetter.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: { content: parsed.data.content },
    });
    if (result.count === 0) return fail("NOT_FOUND", "We couldn't find that item.");

    return await db.coverLetter.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  } catch (error) {
    console.error("updateCoverLetter failed:", safeErr(error));
    return fail("FAILED", "We couldn't save your changes. Please try again.");
  }
}

/**
 * D43: replaces content and sources of the SAME row with a fresh generation (new tone and/or more
 * formal). The previous text and edits are lost, so the UI confirms first. Owner-scoped.
 */
export async function regenerateCoverLetter(id, opts) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsedId = idSchema.safeParse(id);
  const parsedOpts = regenOptsSchema.safeParse(opts ?? {});
  if (!parsedId.success || !parsedOpts.success) return fail("INVALID", "Please choose a valid tone and try again.");
  const { tone, formality } = parsedOpts.data;

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

    const row = await db.coverLetter.findFirst({ where: { id: parsedId.data, userId: user.id } });
    if (!row) return fail("NOT_FOUND", "We couldn't find that item.");

    const resume = await db.resume.findUnique({ where: { userId: user.id } });
    const catalog = buildSources({ profile: user, resume, jobDescription: row.jobDescription });
    if (catalog.length === 0) return fail("NO_SOURCES", NO_SOURCES_MSG);

    const prompt = letterPrompt({ jobTitle: row.jobTitle, companyName: row.companyName, catalog, tone, formality });
    const { content, sources } = await generateSourcedParagraphs({
      prompt,
      catalog,
      userId,
      allowedText: allowedNumberText(catalog, row.jobTitle, row.companyName),
    });

    const res = await db.coverLetter.updateMany({
      where: { id: row.id, userId: user.id },
      data: { content, sources },
    });
    if (res.count === 0) return fail("NOT_FOUND", "We couldn't find that item.");
    return await db.coverLetter.findFirst({ where: { id: row.id, userId: user.id } });
  } catch (error) {
    console.error("regenerateCoverLetter failed:", safeErr(error));
    return genError(error, "regenerate the cover letter");
  }
}

const SHORTEN_NOTE =
  "\n\nIMPORTANT: your previous answer added details that are not in the current letter or was not shorter. Use only facts and numbers already in the current paragraph, and make each paragraph clearly shorter.";

/**
 * Rewrites the BODY paragraphs of the current saved text shorter, in place. Each paragraph keeps its
 * stored sources exactly (no new ids); greeting and closing are untouched. Numbers must already appear
 * in the current text (inventedNumbers). Owner-scoped.
 */
export async function shortenCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return fail("INVALID", "We couldn't find that item.");

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

    const row = await db.coverLetter.findFirst({ where: { id: parsedId.data, userId: user.id } });
    if (!row) return fail("NOT_FOUND", "We couldn't find that item.");

    const paras = String(row.content ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const stored = row.sources?.paragraphs;
    if (!Array.isArray(stored) || stored.length !== paras.length) {
      return fail(
        "NOT_SHORTENABLE",
        "This letter has no matching sources (it is older or its paragraphs were changed), so we can't shorten it safely. Try Regenerate instead."
      );
    }

    const bodyIdx = stored.map((p, i) => (p?.kind === "body" ? i : -1)).filter((i) => i >= 0);
    if (bodyIdx.length === 0) return fail("NOT_SHORTENABLE", "There are no body paragraphs to shorten. Try Regenerate instead.");

    const before = paras.reduce((n, p) => n + countWords(p), 0);
    const body = bodyIdx
      .map((i) => `#${i}: ${paras[i]}\n(based on: ${(stored[i].sources || []).map((s) => s.label).join("; ") || "your details"})`)
      .join("\n\n");
    const basePrompt = `
You shorten paragraphs of a cover letter without changing their meaning.

For each numbered paragraph below, rewrite it shorter (about 25% fewer words, keep the strongest point).
STRICT RULES:
- Use ONLY facts, names and numbers already present in that paragraph. Add nothing new.
- Keep the same voice and tone. Plain text, no markdown, no bullet points.
- Return exactly one entry per paragraph, using the same index.

PARAGRAPHS:
${body}

OUTPUT: valid JSON only, no markdown fences:
{ "paragraphs": [ { "index": ${bodyIdx[0]}, "text": "shorter paragraph" } ] }
`;

    const attempt = async (note) => {
      const out = await runAIStructured("write", shortenSchema, () => [["user", basePrompt + note]], { userId });
      const byIdx = new Map(out.paragraphs.map((p) => [p.index, p.text.replace(/\s*\n+\s*/g, " ").trim()]));
      const next = [...paras];
      let invented = false;
      for (const i of bodyIdx) {
        const t = byIdx.get(i);
        if (!t) continue;
        if (inventedNumbers(t, row.content).length > 0) {
          invented = true;
          continue;
        }
        if (countWords(t) < countWords(paras[i])) next[i] = t; // never keep a longer rewrite
      }
      return { next, invented, words: next.reduce((n, p) => n + countWords(p), 0) };
    };

    let res = await attempt("");
    if (res.invented || res.words >= before) {
      try {
        const retry = await attempt(SHORTEN_NOTE);
        if (retry.words < before && !retry.invented) res = retry;
        else if (retry.words < res.words && !res.invented) res = retry;
      } catch (e) {
        if (e?.code === "AI_LIMIT") throw e;
      }
    }
    if (res.invented && res.words >= before) {
      return fail(
        "INVENTED_DETAIL",
        "We couldn't shorten this without adding details that aren't in your letter. Your letter was not changed."
      );
    }
    if (res.words >= before) return fail("FAILED", "We couldn't make this letter shorter. Your letter was not changed.");

    const updated = await db.coverLetter.updateMany({
      where: { id: row.id, userId: user.id, content: row.content }, // not changed since we read it
      data: { content: res.next.join("\n\n") }, // sources stay exactly as stored
    });
    if (updated.count === 0) return fail("FAILED", "The letter changed while shortening. Please try again.");
    return await db.coverLetter.findFirst({ where: { id: row.id, userId: user.id } });
  } catch (error) {
    console.error("shortenCoverLetter failed:", safeErr(error));
    return genError(error, "shorten the cover letter");
  }
}
