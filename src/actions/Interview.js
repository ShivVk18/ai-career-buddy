"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import AiServices  from "@/services/AiServices";
import { GoogleGenAI } from "@google/genai";



const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });  

function cleanJsonResponse(response) {
    // Remove markdown code blocks
    let cleaned = response.replace(/```(?:json)?\n?/g, "").trim();

    // Remove any trailing text after the JSON
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}") + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd);
    }

    return cleaned;
  }


function safeJsonParse(jsonString, fallbackData = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("JSON Parse Error:", error.message);
      console.error("Problematic JSON:", jsonString.substring(0, 500) + "...");

      if (fallbackData) {
        return fallbackData;
      }

      throw new Error(`Invalid JSON response: ${error.message}`);
    }
  }

export async function generateQuiz(skills) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Fetch user industry + skills from DB
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        industry: true,
        skills: true,
      },
    });

    if (!user) throw new Error("User not found");

    // Clean skills input
    const sanitizedSkills = skills
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const formattedSkills =
      sanitizedSkills.length > 0 ? ` with expertise in ${sanitizedSkills.join(", ")}` : "";

    // Prompt for the AI
    const prompt = `
You are an expert technical interviewer and AI content generator.

Generate exactly 10 high-quality multiple-choice interview questions focused SPECIFICALLY on the following technical skills:
SKILLS TO ASSESS: ${sanitizedSkills.join(", ")}

CONTEXT:
- Target Industry: ${user.industry}
- Candidate Level: Professional

RULES FOR QUESTION GENERATION:
1. Every question MUST directly relate to at least one of the provided skills.
2. Ensure a mix of theoretical knowledge and practical scenario-based questions.
3. Questions should be challenging and suitable for a professional level.
4. Output MUST be valid JSON and follow the schema below.
5. Do NOT include any markdown formatting, explanations outside the JSON, or extra text.

OUTPUT SCHEMA:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "1-2 sentences explaining why the answer is correct"
    }
  ]
}

Ensure all 10 questions are unique and the correctAnswer exactly matches one of the provided options.
`;

    // Gemini API call
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.3 },
    });

    const rawText =
      result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!rawText) {
      console.error("❌ Empty Gemini response:", JSON.stringify(result, null, 2));
      throw new Error("AI returned no content");
    }

    console.log("🔍 Raw Gemini Output:", rawText);

    // Clean invalid JSON (removes ```json, trailing commas, etc.)
    const cleaned = cleanJsonResponse(rawText);
    const parsed = safeJsonParse(cleaned);

    if (!parsed || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid quiz format from AI");
    }

    // Validate exactly 10 questions
    if (parsed.questions.length !== 10) {
      console.warn("⚠ AI returned wrong number of questions. Cutting to 10.");
      parsed.questions = parsed.questions.slice(0, 10);
    }

    return parsed.questions;
  } catch (error) {
    console.error("🔥 Quiz Generation Error:", error);
    throw new Error("Failed to generate quiz. Please try again.");
  }
}


export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Generate improvement tip if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    try {
      improvementTip = await AiServices.generateImprovementTip(user.industry, wrongAnswers);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}

export async function getLatestQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const quiz = await db.assessment.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return quiz?.questions || null;
}
