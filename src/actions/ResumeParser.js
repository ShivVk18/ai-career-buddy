'use server';



import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { runAIStructured, pdfPart } from "@/lib/ai";
import { atsSchema } from "@/lib/ai/schemas";

export async function createATSAnalysis(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("User not found");

  try {
    // Ensure user exists
    await db.user.upsert({
      where: { clerkUserId: userId },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@placeholder.com`,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
          : null,
      },
      create: {
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@placeholder.com`,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
          : null,
        skills: [],
      },
    });

    const { companyName, jobTitle, jobDescription, resumeBase64 } = formData;

    if (!resumeBase64) throw new Error("Resume PDF missing");

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
Job Description: ${jobDescription}

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

OUTPUT JSON STRUCTURE:
{
  "candidateLevel": "",
  "atsScore": 0,
  "matchPercentage": 0,
  "strengths": [],
  "weaknesses": [],
  "improvements": [],
  "relevantSkills": [],
  "missingSkills": [],
  "recommendations": [
    {
      "category": "",
      "priority": "",
      "action": "",
      "impact": ""
    }
  ],
  "finalSummary": ""
}
`;

    const analysisData = await runAIStructured(
      "fast",
      atsSchema,
      () => [
        {
          role: "user",
          content: [{ type: "text", text: prompt }, pdfPart(resumeBase64)],
        },
      ],
      { userId }
    );

    // Save to DB
    const atsAnalysis = await db.aTSScore.create({
      data: {
        user: { connect: { clerkUserId: userId } },
        atsScore: analysisData.atsScore,
        matchPercentage: analysisData.matchPercentage,
        strengths: analysisData.strengths,
        weaknesses: analysisData.weaknesses,
        improvements: analysisData.improvements,
        relevantSkills: analysisData.relevantSkills,
        missingSkills: analysisData.missingSkills,
        recommendations: analysisData.recommendations,
        finalSummary: analysisData.finalSummary,
        analyzedBy: "AI",
        jobTitle,
        companyName,
        jobDescription,
      },
    });

    revalidatePath("/resume-parser");

    return { success: true, data: atsAnalysis };
  } catch (err) {
    console.error("Error in createATSAnalysis:", err?.code || err?.name || "error");
    const known = ["Resume PDF missing", "Unauthorized"];
    return {
      success: false,
      message: known.includes(err?.message)
        ? err.message
        : "We couldn't analyze your resume right now. Please try again.",
    };
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
    console.error("Error fetching ATS scores failed:", error?.message);
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
    console.error("Error fetching ATS score failed:", error?.message);
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
    console.error("Error deleting ATS score failed:", error?.message);
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
    console.error("Error fetching ATS analytics failed:", error?.message);
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
    console.error("Error updating ATS score failed:", error?.message);
    throw new Error("Failed to update ATS score");
  }
}