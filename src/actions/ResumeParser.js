'use server'

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Create ATS Score Analysis
export async function createATSAnalysis(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("User not found");

  try {
    // Ensure user exists in database
    await db.user.upsert({
      where: { clerkUserId: userId },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@placeholder.com`,
        name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim() : null,
      },
      create: {
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || `${userId}@placeholder.com`,
        name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim() : null,
        skills: [],
      },
    });

    const { companyName, jobTitle, jobDescription, resumeBase64 } = formData;

    if (!resumeBase64) throw new Error("Resume file is required");

    console.log("=== DEBUG INFO ===");
    console.log("Resume base64 length:", resumeBase64?.length);
    console.log("Has job description:", !!jobDescription);
    console.log("Company:", companyName);
    console.log("Job Title:", jobTitle);

    // STRICT PROMPT WITH CHAIN OF THOUGHT
    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Carefully analyze the provided resume PDF against the job requirements.

**Job Details:**
- Company: ${companyName || "Not specified"}
- Position: ${jobTitle || "Not specified"}  
- Job Description: ${jobDescription || "General resume analysis - evaluate overall ATS compatibility"}

**CRITICAL SCORING INSTRUCTIONS:**

You MUST use Chain of Thought reasoning before scoring:

**Step 1: Keyword Analysis (40 points max)**
- Extract ALL keywords from job description
- Count exact matches in resume
- Partial matches count as half points
- Calculate: (matched keywords / total required keywords) × 40

**Step 2: Format & Structure (30 points max)**
- ATS-friendly formatting (no tables/graphics): 10 points
- Clear section headings: 10 points  
- Contact info present: 5 points
- Consistent formatting: 5 points

**Step 3: Experience Relevance (30 points max)**
- Years of relevant experience: 15 points
- Job title alignment: 10 points
- Industry fit: 5 points

**STRICT GRADING SCALE - FOLLOW EXACTLY:**
- 90-100: Exceptional - Perfect match, ready to submit (RARE - only if 0-1 weaknesses)
- 80-89: Very Good - Strong candidate (max 2-3 minor weaknesses)
- 70-79: Good - Decent match (3-4 weaknesses, needs improvements)
- 60-69: Fair - Significant gaps (5-6 weaknesses, major improvements needed)
- 50-59: Poor - Many issues (7+ weaknesses, overhaul required)
- Below 50: Unacceptable - Fundamental problems

**CRITICAL RULES:**
1. Match percentage should ALWAYS be LOWER than ATS score (by 5-15 points)
2. If 5+ weaknesses → score MUST be below 65
3. If 6+ missing skills → score MUST be below 60
4. If no professional summary + no metrics → automatic -15 points
5. Count your weaknesses and missing skills BEFORE scoring!

**Score Calculation Formula:**
- Start with keyword match × 0.4 = max 40 points
- Add format score (0-30 points)
- Add experience relevance (0-30 points)
- Subtract 5 points per critical weakness
- Subtract 3 points per missing skill
- Final score = Total after deductions

**SKILLS EXTRACTION RULES (CRITICAL):**
- relevantSkills: Extract ONLY core technical/professional skills from resume
  * Programming languages (JavaScript, Python, Java, C++, etc.)
  * Frameworks & libraries (React, Angular, Django, Spring, etc.)
  * Databases (SQL, MongoDB, PostgreSQL, Redis, etc.)
  * Cloud platforms (AWS, Azure, GCP)
  * DevOps tools (Docker, Kubernetes, Jenkins, Git)
  * Methodologies (Agile, Scrum, TDD only if specifically mentioned)
  * Domain expertise (Machine Learning, Data Analysis, Cybersecurity, etc.)
  * Professional certifications (PMP, AWS Certified, CISSP, etc.)

- missingSkills: Extract ONLY core skills from job description that are NOT in resume
  * Same categories as above
  * Focus on skills that would significantly impact job performance

**DO NOT INCLUDE:**
- Soft skills (communication, leadership, teamwork, problem-solving)
- Generic abilities (analytical thinking, attention to detail)
- Basic tools (MS Office, Email, Google Suite)
- Overly broad terms (programming, development, management)
- Personal attributes (hardworking, dedicated, passionate)

**LIMITS:**
- Maximum 8-10 skills in relevantSkills array
- Maximum 8-10 skills in missingSkills array
- Only list the MOST important core skills

**IMPORTANT**: Return ONLY valid JSON in this exact format (no markdown, no explanation):

{
  "atsScore": 72,
  "matchPercentage": 65,
  "strengths": [
    "Well-structured resume with clear sections",
    "Strong action verbs used throughout",
    "Quantified achievements with metrics",
    "Relevant technical skills listed"
  ],
  "weaknesses": [
    "Missing keywords from job description",
    "No professional summary section",
    "Contact information incomplete"
  ],
  "improvements": [
    "Add keywords like '${jobDescription ? jobDescription.split(' ').slice(0, 5).join(', ') : 'relevant terms'}' throughout resume",
    "Include a professional summary at the top",
    "Add certifications section if applicable",
    "Use more industry-specific terminology"
  ],
  "relevantSkills": [
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "AWS"
  ],
  "missingSkills": [
    "TypeScript",
    "Docker",
    "Kubernetes",
    "GraphQL"
  ],
  "recommendations": [
    {
      "category": "Keyword Optimization",
      "priority": "High",
      "action": "Add job-specific keywords like 'React', 'Node.js', 'Microservices' throughout your resume",
      "impact": "Can improve ATS score by 15-20 points"
    },
    {
      "category": "Quantifiable Achievements",
      "priority": "High",
      "action": "Replace generic descriptions with metrics (e.g., 'Increased system performance by 40%')",
      "impact": "Makes resume 3x more impactful for recruiters"
    },
    {
      "category": "ATS Formatting",
      "priority": "Medium",
      "action": "Use standard section headings: 'Work Experience', 'Education', 'Skills'",
      "impact": "Ensures ATS can correctly parse all sections"
    },
    {
      "category": "Skills Section",
      "priority": "Medium",
      "action": "Add a dedicated skills section with both technical and soft skills",
      "impact": "Improves keyword matching by 25%"
    }
  ],
  "finalSummary": "The resume demonstrates solid experience but needs optimization for ATS systems. Key improvements include adding relevant keywords, quantifying achievements, and ensuring all sections are clearly labeled. With targeted modifications, the ATS score could improve by 15-20 points."
}

**Be realistic and thorough - analyze the actual resume content carefully.**`;

    // CORRECT SYNTAX (from official docs)
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: resumeBase64, // Already base64 encoded
        },
      },
    ];

    console.log("🚀 Sending request to Gemini API...");

    // Call API with correct syntax
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", // or gemini-1.5-flash
      contents: contents, // Direct array, no nesting
    });

    console.log("✅ Response received from Gemini");

    // Get response text
    const responseText = response.text;
    console.log("📄 Raw AI Response:", responseText?.substring(0, 200) + "...");

    if (!responseText || responseText.trim() === "{}") {
      throw new Error("Gemini returned empty response. The PDF might be too large or corrupted.");
    }

    // Parse AI response
    let analysisData;
    try {
      // Clean response (remove markdown if present)
      const cleanedText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      analysisData = JSON.parse(cleanedText);
      
      console.log("📊 Parsed Scores:");
      console.log("  - ATS Score:", analysisData.atsScore);
      console.log("  - Match %:", analysisData.matchPercentage);

      // STRICT VALIDATION
      if (!analysisData.atsScore || analysisData.atsScore === 0) {
        console.error("❌ Invalid atsScore:", analysisData.atsScore);
        throw new Error("AI failed to calculate ATS score. Please ensure the PDF is readable.");
      }
      
      if (typeof analysisData.atsScore !== 'number' || analysisData.atsScore < 0 || analysisData.atsScore > 100) {
        throw new Error(`Invalid ATS score range: ${analysisData.atsScore}`);
      }

      // Ensure match percentage exists
      if (!analysisData.matchPercentage || typeof analysisData.matchPercentage !== 'number') {
        analysisData.matchPercentage = Math.max(0, analysisData.atsScore - 10); // Slightly lower than ATS score
      }

      // Validate and ensure all arrays/objects exist
      analysisData.strengths = Array.isArray(analysisData.strengths) && analysisData.strengths.length > 0
        ? analysisData.strengths
        : ["Resume successfully analyzed"];
      
      analysisData.weaknesses = Array.isArray(analysisData.weaknesses) 
        ? analysisData.weaknesses 
        : ["No major weaknesses detected"];
      
      analysisData.improvements = Array.isArray(analysisData.improvements) && analysisData.improvements.length > 0
        ? analysisData.improvements
        : ["Continue optimizing based on specific job requirements"];
      
      // FILTER CORE SKILLS ONLY (additional validation layer)
      const filterCoreSkills = (skills) => {
        if (!Array.isArray(skills)) return [];
        
        const softSkillsKeywords = [
          'communication', 'teamwork', 'leadership', 'problem solving',
          'analytical thinking', 'attention to detail', 'time management',
          'critical thinking', 'adaptability', 'collaboration', 'creativity',
          'work ethic', 'interpersonal', 'organizational', 'multitasking'
        ];
        
        return skills
          .filter(skill => {
            const lowerSkill = skill.toLowerCase();
            return !softSkillsKeywords.some(soft => lowerSkill.includes(soft));
          })
          .slice(0, 10); // Limit to 10 skills max
      };
      
      analysisData.relevantSkills = filterCoreSkills(analysisData.relevantSkills);
      analysisData.missingSkills = filterCoreSkills(analysisData.missingSkills);
      
      // NEW: Validate recommendations format
      if (Array.isArray(analysisData.recommendations) && analysisData.recommendations.length > 0) {
        // Check if recommendations are objects with required fields
        const firstRec = analysisData.recommendations[0];
        if (typeof firstRec === 'object' && firstRec.category && firstRec.action) {
          // Already in correct format - ensure all have required fields
          analysisData.recommendations = analysisData.recommendations.map(rec => ({
            category: rec.category || "General Improvement",
            priority: rec.priority || "Medium",
            action: rec.action || "Review and optimize",
            impact: rec.impact || "Will improve overall resume quality"
          }));
        } else {
          // Convert string array to object format
          analysisData.recommendations = analysisData.recommendations.map((rec, idx) => ({
            category: idx === 0 ? "Keyword Optimization" : 
                     idx === 1 ? "Content Enhancement" : 
                     idx === 2 ? "Formatting" : "General Improvement",
            priority: idx < 2 ? "High" : "Medium",
            action: typeof rec === 'string' ? rec : "Optimize resume content",
            impact: "Will improve ATS compatibility and recruiter appeal"
          }));
        }
      } else {
        // Default recommendations if none provided
        analysisData.recommendations = [
          {
            category: "Resume Optimization",
            priority: "High",
            action: "Tailor resume for each job application with relevant keywords",
            impact: "Significantly improves match percentage"
          }
        ];
      }
      
      analysisData.finalSummary = analysisData.finalSummary && typeof analysisData.finalSummary === 'string'
        ? analysisData.finalSummary
        : "Resume analysis completed successfully. Review detailed feedback for improvement areas.";

    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError.message);
      console.error("Response preview:", responseText?.substring(0, 500));
      throw new Error("Failed to parse AI response. The AI may have returned an invalid format.");
    }

    // Clamp scores to valid range
    analysisData.atsScore = Math.min(100, Math.max(0, Math.round(analysisData.atsScore)));
    analysisData.matchPercentage = Math.min(100, Math.max(0, Math.round(analysisData.matchPercentage)));

    console.log("💾 Saving to database...");

    // Save to database
    const atsAnalysis = await db.aTSScore.create({
      data: {
        user: {
          connect: { clerkUserId: userId }
        },
        atsScore: analysisData.atsScore,
        matchPercentage: analysisData.matchPercentage,
        strengths: analysisData.strengths,
        weaknesses: analysisData.weaknesses,
        improvements: analysisData.improvements,
        relevantSkills: analysisData.relevantSkills,
        missingSkills: analysisData.missingSkills,
        recommendations: analysisData.recommendations,
        finalSummary: analysisData.finalSummary,
        analyzedBy: "Gemini-2.0-Flash",
        jobTitle: jobTitle || null,
        companyName: companyName || null,
        jobDescription: jobDescription || null,
      },
    });

    console.log("✅ Analysis saved successfully with ATS Score:", atsAnalysis.atsScore);

    revalidatePath("/ats-scores");

    return { success: true, data: atsAnalysis };

  } catch (error) {
    console.error("❌ Error in createATSAnalysis:", error);
    throw new Error("Failed to analyze resume: " + error.message);
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