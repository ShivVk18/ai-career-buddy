'use server';



import { db } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createHmac, createHash, timingSafeEqual, randomBytes } from "node:crypto";
import { runAIStructured, withAiAction } from "@/lib/ai";
import { inventedNumbers } from "@/lib/ai/numberCheck";
import { validateAndExtractPdf, INVALID_FILE_MSG } from "@/lib/ai/pdf";
import { buildSources, formatCatalogForPrompt, snapshot, normalizeText, validateSourceIds } from "@/lib/ai/sources";
import { atsFixSchema } from "@/lib/ai/schemas";
import { safeErr } from "@/lib/utils";
import { scoreResume, stripRec } from "@/lib/ats/score";
import { pruneDeleted, undoCutoff } from "@/lib/softDelete";
import { resumeToText } from "@/lib/match";

const NO_SOURCES_MSG =
  "We couldn't back the analysis with evidence from your resume. Please check that the PDF has readable text and the job description is complete, then try again.";

const inputSchema = z.object({
  companyName: z.string().trim().max(200).optional().default(""),
  jobTitle: z.string().trim().max(200).optional().default(""),
  jobDescription: z.string().trim().min(1).max(20000),
  resumeBase64: z.string().min(1).optional(),
  useSavedResume: z.boolean().optional(),
  resumeType: z.string().max(100).optional(),
  jobId: z.string().trim().min(1).max(100).optional(),
});

/** The stored resume text never leaves the server; clients get hasResumeText and the other evidence fields. */
function publicScore(row, candidateYears = null) {
  if (!row) return row;
  const ev = row.evidence;
  const pastLimit = isPastResumeTextLimit(row.createdAt); // text is unusable even if the purge has not run yet
  if (!ev || typeof ev !== "object")
    return { ...row, hasResumeText: false, resumePurged: false, candidateLevel: null, candidateYears, previousScoreId: null };
  const { resumeText, ...evidence } = ev;
  return {
    ...row,
    evidence: { ...evidence, requirements: Array.isArray(ev.requirements) ? ev.requirements : [] },
    hasResumeText: !pastLimit && typeof resumeText === "string" && resumeText.length > 0,
    resumePurged: pastLimit || typeof ev.resumePurgedAt === "string",
    candidateLevel: ev.candidateLevel ?? null,
    candidateYears,
    previousScoreId: ev.previousScoreId ?? null,
  };
}

const yearsOf = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : null);

const PURGE_DAYS = 90;
const PURGE_BATCH = 50;

/** One cutoff for the purge and the fix rules: results created before this have no usable resume text (D42). */
const resumeTextCutoff = () => new Date(Date.now() - PURGE_DAYS * 24 * 60 * 60 * 1000);
const isPastResumeTextLimit = (createdAt) => !(createdAt instanceof Date) || createdAt < resumeTextCutoff();

/**
 * D42: removes ONLY evidence.resumeText from this user's results older than 90 days, at most 50 rows per
 * call (oldest first), in one atomic statement, and marks evidence.resumePurgedAt. Opportunistic (there
 * is no job runner). Never throws: a failure is logged and the request carries on.
 */
async function purgeOldResumeText(userDbId) {
  try {
    const cutoff = resumeTextCutoff();
    await db.$executeRaw`
      UPDATE "ATSScore"
      SET "evidence" = ("evidence" - 'resumeText') || jsonb_build_object('resumePurgedAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
      WHERE "id" IN (
        SELECT "id" FROM "ATSScore"
        WHERE "userId" = ${userDbId}
          AND "createdAt" < ${cutoff}
          AND "evidence" IS NOT NULL
          AND jsonb_typeof("evidence") = 'object'
          AND "evidence" -> 'resumeText' IS NOT NULL
        ORDER BY "createdAt" ASC
        LIMIT ${PURGE_BATCH}
      )`;
  } catch (err) {
    console.error("ATS resume text purge failed:", safeErr(err));
  }
}

/**
 * Returns { success: true, data } or { success: false, message, error, code? }.
 * code: INVALID_FILE | NO_SOURCES | AI_LIMIT | INVALID | FAILED. Input: resumeBase64 (raw base64
 * of the PDF), optional resumeType (MIME type of the file).
 */
// D50: one cap-counted action, however many AI calls it makes.
export async function createATSAnalysis(formData) {
  return withAiAction(() => createATSAnalysisImpl(formData));
}

async function createATSAnalysisImpl(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");


  const failure = (code, message) => ({ success: false, message, error: message, code });

  try {
    const parsedInput = inputSchema.safeParse(formData ?? {});
    if (!parsedInput.success) {
      const missingFile = !formData?.resumeBase64 && formData?.useSavedResume !== true;
      return missingFile
        ? failure("INVALID_FILE", INVALID_FILE_MSG)
        : failure("INVALID", "Please check the company, job title and job description and try again.");
    }
    const { companyName, jobTitle, jobDescription, resumeBase64, resumeType, jobId, useSavedResume } = parsedInput.data;
    if (!useSavedResume && !resumeBase64) return failure("INVALID_FILE", INVALID_FILE_MSG);

    let resumeText;
    const resumeSource = useSavedResume ? "saved" : "pdf";
    if (useSavedResume) {
      // The user's builder resume, as text (the same resumeToText the pipeline CHECKER uses). Owner-scoped, not deleted.
      const me = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
      const saved = me ? await db.resume.findUnique({ where: { userId: me.id, deletedAt: null } }) : null;
      resumeText = saved ? resumeToText(saved).slice(0, 30000) : "";
      if (!resumeText.trim()) return failure("NO_RESUME", "You don't have a saved resume yet. Add one in the resume builder or upload a PDF.");
    } else {
      // Validate the file before any AI call.
      const pdf = await validateAndExtractPdf(resumeBase64, resumeType);
      if (pdf.error) return failure(pdf.code, pdf.error);
      resumeText = pdf.text.slice(0, 30000);
    }
    // The user row is created at sign-up; a session without one is not valid.
    const dbUser = await db.user.findUnique({ where: { id: userId } });
    if (!dbUser) throw new Error("User not found");
    await purgeOldResumeText(dbUser.id);

    if (jobId) {
      // Optional link to one of the caller's jobs; refused before any AI call.
      const job = await db.job.findFirst({ where: { id: jobId, userId: dbUser.id, deletedAt: null }, select: { id: true } });
      if (!job) return failure("NOT_FOUND", "We couldn't find that job.");
    }

    const scored = await scoreResume({ userId, resumeText, jobDescription, jobTitle, companyName });
    if (scored.empty) return failure("NO_SOURCES", NO_SOURCES_MSG);
    const { result, raw, evidence } = scored;

    // Plain text goes to the existing columns so older readers keep working.
    const atsAnalysis = await db.aTSScore.create({
      data: {
        user: { connect: { id: userId } },
        atsScore: raw.atsScore,
        matchPercentage: raw.matchPercentage,
        strengths: result.strengths.map((x) => x.text),
        weaknesses: result.weaknesses.map((x) => x.text),
        improvements: raw.improvements,
        relevantSkills: raw.relevantSkills,
        missingSkills: raw.missingSkills,
        recommendations: result.recommendations.map(stripRec).map(({ text, ...r }) => r),
        evidence: { ...evidence, resumeSource },
        finalSummary: raw.finalSummary,
        analyzedBy: "AI",
        jobTitle,
        companyName,
        jobDescription,
        ...(jobId ? { job: { connect: { id: jobId } } } : {}),
      },
    });

    revalidatePath("/resume-parser");

    return { success: true, data: publicScore(atsAnalysis, yearsOf(dbUser.experience)) };
  } catch (err) {
    console.error("createATSAnalysis failed:", safeErr(err));
    if (err?.code === "AI_LIMIT") return failure("AI_LIMIT", "Daily AI limit reached. Please try again tomorrow.");
    if (err?.code === "AI_UNAVAILABLE") return failure("AI_UNAVAILABLE", "AI is temporarily unavailable. Please try again later.");
    return failure("FAILED", "We couldn't analyze your resume right now. Please try again.");
  }
}


export async function getUserATSScores() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const me = await db.user.findUnique({ where: { id: userId }, select: { id: true, experience: true } });
    if (!me) return [];
    await purgeOldResumeText(me.id);
    await pruneDeleted(me.id);
    const candidateYears = yearsOf(me.experience);

    const scores = await db.aTSScore.findMany({
      where: { userId: me.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50, // newest 50 only: Prisma can't select inside Json, so evidence (incl. resumeText) is still loaded
      select: {
        id: true,
        atsScore: true,
        matchPercentage: true,
        jobTitle: true,
        companyName: true,
        analyzedBy: true,
        createdAt: true,
        finalSummary: true,
        jobDescription: true,
        evidence: true,
      },
    });

    // Light rows for the history list: no stored resume text, no evidence arrays.
    return scores.map(({ evidence, ...row }) => {
      const ev = evidence && typeof evidence === "object" ? evidence : null;
      const reqs = Array.isArray(ev?.requirements) ? ev.requirements : [];
      return {
        ...row,
        isLegacy: ev === null,
        candidateLevel: ev?.candidateLevel ?? null,
        candidateYears,
        previousScoreId: ev?.previousScoreId ?? null,
        hasResumeText: typeof ev?.resumeText === "string" && ev.resumeText.length > 0,
        resumePurged: typeof ev?.resumePurgedAt === "string",
        requirementsMatched: reqs.filter((r) => r.status === "matched").length,
        requirementsPartial: reqs.filter((r) => r.match === "partial").length,
        requirementsTotal: reqs.length,
      };
    });
  } catch (error) {
    console.error("getUserATSScores failed:", safeErr(error));
    throw new Error("Failed to fetch ATS scores");
  }
}

// Get detailed ATS score by ID
export async function getATSScoreById(scoreId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const score = await db.aTSScore.findFirst({
      where: { 
        id: scoreId,
        deletedAt: null,
        user: {
          id: userId
        }
      },
      include: { user: { select: { experience: true } } },
    });

    if (!score) {
      throw new Error("ATS score not found");
    }

    const { user: owner, ...row } = score;
    return publicScore(row, yearsOf(owner?.experience));
  } catch (error) {
    console.error("getATSScoreById failed:", safeErr(error));
    throw new Error("Failed to fetch ATS score details");
  }
}

/**
 * Soft-deletes (D60: sets deletedAt) one of the signed-in user's ATS results (owner-scoped). Undo with
 * restoreATSScore for 7 days. Returns { success: true, id, message } or
 * { error, code: "INVALID" | "NOT_FOUND" | "FAILED" }. Results that point to it via previousScoreId keep working.
 */
export async function deleteATSScore(scoreId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = z.string().trim().min(1).max(100).safeParse(scoreId);
  if (!id.success) return { error: "We couldn't find that result.", code: "INVALID" };

  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return { error: "We couldn't find your profile.", code: "NOT_FOUND" };

    const row = await db.aTSScore.findFirst({ where: { id: id.data, userId: user.id, deletedAt: null }, select: { evidence: true } });
    if (!row) return { error: "We couldn't find that result.", code: "NOT_FOUND" };
    // Drop the stored resume text in the same update (restoring then needs a re-upload for the fix).
    const data = { deletedAt: new Date() };
    if (row.evidence && typeof row.evidence === "object" && !Array.isArray(row.evidence) && "resumeText" in row.evidence) {
      const { resumeText: _drop, ...rest } = row.evidence;
      data.evidence = rest;
    }
    const res = await db.aTSScore.updateMany({ where: { id: id.data, userId: user.id, deletedAt: null }, data });
    if (res.count === 0) return { error: "We couldn't find that result.", code: "NOT_FOUND" };

    revalidatePath("/resume-parser");
    return { success: true, id: id.data, message: "ATS score deleted successfully" };
  } catch (error) {
    console.error("deleteATSScore failed:", safeErr(error));
    return { error: "We couldn't delete that result. Please try again.", code: "FAILED" };
  }
}

/** Undo for deleteATSScore. Works for 7 days after the delete. Returns { success: true, id } or { error, code }. */
export async function restoreATSScore(scoreId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = z.string().trim().min(1).max(100).safeParse(scoreId);
  if (!id.success) return { error: "We couldn't find that result.", code: "INVALID" };

  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return { error: "We couldn't find your profile.", code: "NOT_FOUND" };

    const res = await db.aTSScore.updateMany({
      where: { id: id.data, userId: user.id, deletedAt: { not: null, gte: undoCutoff() } },
      data: { deletedAt: null },
    });
    if (res.count === 0) return { error: "That result can't be restored any more.", code: "NOT_FOUND" };

    revalidatePath("/resume-parser");
    return { success: true, id: id.data };
  } catch (error) {
    console.error("restoreATSScore failed:", safeErr(error));
    return { error: "We couldn't restore that result. Please try again.", code: "FAILED" };
  }
}

// Get ATS analytics for dashboard
export async function getATSAnalytics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const scores = await db.aTSScore.findMany({
      where: { 
        deletedAt: null,
        user: {
          id: userId
        }
      },
      select: {
        atsScore: true,
        matchPercentage: true,
        createdAt: true,
        jobTitle: true,
        companyName: true,
      },
    });

    const analytics = {
      totalScores: scores.length,
      averageATSScore: scores.length > 0 ? 
        Math.round(scores.reduce((sum, score) => sum + score.atsScore, 0) / scores.length) : 0,
      averageMatchPercentage: scores.length > 0 ? 
        Math.round(scores.reduce((sum, score) => sum + (score.matchPercentage || 0), 0) / scores.length) : 0,
      highestScore: scores.length > 0 ? Math.max(...scores.map(s => s.atsScore)) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores.map(s => s.atsScore)) : 0,
      recentScores: scores.slice(0, 5),
      scoresTrend: scores.map(score => ({
        date: score.createdAt.toISOString().split('T')[0],
        atsScore: score.atsScore,
        matchPercentage: score.matchPercentage || 0,
        label: `${score.companyName || 'Company'} - ${score.jobTitle || 'Position'}`,
      })).reverse(),
    };

    return analytics;
  } catch (error) {
    console.error("getATSAnalytics failed:", safeErr(error));
    throw new Error("Failed to fetch analytics");
  }
}

// Update ATS score metadata. Only user-editable fields are accepted; scores, evidence, userId and
// every AI-generated field can never be changed from the client.
const updateMetaSchema = z
  .object({
    jobTitle: z.string().trim().max(200),
    companyName: z.string().trim().max(200),
    jobDescription: z.string().trim().max(20000),
  })
  .partial()
  .strict();

export async function updateATSScore(scoreId, updateData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = z.string().min(1).max(100).safeParse(scoreId);
  const data = updateMetaSchema.safeParse(updateData ?? {});
  if (!id.success || !data.success || Object.keys(data.data).length === 0) {
    return { success: false, error: "Only job title, company name and job description can be updated.", code: "INVALID" };
  }

  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, experience: true } });
    if (!user) return { success: false, error: "We couldn't find your profile.", code: "NOT_FOUND" };

    const result = await db.aTSScore.updateMany({
      where: { id: id.data, userId: user.id, deletedAt: null },
      data: data.data,
    });
    if (result.count === 0) return { success: false, error: "ATS score not found.", code: "NOT_FOUND" };

    const updated = await db.aTSScore.findFirst({ where: { id: id.data, userId: user.id, deletedAt: null } });
    revalidatePath("/resume-parser");
    return { success: true, message: "ATS score updated successfully", data: publicScore(updated, yearsOf(user.experience)) };
  } catch (error) {
    console.error("updateATSScore failed:", safeErr(error));
    return { success: false, error: "Failed to update ATS score.", code: "FAILED" };
  }
}


// ---------------------------------------------------------------------------------------------
// 1-click fix (D38). proposeAtsFix only proposes; applyAtsFix runs on the user's click.
// Proposals are not stored. The fixId is a server-signed token that carries the proposed text, so
// the client sends back only the id and any change to the text invalidates the signature.
// ---------------------------------------------------------------------------------------------

const NEEDS_REUPLOAD_MSG =
  "This result was saved before we kept the analyzed resume text, so we can't test a fix on it. Please upload your PDF again and re-run the analysis.";
const FIX_MAX = 600;
const FIX_TTL_MS = 24 * 60 * 60 * 1000;

const fixFail = (code, error, newScoreId) => (newScoreId ? { error, code, newScoreId } : { error, code });
const ALREADY_APPLIED_MSG = "You've already applied this fix. Opening the result you got.";
const collapse = (t) => String(t ?? "").replace(/\s+/g, " ").trim();
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Finds a verified quote inside the stored text (whitespace-tolerant). Returns { start, end } or null. */
function locateQuote(text, quote) {
  const q = collapse(quote);
  if (!q) return null;
  const exact = text.indexOf(q);
  if (exact !== -1) return { start: exact, end: exact + q.length };
  const m = new RegExp(q.split(" ").map(escapeRe).join("\\s+")).exec(text);
  return m ? { start: m.index, end: m.index + m[0].length } : null;
}

/** The single line of text containing the span, trimmed; falls back to the span itself if the line is long. */
function lineAround(text, span) {
  const start = text.lastIndexOf("\n", span.start - 1) + 1;
  const nl = text.indexOf("\n", span.end);
  const end = nl === -1 ? text.length : nl;
  const raw = text.slice(start, end);
  const line = raw.trim();
  if (line.length >= 20 && line.length <= 400) {
    const off = start + raw.indexOf(line);
    return { start: off, end: off + line.length, text: line };
  }
  return { start: span.start, end: span.end, text: text.slice(span.start, span.end) };
}

let cachedKey;
let warnedEphemeral = false;
/** Purpose-derived HMAC key from ATS_FIX_SIGNING_SECRET. Prod: required (>=32 chars) or null (fail closed). Dev: ephemeral key. */
function signingKey() {
  if (cachedKey) return cachedKey;
  const secret = process.env.ATS_FIX_SIGNING_SECRET;
  if (secret && secret.length >= 32) {
    cachedKey = createHmac("sha256", secret).update("ai-career-buddy/ats-fix/v1").digest();
    return cachedKey;
  }
  if (process.env.NODE_ENV === "production") return null;
  if (!warnedEphemeral) {
    warnedEphemeral = true;
    console.warn("ATS_FIX_SIGNING_SECRET is missing or shorter than 32 chars; using an ephemeral per-process key (dev only). Fix tokens will not survive a restart.");
  }
  cachedKey = randomBytes(32);
  return cachedKey;
}
const FIX_UNAVAILABLE_MSG = "Fixes are temporarily unavailable. Please try again later.";
const sign = (userId, payload) => createHmac("sha256", signingKey()).update(`${userId}.${payload}`).digest("base64url");

function makeFixId(userId, data) {
  const payload = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  return `${payload}.${sign(userId, payload)}`;
}

function readFixId(userId, fixId) {
  if (typeof fixId !== "string" || fixId.length > 5000 || !signingKey()) return null;
  const [payload, sig, extra] = fixId.split(".");
  if (!payload || !sig || extra !== undefined) return null;
  const want = Buffer.from(sign(userId, payload));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return d && typeof d === "object" ? d : null;
  } catch {
    return null;
  }
}

/** Server-side checks shared by propose and apply. Returns an error message or null. */
function checkFixText(original, proposed, jobDescription) {
  if (!proposed || proposed.length < 10 || proposed.length > FIX_MAX) return "bad_length";
  if (normalizeText(proposed) === normalizeText(original)) return "unchanged";
  if (inventedNumbers(proposed, `${original}\n${jobDescription ?? ""}`).length > 0) return "invented";
  return null;
}

const proposeInput = z.object({ scoreId: z.string().trim().min(1).max(100), weaknessIndex: z.number().int().min(0).max(50) });

/**
 * proposeAtsFix(scoreId, weaknessIndex) -> { fixId, original, proposed, sources, weakness }
 * or { error, code: INVALID | NOT_FOUND | NEEDS_REUPLOAD | NO_SOURCES | INVENTED_DETAIL | AI_LIMIT | AI_UNAVAILABLE | FAILED }.
 * Changes nothing and does not touch the score or the main resume.
 */
// D50: one cap-counted action, however many AI calls it makes.
export async function proposeAtsFix(scoreId, weaknessIndex) {
  return withAiAction(() => proposeAtsFixImpl(scoreId, weaknessIndex));
}

async function proposeAtsFixImpl(scoreId, weaknessIndex) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const input = proposeInput.safeParse({ scoreId, weaknessIndex });
  if (!input.success) return fixFail("INVALID", "We couldn't tell which point to fix. Please try again.");

  try {
    if (!signingKey()) return fixFail("FIX_UNAVAILABLE", FIX_UNAVAILABLE_MSG);
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fixFail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    const score = await db.aTSScore.findFirst({ where: { id: input.data.scoreId, userId: user.id, deletedAt: null } });
    if (!score) return fixFail("NOT_FOUND", "We couldn't find that ATS result.");

    const ev = score.evidence && typeof score.evidence === "object" ? score.evidence : null;
    const resumeText = typeof ev?.resumeText === "string" ? ev.resumeText : "";
    if (!resumeText || isPastResumeTextLimit(score.createdAt)) return fixFail("NEEDS_REUPLOAD", NEEDS_REUPLOAD_MSG);

    const weakness = Array.isArray(ev.weaknesses) ? ev.weaknesses[input.data.weaknessIndex] : null;
    if (!weakness) return fixFail("INVALID", "We couldn't find that point in this result.");

    // Ground the fix in a verified resume quote that can be found in the stored text.
    let span = null;
    for (const s of weakness.sources || []) {
      if (s?.type !== "resume_quote") continue;
      const found = locateQuote(resumeText, s.quote);
      if (found) {
        span = found;
        break;
      }
    }
    if (!span) {
      return fixFail("NO_SOURCES", "We couldn't find an exact line in your resume to rewrite for this point. Try editing that part of your resume directly.");
    }
    const line = lineAround(resumeText, span);
    const original = line.text;

    const jd = score.jobDescription ?? "";
    const catalog = buildSources({ jobDescription: jd });
    const weaknessJd = (weakness.sources || []).filter((s) => s?.type === "jd").map((s) => s.id);

    const prompt = `
You are helping a candidate improve ONE line of their resume for a specific job.

JOB DESCRIPTION (one line per id):
${formatCatalogForPrompt(catalog)}

THE LINE TO REWRITE (exact text from the candidate's resume):
"""
${original}
"""

THE PROBLEM FOUND IN THE RESUME: ${weakness.text}
Related job description ids: ${weaknessJd.join(", ") || "none"}

Rewrite the line so it speaks more directly to the job description.
RULES:
- Use ONLY facts already in the line above. Do NOT add any employer, tool, skill, technology, title, date, metric, number or result that is not in that line.
- You may reword, reorder, and use the job description's terminology for things the line already says.
- Keep it one line, similar length, no markdown.
- If the line cannot be improved without inventing facts, return it lightly reworded.

OUTPUT: valid JSON only, no markdown fences:
{ "proposed": "the rewritten line", "sourceIds": ["jd ids from the list above that the rewrite responds to"] }
`;

    const attempt = async (note) => {
      const out = await runAIStructured("write", atsFixSchema, () => [["user", prompt + note]], { userId });
      const proposed = collapse(out.proposed);
      const ids = validateSourceIds(out.sourceIds, catalog).filter((id) => id.startsWith("jd:"));
      const problem = checkFixText(original, proposed, jd);
      return { proposed, ids, problem: ids.length === 0 && !problem ? "unsourced" : problem };
    };

    let res = await attempt("");
    if (res.problem) {
      res = await attempt(
        "\n\nIMPORTANT: your previous answer was rejected. Do not add any number, percentage or amount that is not in the original line or the job description; list at least one valid job description id in sourceIds; the rewrite must differ from the original and be under 600 characters."
      );
    }
    if (res.problem === "invented") {
      return fixFail("INVENTED_DETAIL", "We couldn't rewrite this without adding details you didn't write. Try editing that part of your resume directly.");
    }
    if (res.problem) {
      return fixFail("NO_SOURCES", "We couldn't ground a rewrite in your resume and the job description. Try editing that part of your resume directly.");
    }

    const sources = [
      { type: "resume_quote", quote: original },
      ...snapshot(res.ids, catalog).map((c) => ({ type: "jd", id: c.id, label: c.label, excerpt: c.excerpt })),
    ];
    const fixId = makeFixId(userId, {
      s: score.id,
      w: input.data.weaknessIndex,
      o: original,
      p: res.proposed,
      a: line.start,
      n: randomBytes(12).toString("base64url"),
      t: Date.now(),
    });
    return { fixId, original, proposed: res.proposed, sources, weakness: weakness.text };
  } catch (error) {
    console.error("proposeAtsFix failed:", safeErr(error));
    if (error?.code === "AI_LIMIT") return fixFail("AI_LIMIT", "Daily AI limit reached. Please try again tomorrow.");
    if (error?.code === "AI_UNAVAILABLE") return fixFail("AI_UNAVAILABLE", "AI is temporarily unavailable. Please try again later.");
    return fixFail("FAILED", "We couldn't prepare a fix right now. Please try again.");
  }
}

const applyInput = z.object({ scoreId: z.string().trim().min(1).max(100), fixId: z.string().min(1).max(5000) });

/**
 * applyAtsFix(scoreId, fixId) -> { newScoreId, before:{atsScore,matchPercentage}, after:{atsScore,matchPercentage} }
 * or { error, code: INVALID | NOT_FOUND | NEEDS_REUPLOAD | STALE | NO_SOURCES | AI_LIMIT | AI_UNAVAILABLE | FAILED }.
 * Replaces the original line in the STORED analyzed text, runs a real re-score with the same validation as
 * a fresh analysis, and saves a NEW ATSScore (evidence.previousScoreId). The old score and the main resume
 * are never changed.
 */
// D50: one cap-counted action, however many AI calls it makes.
export async function applyAtsFix(scoreId, fixId) {
  return withAiAction(() => applyAtsFixImpl(scoreId, fixId));
}

async function applyAtsFixImpl(scoreId, fixId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const input = applyInput.safeParse({ scoreId, fixId });
  if (!input.success) return fixFail("INVALID", "We couldn't apply that fix. Please propose it again.");

  // Same-process double click: concurrent calls with the same nonce share one promise (one AI call).
  // Across instances a truly simultaneous double apply may still spend one extra capped re-score, but the
  // advisory lock plus re-check inside the transaction means it can never create two rows.
  let nonce = null;
  try {
    nonce = signingKey() ? readFixId(userId, input.data.fixId)?.n : null;
  } catch {
    nonce = null;
  }
  if (typeof nonce !== "string" || !nonce) return applyAtsFixInner(userId, input.data);
  const key = `${userId}:${nonce}`;
  const running = applyInFlight.get(key);
  if (running) return running;
  const p = applyAtsFixInner(userId, input.data).finally(() => {
    if (applyInFlight.get(key) === p) applyInFlight.delete(key);
  });
  applyInFlight.set(key, p);
  return p;
}

const applyInFlight = new Map();

/** Signed 64-bit key for pg_advisory_xact_lock, from a sha256 prefix. */
function advisoryKey(text) {
  return createHash("sha256").update(text).digest().readBigInt64BE(0);
}

async function applyAtsFixInner(userId, input) {
  try {
    if (!signingKey()) return fixFail("FIX_UNAVAILABLE", FIX_UNAVAILABLE_MSG);
    const fix = readFixId(userId, input.fixId);
    if (!fix || fix.s !== input.scoreId || typeof fix.o !== "string" || typeof fix.p !== "string" || !Number.isInteger(fix.a) || fix.a < 0 || typeof fix.n !== "string" || !fix.n) {
      return fixFail("INVALID", "We couldn't apply that fix. Please propose it again.");
    }
    if (!Number.isFinite(fix.t) || Date.now() - fix.t > FIX_TTL_MS || fix.t > Date.now() + 60_000) {
      return fixFail("STALE", "This suggestion has expired. Please propose the fix again.");
    }

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return fixFail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    const score = await db.aTSScore.findFirst({ where: { id: input.scoreId, userId: user.id, deletedAt: null } });
    if (!score) return fixFail("NOT_FOUND", "We couldn't find that ATS result.");

    const ev = score.evidence && typeof score.evidence === "object" ? score.evidence : null;
    const resumeText = typeof ev?.resumeText === "string" ? ev.resumeText : "";
    if (!resumeText || isPastResumeTextLimit(score.createdAt)) return fixFail("NEEDS_REUPLOAD", NEEDS_REUPLOAD_MSG);

    // Re-verify against the stored text and job description; do not rely on the token alone.
    const at = fix.a;
    if (!resumeText.startsWith(fix.o, at) || checkFixText(fix.o, fix.p, score.jobDescription)) {
      return fixFail("STALE", "This suggestion no longer matches the analyzed resume. Please propose the fix again.");
    }
    const newText = resumeText.slice(0, at) + fix.p + resumeText.slice(at + fix.o.length);

    const existing = await db.aTSScore.findFirst({
      where: {
        userId: user.id,
        deletedAt: null,
        AND: [
          { evidence: { path: ["previousScoreId"], equals: score.id } },
          { evidence: { path: ["appliedFix", "nonce"], equals: fix.n } },
        ],
      },
      select: { id: true },
    });
    if (existing) return fixFail("ALREADY_APPLIED", ALREADY_APPLIED_MSG, existing.id);

    const jobTitle = score.jobTitle ?? "";
    const companyName = score.companyName ?? "";
    const jobDescription = score.jobDescription ?? "";
    if (!jobDescription.trim()) return fixFail("INVALID", "This result has no job description to re-score against.");

    const scored = await scoreResume({ userId, resumeText: newText, jobDescription, jobTitle, companyName });
    if (scored.empty) return fixFail("NO_SOURCES", NO_SOURCES_MSG);
    const { result, raw, evidence } = scored;

    // Serialize on (scoreId, nonce) across instances, re-check, and create only if none exists.
    const outcome = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${advisoryKey(`${score.id}:${fix.n}`)})`;
      // Re-read the source row with a row lock (blocks a concurrent purge until we commit): the text must
      // still be present and the row still within 90 days, otherwise create nothing (D42).
      const src = await tx.$queryRaw`
        SELECT "createdAt", ("evidence" -> 'resumeText') IS NOT NULL AND jsonb_typeof("evidence" -> 'resumeText') = 'string' AS "hasText"
        FROM "ATSScore" WHERE "id" = ${score.id} AND "userId" = ${user.id} FOR UPDATE`;
      const row = src[0];
      if (!row || !row.hasText || isPastResumeTextLimit(new Date(row.createdAt))) return { reupload: true };
      const again = await tx.aTSScore.findFirst({
        where: {
          userId: user.id,
          deletedAt: null,
          AND: [
            { evidence: { path: ["previousScoreId"], equals: score.id } },
            { evidence: { path: ["appliedFix", "nonce"], equals: fix.n } },
          ],
        },
        select: { id: true },
      });
      if (again) return { duplicateId: again.id };
      const created = await tx.aTSScore.create({
        data: {
          user: { connect: { id: user.id } },
          // A fix of a job's result stays linked to that job (the newest result of a job is the one that counts).
          ...(score.jobId ? { job: { connect: { id: score.jobId } } } : {}),
          atsScore: raw.atsScore,
          matchPercentage: raw.matchPercentage,
          strengths: result.strengths.map((x) => x.text),
          weaknesses: result.weaknesses.map((x) => x.text),
          improvements: raw.improvements,
          relevantSkills: raw.relevantSkills,
          missingSkills: raw.missingSkills,
          recommendations: result.recommendations.map(stripRec).map(({ text, ...r }) => r),
          evidence: { ...evidence, previousScoreId: score.id, appliedFix: { original: fix.o, proposed: fix.p, nonce: fix.n } },
          finalSummary: raw.finalSummary,
          analyzedBy: "AI",
          jobTitle: score.jobTitle,
          companyName: score.companyName,
          jobDescription,
        },
        select: { id: true, atsScore: true, matchPercentage: true },
      });
      return { created };
    });
    if (outcome.reupload) return fixFail("NEEDS_REUPLOAD", NEEDS_REUPLOAD_MSG);
    if (outcome.duplicateId) return fixFail("ALREADY_APPLIED", ALREADY_APPLIED_MSG, outcome.duplicateId);
    const { created } = outcome;

    revalidatePath("/resume-parser");
    return {
      newScoreId: created.id,
      before: { atsScore: score.atsScore, matchPercentage: score.matchPercentage },
      after: { atsScore: created.atsScore, matchPercentage: created.matchPercentage },
    };
  } catch (error) {
    console.error("applyAtsFix failed:", safeErr(error));
    if (error?.code === "AI_LIMIT") return fixFail("AI_LIMIT", "Daily AI limit reached. Please try again tomorrow.");
    if (error?.code === "AI_UNAVAILABLE") return fixFail("AI_UNAVAILABLE", "AI is temporarily unavailable. Please try again later.");
    return fixFail("FAILED", "We couldn't re-score your resume right now. Please try again.");
  }
}
