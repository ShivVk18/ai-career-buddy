'use server';



import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

    console.log("=== DEBUG ===");
    console.log("Base64 length:", resumeBase64.length);

    // FULL ATS PROMPT (USE EXACT RULES)
    const prompt = `
You are an ATS scoring engine. Analyze the candidate's resume (PDF) using the strict scoring logic.

Important:
- Think internally but DO NOT reveal chain of thought.
- Output ONLY valid JSON.
- No markdown. No commentary.

JOB DETAILS:
Company: ${companyName}
Position: ${jobTitle}
Job Description: ${jobDescription}

SCORING RULES (STRICT):

1. KEYWORD MATCH (40 points)
   - Extract required technical keywords from job description.
   - Score = (matched_keywords / total_keywords) * 40.

2. FORMAT & STRUCTURE (30 points)
   - ATS-friendly formatting = 10
   - Clear headings = 10
   - Contact info = 5
   - Consistent formatting = 5

3. EXPERIENCE RELEVANCE (30 points)
   - Relevant years = 15
   - Job title match = 10
   - Industry relevance = 5

DEDUCTIONS:
-5 per major weakness
-3 per missing essential skill
If NO summary → -15
If >5 weaknesses → score <65
If >6 missing skills → score <60

SKILL RULES:
- relevantSkills = technical hard skills found in resume
- missingSkills = required skills missing from resume
- ONLY hard skills (languages, frameworks, devops, cloud, db, ml, cybersecurity)
- DO NOT include soft skills (teamwork, communication, leadership, etc.)
- DO NOT include generic skills (MS Office, Google Suite, etc.)

OUTPUT STRICT JSON:
{
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

    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: resumeBase64,
        },
      },
    ];

    console.log("🚀 Calling Gemini 2.5/3.0...");

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents,
    });


    console.log(result.text)
    
    const responseText = result.text;

    console.log("📄 Raw Response:", responseText?.slice(0, 200));

    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    
    let analysisData;

    try {
      const cleaned = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      analysisData = JSON.parse(cleaned);

      if (!analysisData.atsScore)
        throw new Error("Missing atsScore field");
    } catch (err) {
      console.error("❌ PARSE ERROR:", err);
      throw new Error("Invalid JSON returned by AI");
    }

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
        analyzedBy: "Gemini-2.5-Flash",
        jobTitle,
        companyName,
        jobDescription,
      },
    });

    revalidatePath("/ats-scores");

    return { success: true, data: atsAnalysis };
  } catch (err) {
    console.error("❌ Error in createATSAnalysis:", err);
    return { success: false, message: err.message };
  }
}

// Get all ATS scores for current user
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
    console.error("Error fetching ATS scores:", error);
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
    console.error("Error fetching ATS score:", error);
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

    revalidatePath("/ats-scores");
    return { success: true, message: "ATS score deleted successfully" };

  } catch (error) {
    console.error("Error deleting ATS score:", error);
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
    console.error("Error fetching ATS analytics:", error);
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

    revalidatePath("/ats-scores");
    revalidatePath(`/ats-scores/${scoreId}`);
    
    return { success: true, message: "ATS score updated successfully", data: updated };

  } catch (error) {
    console.error("Error updating ATS score:", error);
    throw new Error("Failed to update ATS score");
  }
}