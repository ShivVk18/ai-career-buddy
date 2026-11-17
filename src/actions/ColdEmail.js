"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

import { z } from "zod";
import { withAiAction } from "@/lib/ai";
import { buildSources, formatCatalogForPrompt, snapshot } from "@/lib/ai/sources";
import { generateSourcedParagraphs, allowedNumberText } from "@/lib/ai/paragraphs";
import { safeErr } from "@/lib/utils";
import { COLD_EMAIL_WORDS } from "@/lib/writing";

const NO_SOURCES_MSG =
  "We couldn't ground this in your details. Add more to your profile or resume, or paste a fuller job description, then try again.";

// Single-line text; "" means not provided.
const oneLine = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((v) => !/[\r\n]/.test(v), "single line only");
const optLine = (max) => oneLine(max).optional().transform((v) => v || null);
const optEmail = z
  .string()
  .trim()
  .max(254)
  .optional()
  .transform((v) => v || null)
  .refine((v) => v === null || z.string().email().safeParse(v).success, "invalid email");

const inputSchema = z.object({
  jobTitle: z.string().trim().max(200).default(""),
  companyName: z.string().trim().max(200).default(""),
  jobDescription: z.string().max(20000).nullish(),
  recipientName: optLine(100),
  recipientRole: optLine(150),
  recipientEmail: optEmail,
  jobId: z.string().trim().min(1).max(100).optional(),
});

// null / "" clears; at least one of content / a field is required (checked below).
const clearable = (schema) => z.union([z.null(), z.literal("").transform(() => null), schema]).optional();
const fieldsSchema = z
  .object({
    recipientName: clearable(oneLine(100)),
    recipientRole: clearable(oneLine(150)),
    recipientEmail: clearable(z.string().trim().max(254).email()),
    subject: clearable(oneLine(200)),
  })
  .strict();

const MAX_CONTENT = 10000;
const fail = (code, error) => ({ error, code });

const MIGRATION_MSG = "Cold email is being updated. Please try again in a few minutes.";
/** Prisma P2022 = a column in the schema is missing in the database (migration not applied yet). */
const isMissingColumn = (e) => e?.code === "P2022" || /column .* does not exist/i.test(String(e?.message ?? ""));
const failedOrPending = (error, msg) =>
  isMissingColumn(error) ? fail("MIGRATION_PENDING", MIGRATION_MSG) : fail("FAILED", msg);

// Pre-Phase-5 columns only, so the list keeps working if the Phase 5 migration lags.
const LIST_SELECT = {
  id: true,
  userId: true,
  content: true,
  jobDescription: true,
  companyName: true,
  jobTitle: true,
  status: true,
  sources: true,
  createdAt: true,
  updatedAt: true,
};

// D50: one cap-counted action, however many AI calls it makes.
export async function generateColdEmail(data) {
  return withAiAction(() => generateColdEmailImpl(data));
}

async function generateColdEmailImpl(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const input = inputSchema.safeParse(data ?? {});
  if (!input.success) return fail("INVALID", "Please check the job title, company and description and try again.");
  const { jobTitle, companyName, jobDescription, recipientName, recipientRole, recipientEmail, jobId } = input.data;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");


  // Optional link to one of the caller's jobs (D55). A foreign or deleted job id is refused before any AI call.
  if (jobId) {
    const job = await db.job.findFirst({ where: { id: jobId, userId: user.id, deletedAt: null }, select: { id: true } });
    if (!job) return fail("NOT_FOUND", "We couldn't find that job.");
  }

  const resume = await db.resume.findUnique({ where: { userId: user.id } });
  // Company and role the user typed can be cited by the subject.
  const extra = [
    companyName && { id: "input:companyName", kind: "input", label: "Company you entered", text: companyName },
    jobTitle && { id: "input:jobTitle", kind: "input", label: "Role you entered", text: jobTitle },
  ].filter(Boolean);
  const catalog = buildSources({ profile: user, resume, jobDescription, extra });
  if (catalog.length === 0) return fail("NO_SOURCES", NO_SOURCES_MSG);

  // Cheap column probe BEFORE the AI call: if the Phase 5 columns are not in the database yet, the insert below
  // would fail after a capped AI call was already spent. P2022 => MIGRATION_PENDING with no AI call.
  try {
    await db.coldEmail.findFirst({
      where: { userId: user.id },
      select: { id: true, subject: true, recipientName: true, recipientRole: true, recipientEmail: true, followUpAt: true },
    });
  } catch (error) {
    if (isMissingColumn(error)) return fail("MIGRATION_PENDING", MIGRATION_MSG);
    console.error("generateColdEmail column check failed:", safeErr(error));
    return fail("FAILED", "Failed to generate cold email. Please try again.");
  }

  // PRIVACY (D34): recipientEmail is deliberately NOT used anywhere in this prompt, the source catalog or
  // any other AI input. It is only stored on the row (typed by the user) and used by the user's own
  // "Open in mail client" click. Do not add it here.
  const prompt = `
You are an expert career strategist and cold outreach specialist.

Write a high-impact, personalized cold email for a ${jobTitle || "position"} role at ${companyName || "the company"}.
Candidate name (for the sign-off only): ${user.name || "not provided"}
${recipientName ? `Recipient name (greeting only): ${recipientName}` : "Recipient name: not provided (use a generic greeting)"}
${recipientRole ? `Recipient role (context only): ${recipientRole}` : ""}

SOURCES (the ONLY facts about the candidate and the job you may use; each line is [id] label: text):
${formatCatalogForPrompt(catalog)}

EMAIL STYLE REQUIREMENTS:
1. Start with a strong opening (NOT "I hope you're doing well")
2. Demonstrate understanding of the role needs from the SOURCES
3. Position the candidate as a solution, not just an applicant
4. Highlight 1-2 relevant achievements or strengths that appear in the SOURCES
5. Modern, conversational but professional tone; avoid cliches and buzzwords
6. Concise: ${COLD_EMAIL_WORDS.min}-${COLD_EMAIL_WORDS.max} words in total (greeting and sign-off included)
7. Include a subtle but confident call-to-action
8. NEVER invent employers, titles, dates, degrees, metrics or credentials that are not in the SOURCES
9. No markdown, no placeholders, no email address inside the body
10. If a recipient name is given, greet them by first name ("Hi Priya,"); otherwise use a generic greeting
11. The greeting and the closing must contain no numbers

SUBJECT LINE: also write a short, plain subject (max 8 words, no clickbait, no percentages, no claims about open rates or results, no numbers that are not in the SOURCES) based only on the company, the role or the job description lines. List the ids it is based on in subject.sourceIds (use input:companyName, input:jobTitle or jd ids from SOURCES).

OUTPUT: valid JSON only, no markdown fences, no explanation:
{
  "subject": { "text": "short subject", "sourceIds": ["id copied from SOURCES"] },
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
    const gen = await generateSourcedParagraphs({
      prompt,
      catalog,
      userId,
      withSubject: true,
      userName: user.name,
      allowedText: allowedNumberText(catalog, jobTitle, companyName, user.name, recipientName, recipientRole),
    });
    let { subject } = gen;
    // Plain fallback built only from what the user typed.
    if (!subject && companyName && jobTitle) {
      subject = {
        text: `Interested in the ${jobTitle} role at ${companyName}`.replace(/\s+/g, " ").trim().slice(0, 80).trim(),
        sources: snapshot(["input:jobTitle", "input:companyName"], catalog),
      };
    }
    const sources = subject ? { ...gen.sources, subject: { sources: subject.sources } } : gen.sources;

    const coldEmail = await db.coldEmail.create({
      data: {
        content: gen.content,
        sources,
        subject: subject?.text ?? null,
        recipientName,
        recipientRole,
        recipientEmail,
        jobDescription: jobDescription ?? null,
        companyName,
        jobTitle,
        status: "completed",
        userId: user.id,
        ...(jobId ? { jobId } : {}),
      },
    });

    return coldEmail;
  } catch (error) {
    console.error("generateColdEmail failed:", safeErr(error));
    if (error?.code === "NO_SOURCES") return fail("NO_SOURCES", NO_SOURCES_MSG);
    if (error?.code === "AI_LIMIT") return fail("AI_LIMIT", "Daily AI limit reached. Please try again tomorrow.");
    if (error?.code === "AI_UNAVAILABLE") return fail("AI_UNAVAILABLE", "AI is temporarily unavailable. Please try again later.");
    return failedOrPending(error, "Failed to generate cold email. Please try again.");
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
    select: LIST_SELECT,
  });
}

export async function getColdEmail(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    return await db.coldEmail.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });
  } catch (error) {
    if (isMissingColumn(error)) return fail("MIGRATION_PENDING", MIGRATION_MSG);
    throw error;
  }
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
  content: z.string().trim().min(1).max(MAX_CONTENT).nullish(),
});

/**
 * Saves the user's edited text and/or recipient fields and subject. Owner-scoped. Keeps the stored
 * `sources` untouched (the UI shows a "Based on" list when paragraphs no longer line up). `fields` values
 * are strings or null/"" to clear. Returns the updated row or { error, code }.
 */
export async function updateColdEmail(id, content, fields) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = updateSchema.safeParse({ id, content });
  const parsedFields = fieldsSchema.safeParse(fields ?? {});
  if (!parsed.success) {
    return fail("INVALID", "Please enter some text (up to {MAX} characters) before saving.".replace("{MAX}", String(MAX_CONTENT)));
  }
  if (!parsedFields.success) {
    return fail("INVALID", "Please check the recipient name, role, email address and subject (single line, valid email) and try again.");
  }
  const data = {};
  if (parsed.data.content) data.content = parsed.data.content;
  for (const [k, v] of Object.entries(parsedFields.data)) if (v !== undefined) data[k] = v;
  if (Object.keys(data).length === 0) return fail("INVALID", "There is nothing to save.");

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

    if (data.subject !== undefined) {
      const existing = await db.coldEmail.findFirst({
        where: { id: parsed.data.id, userId: user.id },
        select: { subject: true, sources: true },
      });
      if (!existing) return fail("NOT_FOUND", "We couldn't find that item.");
      const next = (data.subject ?? "").trim();
      const prev = (existing.subject ?? "").trim();
      const src = existing.sources;
      if (next !== prev && src && typeof src === "object" && !Array.isArray(src) && "subject" in src) {
        const { subject: _drop, ...rest } = src;
        data.sources = rest;
      }
    }

    const result = await db.coldEmail.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data,
    });
    if (result.count === 0) return fail("NOT_FOUND", "We couldn't find that item.");

    return await db.coldEmail.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  } catch (error) {
    console.error("updateColdEmail failed:", safeErr(error));
    return failedOrPending(error, "We couldn't save your changes. Please try again.");
  }
}

const followUpSchema = z.object({
  id: z.string().trim().min(1).max(100),
  date: z.union([z.null(), z.string().trim().min(8).max(40)]),
});

/** "YYYY-MM-DD" or ISO-8601 -> Date at 00:00 UTC of that day, or null when invalid. */
function dayStartUTC(input) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/.exec(input);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  if (/[T ]/.test(input) && Number.isNaN(new Date(input).getTime())) return null;
  return dt;
}

/** Sets or clears (date = null) the follow-up reminder. A reminder only: nothing is ever sent. Owner-scoped. */
export async function setColdEmailFollowUp(id, date) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = followUpSchema.safeParse({ id, date: date ?? null });
  const when = parsed.success && parsed.data.date !== null ? dayStartUTC(parsed.data.date) : null;
  if (!parsed.success || (parsed.data.date !== null && !when)) {
    return fail("INVALID", "Please choose a valid follow-up date.");
  }

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

    const result = await db.coldEmail.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: { followUpAt: when },
    });
    if (result.count === 0) return fail("NOT_FOUND", "We couldn't find that item.");

    return await db.coldEmail.findFirst({ where: { id: parsed.data.id, userId: user.id } });
  } catch (error) {
    console.error("setColdEmailFollowUp failed:", safeErr(error));
    return failedOrPending(error, "We couldn't save the reminder. Please try again.");
  }
}
