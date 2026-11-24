"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { authUser } from "@/lib/runAsUser";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { buildSources, formatCatalogForPrompt } from "@/lib/ai/sources";
import { generateSourcedParagraphs, allowedNumberText, withUpdatedHashes } from "@/lib/ai/paragraphs";
import { runAIStructured, withAiAction } from "@/lib/ai";
import { shortenSchema } from "@/lib/ai/schemas";
import { inventedNumbers } from "@/lib/ai/numberCheck";
import { safeErr } from "@/lib/utils";
import { pruneDeleted, undoCutoff } from "@/lib/softDelete";
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
  jobId: z.string().trim().min(1).max(100).optional(),
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

/** Read shape: the tone used for the last generation lives in sources.tone (null on older letters). */
const withTone = (row) => {
  if (!row) return row;
  const t = row.sources?.tone;
  return { ...row, tone: COVER_LETTER_TONES.includes(t) ? t : null };
};

/**
 * One level of undo for replace-in-place edits: the current content and sources (without their own
 * `previous`) are kept in sources.previous. Returns the sources object to store with the NEW content.
 */
function withPrevious(newSources, row) {
  const old = row.sources && typeof row.sources === "object" && !Array.isArray(row.sources) ? row.sources : null;
  const { previous: _older, ...oldSources } = old ?? {};
  return { ...newSources, previous: { content: row.content, sources: old ? oldSources : null, at: new Date().toISOString() } };
}

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
9. The greeting and the closing must contain no numbers

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

// D50: one cap-counted action, however many AI calls it makes.
export async function generateCoverLetter(data) {
  return withAiAction(() => generateCoverLetterImpl(data));
}

async function generateCoverLetterImpl(data) {
  const { userId } = await authUser();
  if (!userId) throw new Error("Unauthorized");

  const input = inputSchema.safeParse(data ?? {});
  if (!input.success) return fail("INVALID", "Please check the job title, company and description and try again.");
  const { jobTitle, companyName, jobDescription, tone, jobId } = input.data;

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

  // Optional link to one of the caller's jobs (D55). A foreign or deleted job id is refused before any AI call.
  if (jobId) {
    const job = await db.job.findFirst({ where: { id: jobId, userId: user.id, deletedAt: null }, select: { id: true } });
    if (!job) return fail("NOT_FOUND", "We couldn't find that job.");
  }

  const resume = await db.resume.findUnique({ where: { userId: user.id, deletedAt: null } });
  const catalog = buildSources({ profile: user, resume, jobDescription });
  if (catalog.length === 0) return fail("NO_SOURCES", NO_SOURCES_MSG);

  const prompt = letterPrompt({ jobTitle, companyName, catalog, tone });

  try {
    const { content, sources } = await generateSourcedParagraphs({
      prompt,
      catalog,
      userId,
      userName: user.name,
      allowedText: allowedNumberText(catalog, jobTitle, companyName),
    });

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        sources: { ...sources, tone: tone || DEFAULT_TONE },
        jobDescription: jobDescription ?? null,
        companyName,
        jobTitle,
        status: "completed",
        userId: user.id,
        ...(jobId ? { jobId } : {}),
      },
    });

    return withTone(coverLetter);
  } catch (error) {
    console.error("generateCoverLetter failed:", safeErr(error));
    return genError(error, "generate cover letter");
  }
}

export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  await pruneDeleted(user.id);
  const rows = await db.coverLetter.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return rows.map(withTone);
}

export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

  return withTone(
    await db.coverLetter.findFirst({
      where: {
        id: typeof id === "string" ? id : "",
        userId: user.id,
        deletedAt: null,
      },
    })
  );
}

/** Soft delete (D60): sets deletedAt. Undo with restoreCoverLetter (7 days). Returns { success: true, id } or { error, code }. */
export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const pid = idSchema.safeParse(id);
  if (!pid.success) return fail("INVALID", "We couldn't find that item.");
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    const res = await db.coverLetter.updateMany({
      where: { id: pid.data, userId: user.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (res.count === 0) return fail("NOT_FOUND", "We couldn't find that item.");
    return { success: true, id: pid.data };
  } catch (error) {
    console.error("deleteCoverLetter failed:", safeErr(error));
    return fail("FAILED", "We couldn't delete that letter. Please try again.");
  }
}

/** Undo for deleteCoverLetter. Works for 7 days after the delete. Returns { success: true, id } or { error, code }. */
export async function restoreCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const pid = idSchema.safeParse(id);
  if (!pid.success) return fail("INVALID", "We couldn't find that item.");
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    const res = await db.coverLetter.updateMany({
      where: { id: pid.data, userId: user.id, deletedAt: { not: null, gte: undoCutoff() } },
      data: { deletedAt: null },
    });
    if (res.count === 0) return fail("NOT_FOUND", "That letter can't be restored any more.");
    return { success: true, id: pid.data };
  } catch (error) {
    console.error("restoreCoverLetter failed:", safeErr(error));
    return fail("FAILED", "We couldn't restore that letter. Please try again.");
  }
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
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

    const result = await db.coverLetter.updateMany({
      where: { id: parsed.data.id, userId: user.id, deletedAt: null },
      data: { content: parsed.data.content },
    });
    if (result.count === 0) return fail("NOT_FOUND", "We couldn't find that item.");

    return withTone(await db.coverLetter.findFirst({ where: { id: parsed.data.id, userId: user.id, deletedAt: null } }));
  } catch (error) {
    console.error("updateCoverLetter failed:", safeErr(error));
    return fail("FAILED", "We couldn't save your changes. Please try again.");
  }
}

/**
 * D43: replaces content and sources of the SAME row with a fresh generation (new tone and/or more
 * formal). The previous text and edits are lost, so the UI confirms first. Owner-scoped.
 */
// D50: one cap-counted action, however many AI calls it makes.
export async function regenerateCoverLetter(id, opts) {
  return withAiAction(() => regenerateCoverLetterImpl(id, opts));
}

async function regenerateCoverLetterImpl(id, opts) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsedId = idSchema.safeParse(id);
  const parsedOpts = regenOptsSchema.safeParse(opts ?? {});
  if (!parsedId.success || !parsedOpts.success) return fail("INVALID", "Please choose a valid tone and try again.");
  const { tone, formality } = parsedOpts.data;

  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

    const row = await db.coverLetter.findFirst({ where: { id: parsedId.data, userId: user.id, deletedAt: null } });
    if (!row) return fail("NOT_FOUND", "We couldn't find that item.");

    const resume = await db.resume.findUnique({ where: { userId: user.id, deletedAt: null } });
    const catalog = buildSources({ profile: user, resume, jobDescription: row.jobDescription });
    if (catalog.length === 0) return fail("NO_SOURCES", NO_SOURCES_MSG);

    const storedTone = COVER_LETTER_TONES.includes(row.sources?.tone) ? row.sources.tone : null;
    const useTone = tone || storedTone || DEFAULT_TONE;
    const prompt = letterPrompt({ jobTitle: row.jobTitle, companyName: row.companyName, catalog, tone: useTone, formality });
    const { content, sources } = await generateSourcedParagraphs({
      prompt,
      catalog,
      userId,
      userName: user.name,
      allowedText: allowedNumberText(catalog, row.jobTitle, row.companyName),
    });

    // The previous text and sources are kept in sources.previous (one level) so the user can undo.
    const res = await db.coverLetter.updateMany({
      where: { id: row.id, userId: user.id, deletedAt: null },
      data: { content, sources: withPrevious({ ...sources, tone: useTone }, row) },
    });
    if (res.count === 0) return fail("NOT_FOUND", "We couldn't find that item.");
    return withTone(await db.coverLetter.findFirst({ where: { id: row.id, userId: user.id, deletedAt: null } }));
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
// D50: one cap-counted action, however many AI calls it makes.
export async function shortenCoverLetter(id) {
  return withAiAction(() => shortenCoverLetterImpl(id));
}

async function shortenCoverLetterImpl(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return fail("INVALID", "We couldn't find that item.");

  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

    const row = await db.coverLetter.findFirst({ where: { id: parsedId.data, userId: user.id, deletedAt: null } });
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
      where: { id: row.id, userId: user.id, deletedAt: null, content: row.content }, // not changed since we read it
      // Source ids stay exactly as stored; only the hash of a rewritten paragraph is refreshed (when it had one).
      // The text before shortening is kept in sources.previous (one level) for undoLetterChange.
      data: { content: res.next.join("\n\n"), sources: withPrevious(withUpdatedHashes(row.sources, paras, res.next) ?? {}, row) },
    });
    if (updated.count === 0) return fail("FAILED", "The letter changed while shortening. Please try again.");
    return withTone(await db.coverLetter.findFirst({ where: { id: row.id, userId: user.id, deletedAt: null } }));
  } catch (error) {
    console.error("shortenCoverLetter failed:", safeErr(error));
    return genError(error, "shorten the cover letter");
  }
}

/**
 * Undo for regenerateCoverLetter / shortenCoverLetter (and the formal and tone changes): swaps the saved
 * previous content and sources back and clears them (one level only). Owner-scoped. Returns the letter row or
 * { error, code: "INVALID" | "NOT_FOUND" | "NOTHING_TO_UNDO" | "FAILED" }.
 */
export async function undoLetterChange(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const pid = idSchema.safeParse(id);
  if (!pid.success) return fail("INVALID", "We couldn't find that item.");
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    const row = await db.coverLetter.findFirst({ where: { id: pid.data, userId: user.id, deletedAt: null } });
    if (!row) return fail("NOT_FOUND", "We couldn't find that item.");
    const prev = row.sources?.previous;
    if (!prev || typeof prev.content !== "string" || !prev.content.trim()) {
      return fail("NOTHING_TO_UNDO", "There is nothing to undo for this letter.");
    }
    const { previous: _drop, ...rest } = prev.sources && typeof prev.sources === "object" ? prev.sources : {};
    const restored = Object.keys(rest).length ? rest : null;
    const res = await db.coverLetter.updateMany({
      // Only if the letter still holds the sources we read (no concurrent change).
      where: { id: row.id, userId: user.id, deletedAt: null, content: row.content },
      data: { content: prev.content, sources: restored ?? Prisma.DbNull },
    });
    if (res.count === 0) return fail("FAILED", "The letter changed in the meantime. Please try again.");
    return withTone(await db.coverLetter.findFirst({ where: { id: row.id, userId: user.id, deletedAt: null } }));
  } catch (error) {
    console.error("undoLetterChange failed:", safeErr(error));
    return fail("FAILED", "We couldn't undo that change. Please try again.");
  }
}
