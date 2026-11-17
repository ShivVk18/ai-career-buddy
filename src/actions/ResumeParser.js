'use server';



import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createHmac, createHash, timingSafeEqual, randomBytes } from "node:crypto";
import { runAIStructured } from "@/lib/ai";
import { inventedNumbers } from "@/lib/ai/numberCheck";
import { weightsPromptText } from "@/lib/ats/weights";
import { validateAndExtractPdf, INVALID_FILE_MSG } from "@/lib/ai/pdf";
import { buildSources, formatCatalogForPrompt, snapshot, normalizeText, validateSourceIds } from "@/lib/ai/sources";
import { primaryEmail } from "@/lib/clerkEmail";
import { atsSchema, atsFixSchema } from "@/lib/ai/schemas";
import { safeErr } from "@/lib/utils";

const MIN_ITEMS = 2;
const MIN_QUOTE = 20;
const NO_SOURCES_MSG =
  "We couldn't back the analysis with evidence from your resume. Please check that the PDF has readable text and the job description is complete, then try again.";

const inputSchema = z.object({
  companyName: z.string().trim().max(200).optional().default(""),
  jobTitle: z.string().trim().max(200).optional().default(""),
  jobDescription: z.string().trim().min(1).max(20000),
  resumeBase64: z.string().min(1),
  resumeType: z.string().max(100).optional(),
});

/** Keep only sources the server can verify. Quotes must appear in the extracted PDF text. */
function verifySources(sources, normResume, catalog) {
  const out = [];
  for (const src of sources || []) {
    if (src?.type === "resume_quote") {
      const quote = String(src.quote ?? "").replace(/\s+/g, " ").trim();
      if (quote.length >= MIN_QUOTE && quote.length <= 400 && normResume.includes(normalizeText(quote))) {
        out.push({ type: "resume_quote", quote });
      }
    } else if (src?.type === "jd") {
      const [snap] = snapshot([src.id], catalog);
      if (snap) out.push({ type: "jd", id: snap.id, label: snap.label, excerpt: snap.excerpt });
    }
  }
  return out;
}

/** requireQuote: a claim about the resume (strength/weakness) needs at least one verified resume_quote. */
function verifyItems(items, normResume, catalog, requireQuote) {
  return (items || [])
    .map((it) => ({ ...it, text: String(it.text ?? "").trim(), sources: verifySources(it.sources, normResume, catalog) }))
    .filter(
      (it) =>
        it.text &&
        it.sources.length > 0 &&
        (!requireQuote || it.sources.some((s) => s.type === "resume_quote"))
    );
}

const stripRec = ({ sources, ...rest }) => ({ ...rest });


/** Requirements: "matched" needs a verified resume quote; "gap" needs a verified job description id. */
function verifyRequirements(items, normResume, catalog) {
  const out = [];
  for (const it of items || []) {
    const requirement = String(it?.requirement ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
    const status = String(it?.status ?? "").trim().toLowerCase();
    if (!requirement || (status !== "matched" && status !== "gap")) continue;
    const sources = verifySources(it.sources, normResume, catalog);
    const ok =
      status === "matched" ? sources.some((x) => x.type === "resume_quote") : sources.some((x) => x.type === "jd");
    if (ok) out.push({ requirement, status, sources });
    if (out.length >= 12) break;
  }
  return out;
}

/**
 * The shared analysis used by createATSAnalysis and applyAtsFix, so a re-score has exactly the same
 * prompt and validation as a fresh analysis. Returns { empty: true } when nothing could be sourced,
 * otherwise { result, raw, evidence } (evidence also carries candidateLevel and the analyzed resumeText).
 */
async function scoreResume({ userId, resumeText, jobDescription, jobTitle, companyName }) {
    const normResume = normalizeText(resumeText);
    const catalog = buildSources({ jobDescription });

   const today = new Date().toISOString().split("T")[0];

const prompt = `
You are a REALISTIC ATS (Applicant Tracking System) scoring engine used by top tech companies.

CRITICAL RULES:
- Output ONLY valid JSON
- No markdown
- No explanation
- No reasoning
- No extra text
- No hallucination
- If information unclear → assume neutral, not negative

CURRENT DATE: ${today}

JOB DETAILS:
Company: ${companyName}
Position: ${jobTitle}
Job Description (one line per id):
${formatCatalogForPrompt(catalog)}

RESUME TEXT (extracted from the candidate's PDF):
"""
${resumeText}
"""

STEP 1 — DETECT CANDIDATE LEVEL:
Classify candidate into one:
- Student
- Fresher
- Junior (0-2 yrs)
- Mid (2-5 yrs)
- Senior (5+ yrs)

STEP 2 — EXPERIENCE DATE RULE:
- If end date = "Present" → current role
- If end date >= CURRENT DATE → current role
- Do NOT assume future employment
- If date unclear → assume current

STEP 3 — SCORING WEIGHTS (Dynamic):

${weightsPromptText()}

STEP 4 — KEYWORD MATCH:
Extract ONLY technical required skills from job description.

STEP 5 — EXPERIENCE RELEVANCE:
- Title similarity
- Tech stack similarity
- Responsibility similarity
- Domain relevance (BONUS only, no penalty)

STEP 6 — WEAKNESS RULE:
- Do NOT invent weaknesses
- Only include REAL missing skills
- Maximum weaknesses = 5

STEP 7 — INDUSTRY RULE:
- If industry matches → bonus
- If not → no penalty

STEP 8 — FORMAT RULE:
ATS friendly means:
- Standard headings
- No tables
- No images
- Proper structure

STEP 9 — SKILL RULES:
Include ONLY:
- Programming languages
- Frameworks
- Databases
- DevOps
- Cloud
- AI/ML
- System tools

Exclude:
- Soft skills
- Office tools
- Generic tools

STEP 10 — FINAL SCORE:
- Score must feel realistic like real ATS
- Fresher should NOT score <55 unless very poor
- Strong candidate should NOT score <70

EVIDENCE RULE (mandatory):
- Every item in "strengths", "weaknesses" and "recommendations" needs a non-empty "sources" array.
- A source is either {"type":"resume_quote","quote":"..."} where quote is an EXACT contiguous excerpt (20-200 characters) copied verbatim from the RESUME TEXT, or {"type":"jd","id":"jd:<n>"} using an id from the job description lines above.
- Every strength and every weakness MUST include at least one "resume_quote" (a claim about the resume must be backed by the resume). For a weakness or missing skill, cite the job description line that requires it (type "jd") AND a resume_quote showing what the resume says in that area (for example its skills line).
- Recommendations may cite only job description lines.
- "requirements": list up to 12 of the most important requirements from the job description. status "matched" needs a resume_quote proving it (verbatim, 20-200 characters); status "gap" needs the job description line id ("jd:<n>") that states the requirement. Use only those two statuses.
- Items without a verifiable source will be discarded. Give at least 2 items for each of those three lists when the evidence exists.

OUTPUT JSON STRUCTURE:
{
  "candidateLevel": "",
  "atsScore": 0,
  "matchPercentage": 0,
  "strengths": [{ "text": "", "sources": [{ "type": "resume_quote", "quote": "" }] }],
  "requirements": [{ "requirement": "", "status": "matched", "sources": [{ "type": "resume_quote", "quote": "" }] }, { "requirement": "", "status": "gap", "sources": [{ "type": "jd", "id": "jd:1" }] }],
  "weaknesses": [{ "text": "", "sources": [{ "type": "jd", "id": "jd:1" }] }],
  "improvements": [],
  "relevantSkills": [],
  "missingSkills": [],
  "recommendations": [
    {
      "category": "",
      "priority": "",
      "action": "",
      "impact": "",
      "sources": [{ "type": "jd", "id": "jd:1" }]
    }
  ],
  "finalSummary": ""
}
`;

    const analyze = async (note) => {
      const raw = await runAIStructured("fast", atsSchema, () => [["user", prompt + note]], { userId });
      return {
        raw,
        strengths: verifyItems(raw.strengths, normResume, catalog, true),
        weaknesses: verifyItems(raw.weaknesses, normResume, catalog, true),
        requirements: verifyRequirements(raw.requirements, normResume, catalog),
        recommendations: verifyItems(
          raw.recommendations
            .filter((r) => String(r.action ?? "").trim())
            .map((r) => ({ ...r, text: r.action })),
          normResume,
          catalog,
          false
        ),
      };
    };
    const lacking = (r) => [r.strengths, r.weaknesses, r.recommendations].some((l) => l.length < MIN_ITEMS) || r.requirements.length < 1;
    const total = (r) => r.strengths.length + r.weaknesses.length + r.recommendations.length + r.requirements.length;

    let result = await analyze("");
    if (lacking(result)) {
      try {
        const retry = await analyze(
          "\n\nIMPORTANT: your previous answer had too few items with verifiable sources. Quotes (at least 20 characters) must be copied verbatim from the RESUME TEXT; every strength and weakness needs a resume_quote; jd ids must come from the job description lines."
        );
        if (total(retry) >= total(result)) result = retry;
      } catch (e) {
        console.error("ATS scoring retry failed, keeping first attempt:", safeErr(e));
      }
    }
    if (result.strengths.length + result.weaknesses.length + result.recommendations.length === 0) return { empty: true };

    const { raw } = result;
    const evidence = {
      version: 1,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      recommendations: result.recommendations,
      requirements: result.requirements,
      candidateLevel: String(raw.candidateLevel ?? "").trim().slice(0, 60) || null,
      resumeText,
    };
    return { result, raw, evidence };
}

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
export async function createATSAnalysis(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("User not found");

  const failure = (code, message) => ({ success: false, message, error: message, code });

  try {
    const parsedInput = inputSchema.safeParse(formData ?? {});
    if (!parsedInput.success) {
      const missingFile = !formData?.resumeBase64;
      return missingFile
        ? failure("INVALID_FILE", INVALID_FILE_MSG)
        : failure("INVALID", "Please check the company, job title and job description and try again.");
    }
    const { companyName, jobTitle, jobDescription, resumeBase64, resumeType } = parsedInput.data;

    // Validate the file before any AI call.
    const pdf = await validateAndExtractPdf(resumeBase64, resumeType);
    if (pdf.error) return failure(pdf.code, pdf.error);
    const resumeText = pdf.text.slice(0, 30000);
    // Ensure user exists (never writes a placeholder email)
    const email = primaryEmail(clerkUser);
    const name = clerkUser.firstName
      ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
      : null;
    const dbUser = await db.user.upsert({
      where: { clerkUserId: userId },
      update: { ...(email ? { email } : {}), name },
      create: { clerkUserId: userId, email, name, skills: [] },
    });
    await purgeOldResumeText(dbUser.id);

    const scored = await scoreResume({ userId, resumeText, jobDescription, jobTitle, companyName });
    if (scored.empty) return failure("NO_SOURCES", NO_SOURCES_MSG);
    const { result, raw, evidence } = scored;

    // Plain text goes to the existing columns so older readers keep working.
    const atsAnalysis = await db.aTSScore.create({
      data: {
        user: { connect: { clerkUserId: userId } },
        atsScore: raw.atsScore,
        matchPercentage: raw.matchPercentage,
        strengths: result.strengths.map((x) => x.text),
        weaknesses: result.weaknesses.map((x) => x.text),
        improvements: raw.improvements,
        relevantSkills: raw.relevantSkills,
        missingSkills: raw.missingSkills,
        recommendations: result.recommendations.map(stripRec).map(({ text, ...r }) => r),
        evidence,
        finalSummary: raw.finalSummary,
        analyzedBy: "AI",
        jobTitle,
        companyName,
        jobDescription,
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
    const me = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true, experience: true } });
    if (!me) return [];
    await purgeOldResumeText(me.id);
    const candidateYears = yearsOf(me.experience);

    const scores = await db.aTSScore.findMany({
      where: { userId: me.id },
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
        user: {
          clerkUserId: userId
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
 * Deletes one of the signed-in user's ATS results (owner-scoped). Returns { success: true, message } or
 * { error, code: "INVALID" | "NOT_FOUND" | "FAILED" }. Results that point to it via previousScoreId keep working.
 */
export async function deleteATSScore(scoreId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = z.string().trim().min(1).max(100).safeParse(scoreId);
  if (!id.success) return { error: "We couldn't find that result.", code: "INVALID" };

  try {
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return { error: "We couldn't find your profile.", code: "NOT_FOUND" };

    const res = await db.aTSScore.deleteMany({ where: { id: id.data, userId: user.id } });
    if (res.count === 0) return { error: "We couldn't find that result.", code: "NOT_FOUND" };

    revalidatePath("/resume-parser");
    return { success: true, message: "ATS score deleted successfully" };
  } catch (error) {
    console.error("deleteATSScore failed:", safeErr(error));
    return { error: "We couldn't delete that result. Please try again.", code: "FAILED" };
  }
}

// Get ATS analytics for dashboard
export async function getATSAnalytics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const scores = await db.aTSScore.findMany({
      where: { 
        user: {
          clerkUserId: userId
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
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true, experience: true } });
    if (!user) return { success: false, error: "We couldn't find your profile.", code: "NOT_FOUND" };

    const result = await db.aTSScore.updateMany({
      where: { id: id.data, userId: user.id },
      data: data.data,
    });
    if (result.count === 0) return { success: false, error: "ATS score not found.", code: "NOT_FOUND" };

    const updated = await db.aTSScore.findFirst({ where: { id: id.data, userId: user.id } });
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
export async function proposeAtsFix(scoreId, weaknessIndex) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const input = proposeInput.safeParse({ scoreId, weaknessIndex });
  if (!input.success) return fixFail("INVALID", "We couldn't tell which point to fix. Please try again.");

  try {
    if (!signingKey()) return fixFail("FIX_UNAVAILABLE", FIX_UNAVAILABLE_MSG);
    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return fixFail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    const score = await db.aTSScore.findFirst({ where: { id: input.data.scoreId, userId: user.id } });
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
export async function applyAtsFix(scoreId, fixId) {
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

    const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
    if (!user) return fixFail("NOT_FOUND", "We couldn't find your profile. Please finish onboarding first.");
    const score = await db.aTSScore.findFirst({ where: { id: input.scoreId, userId: user.id } });
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
