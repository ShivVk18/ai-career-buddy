"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { runAIText, runAIStructured, withAiAction } from "@/lib/ai";
import { tailorSchema } from "@/lib/ai/schemas";
import { matchText, resumeToText } from "@/lib/match";
import { safeErr } from "@/lib/utils";
import { undoCutoff } from "@/lib/softDelete";
import { z } from "zod";
import { inventedNumbers } from "@/lib/ai/numberCheck";
import { legacyEntryId } from "@/lib/entryIds";
import { assignEntryIds, buildSources, snapshot, validateSourceIds, formatCatalogForPrompt, normalizeText } from "@/lib/ai/sources";

// Helper function to validate and sanitize resume data
async function validateResumeData(data) {
  let templateId = null;
  
  // If templateId is provided, check if it's a templateKey or actual ID
  if (data.templateId) {
    // Try to find template by templateKey first (for frontend compatibility)
    const template = await db.resumeTemplate.findFirst({
      where: {
        OR: [
          { id: data.templateId },
          { templateKey: data.templateId }
        ]
      }
    });
    
    if (template) {
      templateId = template.id;
    } else {
      console.warn(`Template not found: ${data.templateId}`);
      templateId = null;
    }
  }
  
  return {
    content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content || ''),
    templateId: templateId,
    photoUrl: data.photoUrl || null,
    contactInfo: data.contactInfo || null,
    summary: data.summary || null,
    skills: data.skills || null,
    // Stable entry ids are assigned only here, on save. Existing ids are kept.
    experience: assignEntryIds(data.experience, "exp"),
    education: assignEntryIds(data.education, "edu"),
    projects: assignEntryIds(data.projects, "proj"),
  };
}

// ---------------------------------------------------------------------------------------------
// Versions (D36). A version is a ResumeVersion row whose tailoredContent holds a small JSON envelope:
//   { kind: "version" | "draft", v: 1, label, content?, applied?, proposals? }
// "version" rows hold a full snapshot of the resume form JSON in `content`; "draft" rows hold the
// pending tailoring proposals the server generated (never listed, never trusted from the client).
// No migration: the label lives in the envelope. Rows written before Phase 4 hold a plain string.
// ---------------------------------------------------------------------------------------------

/** Fields reset when a soft-deleted resume row is reused by a new resume. */
const BLANK_RESUME = { customCSS: null, atsScore: null, feedback: null };
const DRAFT_PREFIX = '{"kind":"draft"';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const fail = (code, error) => ({ error, code });
const dateLabel = (d = new Date()) => d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
const NO_RESUME_MSG = "Save your resume first, then try again.";
const AI_LIMIT_MSG = "Daily AI limit reached. Please try again tomorrow.";
const AI_UNAVAILABLE_MSG = "AI is temporarily unavailable. Please try again later.";

function encodeVersion(kind, body) {
  return JSON.stringify({ kind, v: 1, ...body });
}

/** Returns the envelope, or { kind: "legacy" } for plain-string rows from before Phase 4. */
function decodeVersion(row) {
  try {
    const o = JSON.parse(row.tailoredContent);
    if (o && typeof o === "object" && (o.kind === "version" || o.kind === "draft")) return o;
  } catch {}
  return { kind: "legacy" };
}

/** The resume form JSON, exactly what saveResume accepts (templateId is the templateKey). */
function formSnapshot(r) {
  return {
    content: r.content ?? "",
    templateId: r.template?.templateKey ?? null,
    photoUrl: r.photoUrl ?? null,
    contactInfo: r.contactInfo ?? null,
    summary: r.summary ?? null,
    skills: r.skills ?? null,
    experience: Array.isArray(r.experience) ? r.experience : [],
    education: Array.isArray(r.education) ? r.education : [],
    projects: Array.isArray(r.projects) ? r.projects : [],
  };
}

async function loadOwner(clerkUserId) {
  const user = await db.user.findUnique({ where: { clerkUserId }, select: { id: true, industry: true, skills: true, bio: true, experience: true } });
  if (!user) return { user: null, resume: null };
  const resume = await db.resume.findUnique({ where: { userId: user.id, deletedAt: null }, include: { template: true } });
  return { user, resume };
}

const NO_PROFILE = fail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");

export async function saveResume(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Validate and sanitize data (this now handles template lookup)
    const sanitizedData = await validateResumeData(data);

    // A soft-deleted resume row is reused by a new save: reset what the form does not send, so nothing of
    // the old resume leaks into the new one (the "Deleted resume" snapshot version keeps the old content).
    const previous = await db.resume.findUnique({ where: { userId: user.id }, select: { deletedAt: true } });
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: previous?.deletedAt ? { ...BLANK_RESUME, ...sanitizedData, deletedAt: null } : sanitizedData,
      create: {
        userId: user.id,
        ...sanitizedData,
      },
    });

   
    if (sanitizedData.templateId) {
      await db.resumeTemplate.update({
        where: { id: sanitizedData.templateId },
        data: {
          usageCount: { increment: 1 },
        },
      }).catch((error) => {
        console.warn("Template usage count update failed:", error);
        // Don't throw - this is non-critical
      });
    }

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("saveResume failed:", safeErr(error));
    const known = ["Unauthorized", "User not found"];
    throw new Error(known.includes(error?.message) ? error.message : "Failed to save resume");
  }
}

export async function getResume() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return null;

    const resume = await db.resume.findUnique({
      where: {
        userId: user.id,
        deletedAt: null,
      },
      include: {
        template: true,
      },
    });

    
    if (resume && resume.template) {
      return {
        ...resume,
        templateId: resume.template.templateKey, 
      };
    }

    return resume;
  } catch (error) {
    console.error("getResume failed:", safeErr(error));
    return null;
  }
}

export async function getResumeTemplates() {
  try {
    const templates = await db.resumeTemplate.findMany({
      where: { isActive: true },
      orderBy: [
        { usageCount: "desc" },
        { createdAt: "desc" },
      ],
    });

    return templates;
  } catch (error) {
    console.error("getResumeTemplates failed:", safeErr(error));
    return [];
  }
}

const improveSchema = z.object({
  current: z.string().trim().min(1).max(5000),
  type: z.string().trim().min(1).max(40),
});

/**
 * Returns { text, sources } where sources is only input:current ("Rewritten from your text").
 * Every number in the output must also appear in the input (one retry, then INVENTED_DETAIL).
 * Expected failures are RETURNED as { error, code } (INVALID | NOT_FOUND | AI_LIMIT | INVENTED_DETAIL | FAILED).
 */
// D50: one cap-counted action, however many AI calls it makes.
export async function improveWithAI(input) {
  return withAiAction(() => improveWithAIImpl(input));
}

async function improveWithAIImpl(input) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = improveSchema.safeParse(input ?? {});
  if (!parsed.success) return { error: "Please enter some text to improve first.", code: "INVALID" };
  const { current, type } = parsed.data;

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, industry: true },
    });

    if (!user) return { error: "We couldn't find your profile. Please finish onboarding first.", code: "NOT_FOUND" };

    const industryContext = user.industry 
      ? `for a ${user.industry} industry professional` 
      : "for a professional";

    let prompt = "";

    if (type === "skills") {
      prompt = `As an expert resume writer, improve the following skills list ${industryContext}.
Make it more professional, organized, and aligned with industry standards.

Current skills: "${current}"

Requirements:
1. Group related skills logically (e.g., Languages, Frameworks, Soft Skills) if there are many.
2. Use industry-standard terminology.
3. Keep it concise but comprehensive.
4. Return only the improved skills content separated by commas or newlines, without any explanations or introductory text.`;
    } else if (type === "summary") {
      prompt = `As an expert resume writer, improve the following professional summary ${industryContext}.
Make it more impactful, compelling, and aligned with industry standards.

Current summary: "${current}"

Requirements:
1. Make it a strong elevator pitch (3-4 sentences max).
2. Highlight key achievements, expertise, and career goals.
3. Use powerful adjectives and a professional tone.
4. Avoid first-person pronouns (I, me, my) if possible, or use them sparingly.
5. Return only the improved summary text without any explanations or introductory text.`;
    } else {
      prompt = `As an expert resume writer, improve the following ${type} description ${industryContext}.
Make it more impactful, quantifiable, and aligned with industry standards.

Current content: "${current}"

Requirements:
1. Use strong action verbs (led, achieved, developed, implemented).
2. Keep any metrics already in the content; never invent numbers, employers or achievements.
3. Highlight relevant technical and soft skills.
4. Keep it concise (2-4 bullet points or 100-150 words).
5. Focus on achievements and impact, not just responsibilities.
6. Use industry-specific keywords.
7. Return only the improved content without any explanations or introductory text.`;
    }

    const generate = async (note) => {
      const out = await runAIText("write", () => [["user", prompt + note]], {
        userId,
        temperature: 0.7,
        maxOutputTokens: 300,
      });
      return out.replace(/^\d+:/gm, "").trim();
    };

    let text = await generate("");
    if (text && inventedNumbers(text, current).length > 0) {
      text = await generate(
        "\n\nIMPORTANT: your previous answer contained numbers that are not in the original text. Do not add any number, percentage or amount that is not already in the original text."
      );
    }
    if (!text || inventedNumbers(text, current).length > 0) {
      return {
        error: "We couldn't improve this without adding details you didn't write. Add the specifics you want to keep (numbers, results) and try again.",
        code: "INVENTED_DETAIL",
      };
    }

    const catalog = buildSources({
      extra: [{ id: "input:current", kind: "input", label: "Rewritten from your text", text: current }],
    });
    return { text, sources: snapshot(["input:current"], catalog) };
  } catch (error) {
    console.error("improveWithAI failed:", safeErr(error));
    if (error?.code === "AI_LIMIT") return { error: "Daily AI limit reached. Please try again tomorrow.", code: "AI_LIMIT" };
    if (error?.code === "AI_UNAVAILABLE") return { error: "AI is temporarily unavailable. Please try again later.", code: "AI_UNAVAILABLE" };
    return { error: "Failed to improve content. Please try again.", code: "FAILED" };
  }
}

/**
 * Soft delete (7-day undo, D60): the full resume is snapshotted into a ResumeVersion labelled
 * "Deleted resume <date>" and the row gets `deletedAt` (the versions stay attached, so there is no FK problem).
 * Returns { success: true, undoId } where undoId is the snapshot version id; Undo is restoreDeletedResume(undoId).
 */
export async function deleteResume() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const resume = await db.resume.findUnique({ where: { userId: user.id, deletedAt: null }, include: { template: true } });
    if (!resume) return { success: true, undoId: null }; // nothing to delete

    const now = new Date();
    const [snapshot] = await db.$transaction([
      db.resumeVersion.create({
        data: {
          resumeId: resume.id,
          jobTitle: "",
          companyName: "",
          tailoredContent: encodeVersion("version", { label: `Deleted resume ${dateLabel(now)}`, content: formSnapshot(resume), deletedResume: true }),
        },
      }),
      db.resume.updateMany({ where: { id: resume.id, userId: user.id, deletedAt: null }, data: { deletedAt: now } }),
    ]);

    revalidatePath("/resume");
    return { success: true, undoId: snapshot.id };
  } catch (error) {
    console.error("deleteResume failed:", safeErr(error));
    throw new Error("Failed to delete resume");
  }
}

/**
 * Undo of deleteResume (within 7 days). Clears `deletedAt`. If the user already started a new resume (the row
 * was reused), the old one is not overwritten: { error, code: "CONFLICT" } and the snapshot stays in the version list.
 * Returns { success: true } or { error, code: INVALID | NOT_FOUND | CONFLICT | FAILED }.
 */
export async function restoreDeletedResume(undoId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = z.string().min(1).max(100).safeParse(undoId);
  if (!id.success) return fail("INVALID", "Nothing to restore.");

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return NO_PROFILE;
    const row = await db.resumeVersion.findFirst({ where: { id: id.data, resume: { userId: user.id } }, select: { tailoredContent: true, resumeId: true } });
    if (!row || decodeVersion(row).deletedResume !== true) return fail("NOT_FOUND", "We couldn't find that resume to restore.");

    const res = await db.resume.updateMany({
      where: { id: row.resumeId, userId: user.id, deletedAt: { not: null, gte: undoCutoff() } },
      data: { deletedAt: null },
    });
    if (res.count === 1) {
      revalidatePath("/resume");
      return { success: true };
    }
    const cur = await db.resume.findFirst({ where: { id: row.resumeId, userId: user.id }, select: { deletedAt: true } });
    if (cur && !cur.deletedAt) return fail("CONFLICT", "You already started a new resume, so the deleted one can't be restored over it.");
    return fail("NOT_FOUND", "We couldn't find that resume to restore.");
  } catch (error) {
    console.error("restoreDeletedResume failed:", safeErr(error));
    return fail("FAILED", "Could not restore your resume. Please try again.");
  }
}

export async function duplicateResume() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const existingResume = await db.resume.findUnique({
      where: { userId: user.id, deletedAt: null },
    });

    if (!existingResume) throw new Error("No resume to duplicate");

    // Create a version instead of duplicating
    const full = await db.resume.findUnique({ where: { id: existingResume.id }, include: { template: true } });
    const version = await db.resumeVersion.create({
      data: {
        resumeId: existingResume.id,
        jobTitle: "",
        companyName: "",
        tailoredContent: encodeVersion("version", { label: `Copy of resume (${dateLabel()})`, content: formSnapshot(full) }),
      },
    });

    revalidatePath("/resume");
    return version;
  } catch (error) {
    console.error("duplicateResume failed:", safeErr(error));
    throw new Error("Failed to duplicate resume");
  }
}

// seedResumeTemplates moved to seeder/seedTemplates.js (script-only). A "use server" export
// is callable by any visitor, and it writes global ResumeTemplate rows.

// ---------------------------------------------------------------------------------------------
// Phase 4 actions
// ---------------------------------------------------------------------------------------------

const idSchema = z.string().trim().min(1).max(100);

/** Returns [{ id, label, jobTitle, companyName, matchPercentage, createdAt }] (newest first), or { error, code }. */
export async function listResumeVersions() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  try {
    const { user, resume } = await loadOwner(userId);
    if (!user) return NO_PROFILE;
    if (!resume) return [];
    // Opportunistic cleanup of expired (24 h) tailoring drafts; failures must not break the list.
    await db.resumeVersion
      .deleteMany({
        where: {
          resumeId: resume.id,
          tailoredContent: { startsWith: DRAFT_PREFIX },
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      })
      .catch((e) => console.error("draft purge failed:", safeErr(e)));
    const rows = await db.resumeVersion.findMany({
      where: { resumeId: resume.id, NOT: { tailoredContent: { startsWith: DRAFT_PREFIX } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map((r) => {
      const env = decodeVersion(r);
      const fallback = [r.jobTitle, r.companyName].filter(Boolean).join(" at ") || "Saved copy";
      return {
        id: r.id,
        label: typeof env.label === "string" && env.label ? env.label : fallback,
        jobTitle: r.jobTitle || null,
        companyName: r.companyName || null,
        matchPercentage: r.matchPercentage ?? null,
        restorable: env.kind === "version",
        createdAt: r.createdAt,
      };
    });
  } catch (error) {
    console.error("listResumeVersions failed:", safeErr(error));
    return fail("FAILED", "We couldn't load your versions. Please try again.");
  }
}

const saveVersionSchema = z.object({
  label: z.string().trim().min(1).max(120),
  jobTitle: z.string().trim().max(200).default(""),
  companyName: z.string().trim().max(200).default(""),
  jobDescription: z.string().trim().max(20000).nullish(),
});

/** Snapshots the CURRENT saved resume as a version. Returns { id, label, matchPercentage, createdAt } or { error, code }. */
export async function saveResumeVersion(input) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const parsed = saveVersionSchema.safeParse(input ?? {});
  if (!parsed.success) return fail("INVALID", "Please give this version a name (up to 120 characters).");
  const { label, jobTitle, companyName, jobDescription } = parsed.data;
  try {
    const { user, resume } = await loadOwner(userId);
    if (!user) return NO_PROFILE;
    if (!resume) return fail("NOT_FOUND", NO_RESUME_MSG);
    const matchPercentage = jobDescription ? matchText(jobDescription, resumeToText(resume)).percent : null;
    const row = await db.resumeVersion.create({
      data: {
        resumeId: resume.id,
        jobTitle,
        companyName,
        jobDescription: jobDescription || null,
        matchPercentage,
        tailoredContent: encodeVersion("version", { label, content: formSnapshot(resume) }),
      },
    });
    revalidatePath("/resume");
    return { id: row.id, label, matchPercentage, createdAt: row.createdAt };
  } catch (error) {
    console.error("saveResumeVersion failed:", safeErr(error));
    return fail("FAILED", "We couldn't save this version. Please try again.");
  }
}

/** Full detail of one version: { id, label, jobTitle, companyName, jobDescription, matchPercentage, createdAt, content, applied } or { error, code }. */
export async function getResumeVersion(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const vid = idSchema.safeParse(id);
  if (!vid.success) return fail("INVALID", "We couldn't find that version.");
  try {
    const { user, resume } = await loadOwner(userId);
    if (!user) return NO_PROFILE;
    const row = resume && (await db.resumeVersion.findFirst({ where: { id: vid.data, resumeId: resume.id } }));
    if (!row) return fail("NOT_FOUND", "We couldn't find that version.");
    const env = decodeVersion(row);
    if (env.kind !== "version") return fail("NOT_FOUND", "We couldn't find that version.");
    return {
      id: row.id,
      label: env.label || [row.jobTitle, row.companyName].filter(Boolean).join(" at ") || "Saved copy",
      jobTitle: row.jobTitle || null,
      companyName: row.companyName || null,
      jobDescription: row.jobDescription ?? null,
      matchPercentage: row.matchPercentage ?? null,
      createdAt: row.createdAt,
      content: env.content ?? null,
      applied: Array.isArray(env.applied) ? env.applied : [],
    };
  } catch (error) {
    console.error("getResumeVersion failed:", safeErr(error));
    return fail("FAILED", "We couldn't load that version. Please try again.");
  }
}

/**
 * Restores a version into the main resume. The current resume is first saved as "Before restore <date>",
 * then the version's snapshot is written through saveResume. Returns { success: true, backupVersionId, undoVersionId } (equal) or { error, code }.
 */
export async function restoreResumeVersion(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const vid = idSchema.safeParse(id);
  if (!vid.success) return fail("INVALID", "We couldn't find that version.");
  try {
    const { user, resume } = await loadOwner(userId);
    if (!user) return NO_PROFILE;
    const row = resume && (await db.resumeVersion.findFirst({ where: { id: vid.data, resumeId: resume.id } }));
    if (!row) return fail("NOT_FOUND", "We couldn't find that version.");
    const env = decodeVersion(row);
    if (env.kind !== "version" || !env.content || typeof env.content !== "object") {
      return fail("NOT_RESTORABLE", "This older copy only kept plain text, so it can't be restored. Your resume was not changed.");
    }

    const backup = await db.resumeVersion.create({
      data: {
        resumeId: resume.id,
        jobTitle: "",
        companyName: "",
        tailoredContent: encodeVersion("version", { label: `Before restore ${dateLabel()}`, content: formSnapshot(resume) }),
      },
    });

    await saveResume(env.content);
    // undoVersionId: Undo is restoreResumeVersion(undoVersionId) (D60); it snapshots the restored state as a new backup.
    return { success: true, backupVersionId: backup.id, undoVersionId: backup.id };
  } catch (error) {
    console.error("restoreResumeVersion failed:", safeErr(error));
    return fail("FAILED", "We couldn't restore this version. Your resume was not changed.");
  }
}

const matchInput = z.object({
  jobDescription: z.string().trim().min(1).max(20000),
  versionId: idSchema.optional(),
  resume: z
    .object({
      summary: z.string().max(20000).nullish(),
      skills: z.string().max(20000).nullish(),
      experience: z.array(z.object({ title: z.string().nullish(), organization: z.string().nullish(), description: z.string().max(10000).nullish() }).passthrough()).max(50).optional(),
      education: z.array(z.object({ title: z.string().nullish(), organization: z.string().nullish(), description: z.string().max(10000).nullish() }).passthrough()).max(50).optional(),
      projects: z.array(z.object({ title: z.string().nullish(), organization: z.string().nullish(), description: z.string().max(10000).nullish() }).passthrough()).max(50).optional(),
    })
    .optional(),
});

/**
 * Deterministic keyword match, no AI (D37). Compares against `versionId`, else the optional unsaved `resume`
 * form JSON, else the saved resume. Returns { percent, matched[], missing[], termCount } or { error, code }.
 */
export async function computeMatch(input) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const parsed = matchInput.safeParse(input ?? {});
  if (!parsed.success) return fail("INVALID", "Paste the job description (up to 20,000 characters) to see your match.");
  const { jobDescription, versionId, resume: formResume } = parsed.data;
  try {
    const { user, resume } = await loadOwner(userId);
    if (!user) return NO_PROFILE;
    let source = formResume ?? resume;
    if (versionId) {
      const row = resume && (await db.resumeVersion.findFirst({ where: { id: versionId, resumeId: resume.id } }));
      const env = row ? decodeVersion(row) : null;
      if (!env || env.kind !== "version" || !env.content) return fail("NOT_FOUND", "We couldn't find that version.");
      source = env.content;
    }
    if (!source) return fail("NOT_FOUND", NO_RESUME_MSG);
    return matchText(jobDescription, resumeToText(source));
  } catch (error) {
    console.error("computeMatch failed:", safeErr(error));
    return fail("FAILED", "We couldn't compute the match. Please try again.");
  }
}

// ---- Tailoring (D36) ----

const BULLET_RE = /^(\s*(?:[-\u2022*\u25AA\u25CF]|\d+[.)])?\s*)(.*)$/;

/** Non-empty lines of a description as bullets: [{ line, prefix, text }]. */
function splitBullets(description) {
  const out = [];
  String(description ?? "")
    .split("\n")
    .forEach((l, line) => {
      const m = BULLET_RE.exec(l.replace(/\r$/, ""));
      if (m && m[2].trim()) out.push({ line, prefix: m[1], text: m[2].trim() });
    });
  return out;
}

/** Resolves a catalog id (exp:<id> or proj:<id>) to { list, index } in the resume, or null. */
function resolveEntry(resume, entryId) {
  const [kind, ...rest] = String(entryId).split(":");
  const key = rest.join(":");
  const list = kind === "exp" ? resume.experience : kind === "proj" ? resume.projects : null;
  if (!Array.isArray(list)) return null;
  const index = list.findIndex((e, i) => e && typeof e === "object" && (e.id ? String(e.id) === key : legacyEntryId(kind, i, e) === key));
  return index === -1 ? null : { list, index };
}

const tailorInput = z.object({
  jobTitle: z.string().trim().max(200).default(""),
  companyName: z.string().trim().max(200).default(""),
  jobDescription: z.string().trim().min(1).max(20000),
  jobId: z.string().trim().min(1).max(100).optional(),
});

const MAX_TAILOR_BULLETS = 40;
const MAX_PROPOSALS = 8;
const MAX_PROPOSED = 600;

/**
 * Proposes sourced rewrites of existing resume bullets for a job. Nothing is applied and the resume is
 * not changed. The pending proposals are stored server-side in a short-lived draft row (ResumeVersion
 * kind "draft"); saveTailoredVersion accepts only the draftId and proposal ids.
 * Returns { draftId, jobTitle, companyName, matchBefore:{percent,matched,missing,termCount},
 *   proposals:[{ proposalId, entryId, bulletIndex, original, proposed, reason, sources }] }
 * or { error, code: INVALID | NOT_FOUND | NO_SOURCES | INVENTED_DETAIL | AI_LIMIT | AI_UNAVAILABLE | FAILED }.
 */
// D50: one cap-counted action, however many AI calls it makes.
export async function tailorResume(input) {
  return withAiAction(() => tailorResumeImpl(input));
}

async function tailorResumeImpl(input) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const parsed = tailorInput.safeParse(input ?? {});
  if (!parsed.success) return fail("INVALID", "Paste the job description (up to 20,000 characters) to tailor your resume.");
  const { jobTitle, companyName, jobDescription, jobId } = parsed.data;

  try {
    const { user, resume } = await loadOwner(userId);
    if (!user) return NO_PROFILE;
    if (!resume) return fail("NOT_FOUND", NO_RESUME_MSG);
    if (jobId) {
      // Optional link to one of the caller's jobs (D55); refused before any AI call.
      const job = await db.job.findFirst({ where: { id: jobId, userId: user.id, deletedAt: null }, select: { id: true } });
      if (!job) return fail("NOT_FOUND", "We couldn't find that job.");
    }

    const catalog = buildSources({ profile: user, resume, jobDescription });
    const byId = new Map(catalog.map((c) => [c.id, c]));

    // Eligible bullets: existing lines of experience and project descriptions.
    const bullets = new Map(); // "exp:id#n" -> { entryId, bulletIndex, text }
    const lines = [];
    for (const [prefix, list] of [["exp", resume.experience], ["proj", resume.projects]]) {
      (Array.isArray(list) ? list : []).forEach((e, i) => {
        if (!e || typeof e !== "object") return;
        const entryId = `${prefix}:${e.id ? String(e.id) : legacyEntryId(prefix, i, e)}`;
        splitBullets(e.description).forEach((b, n) => {
          // Only whole bullets of up to 400 characters, so "original" is exactly the line being replaced.
          if (bullets.size >= MAX_TAILOR_BULLETS || !byId.has(entryId) || b.text.length > 400) return;
          const text = b.text;
          bullets.set(`${entryId}#${n}`, { entryId, bulletIndex: n, text });
          lines.push(`[${entryId}#${n}] ${text}`);
        });
      });
    }
    if (bullets.size === 0) return fail("NO_SOURCES", "Add experience or project descriptions to your resume first, then try tailoring again.");

    const prompt = `
You are an expert resume writer tailoring a candidate's EXISTING resume bullets to one job.

JOB: ${jobTitle || "position"} at ${companyName || "the company"}

SOURCES (each line is [id] label: text):
${formatCatalogForPrompt(catalog)}

RESUME BULLETS YOU MAY REWRITE (each line is [entryId#bulletIndex] text):
${lines.join("\n")}

TASK: choose up to ${MAX_PROPOSALS} bullets that can better match the job and rewrite each one.
RULES:
- Use ONLY facts already in that bullet. Do NOT add any employer, tool, skill, technology, title, date, metric, number or result that the bullet does not already state.
- You may reword, reorder and use the job description's terminology for things the bullet already says.
- Every proposal needs at least one job description id (jd:...) in sourceIds that the rewrite responds to, copied exactly from SOURCES.
- Each proposed bullet is one line, under ${MAX_PROPOSED} characters, no markdown, and must differ from the original.
- "reason" is one short sentence explaining the change.

OUTPUT: valid JSON only, no markdown fences:
{ "proposals": [ { "entryId": "exp:...", "bulletIndex": 0, "proposed": "", "reason": "", "sourceIds": ["jd:1"] } ] }
`;

    let droppedNumbers = 0;
    const verify = (out) => {
      const seen = new Set();
      const good = [];
      for (const p of out.proposals) {
        const key = `${String(p.entryId).trim()}#${p.bulletIndex}`;
        const b = bullets.get(key);
        if (!b || seen.has(key)) continue;
        const proposed = String(p.proposed).replace(/\s+/g, " ").trim();
        if (!proposed || proposed.length > MAX_PROPOSED || normalizeText(proposed) === normalizeText(b.text)) continue;
        const jdIds = validateSourceIds(p.sourceIds, catalog).filter((id) => id.startsWith("jd:"));
        if (jdIds.length === 0) continue;
        if (inventedNumbers(proposed, `${b.text}\n${jobDescription}`).length > 0) {
          droppedNumbers++;
          continue;
        }
        seen.add(key);
        good.push({
          entryId: b.entryId,
          bulletIndex: b.bulletIndex,
          original: b.text,
          proposed,
          reason: String(p.reason ?? "").replace(/\s+/g, " ").trim().slice(0, 300),
          sources: snapshot([b.entryId, ...jdIds], catalog),
        });
        if (good.length >= MAX_PROPOSALS) break;
      }
      return good;
    };
    const generate = async (note) => verify(await runAIStructured("write", tailorSchema, () => [["user", prompt + note]], { userId }));

    let good = await generate("");
    if (good.length < Math.min(2, bullets.size)) {
      try {
        const retry = await generate(
          "\n\nIMPORTANT: your previous answer had too few valid proposals. Use entryId#bulletIndex pairs exactly as listed, include at least one valid jd id in sourceIds, and never add a number or fact that is not in the original bullet or the job description."
        );
        if (retry.length >= good.length) good = retry;
      } catch (e) {
        if (good.length === 0) throw e;
        console.error("tailorResume retry failed, keeping first attempt:", safeErr(e));
      }
    }
    if (good.length === 0) {
      return droppedNumbers > 0
        ? fail("INVENTED_DETAIL", "We couldn't tailor this without adding details you didn't write. Add the specifics you want to keep to your resume and try again.")
        : fail("NO_SOURCES", "We couldn't ground any edits in your resume and this job description. Paste a fuller job description or add more detail to your bullets, then try again.");
    }

    const proposals = good.map((p, i) => ({ proposalId: `p${i + 1}`, ...p }));

    // One pending draft per user and job (drafts linked to other jobs, or to none, are kept): drop older
    // drafts of the same scope, then store this one.
    const draft = await db.$transaction(async (tx) => {
      await tx.resumeVersion.deleteMany({
        where: { resumeId: resume.id, jobId: jobId ?? null, tailoredContent: { startsWith: DRAFT_PREFIX } },
      });
      return tx.resumeVersion.create({
        data: {
          resumeId: resume.id,
          ...(jobId ? { jobId } : {}),
          jobTitle,
          companyName,
          jobDescription,
          tailoredContent: encodeVersion("draft", { label: "Pending tailoring (not saved)", proposals }),
        },
      });
    });

    return {
      draftId: draft.id,
      jobTitle,
      companyName,
      matchBefore: matchText(jobDescription, resumeToText(resume)),
      proposals,
    };
  } catch (error) {
    console.error("tailorResume failed:", safeErr(error));
    if (error?.code === "AI_LIMIT") return fail("AI_LIMIT", AI_LIMIT_MSG);
    if (error?.code === "AI_UNAVAILABLE") return fail("AI_UNAVAILABLE", AI_UNAVAILABLE_MSG);
    return fail("FAILED", "We couldn't tailor your resume right now. Please try again.");
  }
}

/**
 * Reads one pending tailoring draft (owner-scoped) in the shape tailorResume returned it, so the review can be
 * reopened from /needs-you. Returns { draftId, jobId, jobTitle, companyName, matchBefore, proposals, expiresAt }
 * or { error, code: INVALID | NOT_FOUND | STALE | FAILED }. STALE = older than 24 h. Saved versions are NOT_FOUND here.
 */
export async function getTailorDraft(draftId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const id = idSchema.safeParse(draftId);
  if (!id.success) return fail("INVALID", "Missing draft id.");
  try {
    const { user, resume } = await loadOwner(userId);
    if (!user) return NO_PROFILE;
    if (!resume) return fail("NOT_FOUND", NO_RESUME_MSG);
    const row = await db.resumeVersion.findFirst({ where: { id: id.data, resumeId: resume.id } });
    const env = row ? decodeVersion(row) : null;
    if (!row || env.kind !== "draft" || !Array.isArray(env.proposals)) {
      return fail("NOT_FOUND", "These suggestions are no longer available. Please run tailoring again.");
    }
    if (Date.now() - row.createdAt.getTime() > DRAFT_TTL_MS) {
      return fail("STALE", "These suggestions have expired. Please run tailoring again.");
    }
    const jd = row.jobDescription ?? "";
    return {
      draftId: row.id,
      jobId: row.jobId ?? null,
      jobTitle: row.jobTitle ?? "",
      companyName: row.companyName ?? "",
      matchBefore: matchText(jd, resumeToText(resume)),
      proposals: env.proposals.map(({ proposalId, entryId, bulletIndex, original, proposed, reason, sources }) => ({
        proposalId, entryId, bulletIndex, original, proposed, reason, sources: Array.isArray(sources) ? sources : [],
      })),
      expiresAt: new Date(row.createdAt.getTime() + DRAFT_TTL_MS).toISOString(),
    };
  } catch (error) {
    console.error("getTailorDraft failed:", safeErr(error));
    return fail("FAILED", "We couldn't load these suggestions. Please try again.");
  }
}

const saveTailoredSchema = z.object({
  draftId: idSchema,
  acceptedProposalIds: z.array(z.string().trim().min(1).max(20)).min(1).max(MAX_PROPOSALS),
  // User-edited lines: { proposalId: text }. Only for accepted ids; one line, 1-600 chars.
  edits: z.record(z.string().trim().min(1).max(20), z.string().max(5000)).optional(),
  label: z.string().trim().min(1).max(120).optional(),
});

/**
 * Saves the accepted proposals as a ResumeVersion. Takes only ids: the proposal text comes from the
 * server-side draft and is re-verified against the CURRENT resume and job description (bullet still
 * identical, no invented numbers). The main resume is never modified. Optional `edits: {proposalId: text}` replaces
 * the proposed text of an ACCEPTED proposal (same checks; stored with userEdited:true and no sources).
 * Returns { versionId, label, applied:[proposalId], skipped:[{proposalId, reason}], matchBefore, matchAfter }
 * or { error, code: INVALID | NOT_FOUND | STALE | FAILED }.
 */
export async function saveTailoredVersion(input) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const parsed = saveTailoredSchema.safeParse(input ?? {});
  if (!parsed.success) return fail("INVALID", "Accept at least one edit to save a version.");
  const { draftId, acceptedProposalIds, label } = parsed.data;
  const accepted = new Set(acceptedProposalIds);
  const edits = new Map();
  for (const [pid, raw] of Object.entries(parsed.data.edits ?? {})) {
    const text = String(raw).replace(/\s+/g, " ").trim();
    if (!accepted.has(pid)) return fail("INVALID", "You can only edit lines you accepted.");
    if (!text || text.length > MAX_PROPOSED) return fail("INVALID", `An edited line must be 1 to ${MAX_PROPOSED} characters.`);
    edits.set(pid, text);
  }

  try {
    const { user, resume } = await loadOwner(userId);
    if (!user) return NO_PROFILE;
    if (!resume) return fail("NOT_FOUND", NO_RESUME_MSG);
    const row = await db.resumeVersion.findFirst({ where: { id: draftId, resumeId: resume.id } });
    const env = row ? decodeVersion(row) : null;
    if (!row || env.kind !== "draft" || !Array.isArray(env.proposals)) {
      return fail("NOT_FOUND", "These suggestions are no longer available. Please run tailoring again.");
    }
    if (Date.now() - row.createdAt.getTime() > DRAFT_TTL_MS) {
      return fail("STALE", "These suggestions have expired. Please run tailoring again.");
    }

    const jd = row.jobDescription ?? "";
    const snap = formSnapshot(resume);
    const next = { ...snap, experience: structuredClone(snap.experience), projects: structuredClone(snap.projects) };
    const applied = [];
    const skipped = [];
    const wanted = [...new Set(acceptedProposalIds)];
    for (const pid of edits.keys()) {
      if (!env.proposals.some((x) => x.proposalId === pid)) return fail("INVALID", "You can only edit lines from this draft.");
    }

    for (const pid of wanted) {
      const found = env.proposals.find((x) => x.proposalId === pid);
      if (!found) {
        skipped.push({ proposalId: pid, reason: "UNKNOWN" });
        continue;
      }
      // A user-edited line replaces the proposed text; it is the user's own words, so it has no AI sources (no chips).
      const userEdited = edits.has(pid);
      const p = userEdited ? { ...found, proposed: edits.get(pid), sources: [], userEdited: true } : found;
      // Re-verify against the current resume: the entry exists and the bullet is still the same text.
      const target = resolveEntry(next, p.entryId);
      const entry = target?.list[target.index];
      const lines = String(entry?.description ?? "").split("\n");
      const b = entry ? splitBullets(entry.description)[p.bulletIndex] : null;
      if (!b || normalizeText(b.text) !== normalizeText(p.original)) {
        skipped.push({ proposalId: pid, reason: "RESUME_CHANGED" });
        continue;
      }
      if (
        typeof p.proposed !== "string" || !p.proposed.trim() || p.proposed.length > MAX_PROPOSED ||
        inventedNumbers(p.proposed, `${p.original}\n${jd}`).length > 0
      ) {
        skipped.push({ proposalId: pid, reason: "FAILED_CHECK" });
        continue;
      }
      lines[b.line] = b.prefix + p.proposed.trim();
      entry.description = lines.join("\n");
      applied.push(p);
    }

    if (applied.length === 0) {
      return fail("STALE", "Your resume changed since these suggestions were made. Please run tailoring again.");
    }

    const matchBefore = jd ? matchText(jd, resumeToText(snap)) : null;
    const matchAfter = jd ? matchText(jd, resumeToText(next)) : null;
    const finalLabel = label || `Tailored: ${[row.jobTitle, row.companyName].filter(Boolean).join(" at ") || "job"}`;

    // The draft row becomes the saved version. The main Resume row is not touched.
    await db.resumeVersion.update({
      where: { id: row.id },
      data: {
        matchPercentage: matchAfter?.percent ?? null,
        tailoredContent: encodeVersion("version", {
          label: finalLabel,
          content: next,
          applied: applied.map(({ proposalId, entryId, bulletIndex, original, proposed, reason, sources, userEdited }) => ({
            proposalId, entryId, bulletIndex, original, proposed, reason, sources, ...(userEdited ? { userEdited: true } : {}),
          })),
        }),
      },
    });

    revalidatePath("/resume");
    return {
      versionId: row.id,
      label: finalLabel,
      applied: applied.map((p) => p.proposalId),
      skipped,
      matchBefore,
      matchAfter,
    };
  } catch (error) {
    console.error("saveTailoredVersion failed:", safeErr(error));
    return fail("FAILED", "We couldn't save this version. Please try again.");
  }
}
