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

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
You are an AI that outputs ONLY valid JSON.

Generate exactly 10 multiple-choice interview questions for a ${user.industry} professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }.

Each question must follow this schema:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctAnswer": "string",
  "explanation": "string (1-2 sentences)"
}

Final Output:
{
  "questions": [
    { ... }, { ... }, ... 10 items
  ]
}

Rules:
1. Output must be valid JSON.
2. No comments, markdown, or extra text.
3. Keep explanations concise (max 2 sentences).
`;

  try {
    const result = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.3 },
    });

    // ✅ Correctly extract text for @google/genai SDK
    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      console.error("Empty or invalid Gemini response:", JSON.stringify(result, null, 2));
      throw new Error("No content received from AI");
    }

    console.log("Raw Gemini Output:", rawText);

    const cleanedText = cleanJsonResponse(rawText);
    const quiz = safeJsonParse(cleanedText);

    if (!quiz?.questions || !Array.isArray(quiz.questions)) {
      throw new Error("Invalid quiz format received from AI");
    }

    return quiz.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
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
