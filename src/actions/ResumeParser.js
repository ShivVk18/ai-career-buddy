'use server';



import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { runAIStructured } from "@/lib/ai";
import { validateAndExtractPdf, INVALID_FILE_MSG } from "@/lib/ai/pdf";
import { buildSources, formatCatalogForPrompt, snapshot, normalizeText } from "@/lib/ai/sources";
import { primaryEmail } from "@/lib/clerkEmail";
import { atsSchema } from "@/lib/ai/schemas";
import { safeErr } from "@/lib/utils";

const MIN_ITEMS = 2;
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
      if (quote.length >= 8 && quote.length <= 400 && normResume.includes(normalizeText(quote))) {
        out.push({ type: "resume_quote", quote });
      }
    } else if (src?.type === "jd") {
      const [snap] = snapshot([src.id], catalog);
      if (snap) out.push({ type: "jd", id: snap.id, label: snap.label, excerpt: snap.excerpt });
    }
  }
  return out;
}

function verifyItems(items, normResume, catalog) {
  return (items || [])
    .map((it) => ({ ...it, text: String(it.text ?? "").trim(), sources: verifySources(it.sources, normResume, catalog) }))
    .filter((it) => it.text && it.sources.length > 0);
}

const stripRec = ({ sources, ...rest }) => ({ ...rest });

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
    const normResume = normalizeText(resumeText);

    // Ensure user exists (never writes a placeholder email)
    const email = primaryEmail(clerkUser);
    const name = clerkUser.firstName
      ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
      : null;
    await db.user.upsert({
      where: { clerkUserId: userId },
      update: { ...(email ? { email } : {}), name },
      create: { clerkUserId: userId, email, name, skills: [] },
    });

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

IF Student/Fresher:
- Skills Match → 50
- Projects → 25
- Internship → 15
- Format → 10

IF Junior:
- Skills → 40
- Experience → 40
- Format → 20

IF Mid/Senior:
- Experience → 50
- Skills → 30
- Format → 20

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
- A source is either {"type":"resume_quote","quote":"..."} where quote is an EXACT contiguous excerpt (8-200 characters) copied verbatim from the RESUME TEXT, or {"type":"jd","id":"jd:<n>"} using an id from the job description lines above.
- For a weakness or missing skill, cite the job description line that requires it (type "jd").
- Items without a verifiable source will be discarded. Give at least 2 items for each of those three lists when the evidence exists.

OUTPUT JSON STRUCTURE:
{
  "candidateLevel": "",
  "atsScore": 0,
  "matchPercentage": 0,
  "strengths": [{ "text": "", "sources": [{ "type": "resume_quote", "quote": "" }] }],
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
        strengths: verifyItems(raw.strengths, normResume, catalog),
        weaknesses: verifyItems(raw.weaknesses, normResume, catalog),
        recommendations: verifyItems(
          raw.recommendations.map((r) => ({ ...r, text: r.action || r.impact || r.category })),
          normResume,
          catalog
        ),
      };
    };
    const lacking = (r) => [r.strengths, r.weaknesses, r.recommendations].some((l) => l.length < MIN_ITEMS);
    const total = (r) => r.strengths.length + r.weaknesses.length + r.recommendations.length;

    let result = await analyze("");
    if (lacking(result)) {
      const retry = await analyze(
        "\n\nIMPORTANT: your previous answer had too few items with verifiable sources. Quotes must be copied verbatim from the RESUME TEXT; jd ids must come from the job description lines."
      );
      if (total(retry) >= total(result)) result = retry;
    }
    if (total(result) === 0) return failure("NO_SOURCES", NO_SOURCES_MSG);

    const { raw } = result;
    const evidence = {
      version: 1,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      recommendations: result.recommendations,
    };

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

    return { success: true, data: atsAnalysis };
  } catch (err) {
    console.error("createATSAnalysis failed:", safeErr(err));
    if (err?.code === "AI_LIMIT") return failure("AI_LIMIT", "Daily AI limit reached. Please try again tomorrow.");
    return failure("FAILED", "We couldn't analyze your resume right now. Please try again.");
  }
}


export async function getUserATSScores() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const scores = await db.aTSScore.findMany({
      where: { 
        user: {
          clerkUserId: userId
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        atsScore: true,
        matchPercentage: true,
        jobTitle: true,
        companyName: true,
        analyzedBy: true,
        createdAt: true,
        finalSummary: true,
      },
    });

    return scores;
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
    });

    if (!score) {
      throw new Error("ATS score not found");
    }

    return score;
  } catch (error) {
    console.error("getATSScoreById failed:", safeErr(error));
    throw new Error("Failed to fetch ATS score details");
  }
}

// Delete ATS score
export async function deleteATSScore(scoreId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const score = await db.aTSScore.findFirst({
      where: {
        id: scoreId,
        user: {
          clerkUserId: userId
        }
      }
    });

    if (!score) {
      throw new Error("ATS score not found or unauthorized");
    }

    await db.aTSScore.delete({
      where: { id: scoreId }
    });

    revalidatePath("/resume-parser");
    return { success: true, message: "ATS score deleted successfully" };

  } catch (error) {
    console.error("deleteATSScore failed:", safeErr(error));
    throw new Error("Failed to delete ATS score");
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

// Update ATS score
export async function updateATSScore(scoreId, updateData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const score = await db.aTSScore.findFirst({
      where: {
        id: scoreId,
        user: {
          clerkUserId: userId
        }
      }
    });

    if (!score) {
      throw new Error("ATS score not found or unauthorized");
    }

    const updated = await db.aTSScore.update({
      where: { id: scoreId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/resume-parser");
    
    return { success: true, message: "ATS score updated successfully", data: updated };

  } catch (error) {
    console.error("updateATSScore failed:", safeErr(error));
    throw new Error("Failed to update ATS score");
  }
}