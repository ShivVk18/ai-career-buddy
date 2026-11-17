"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { runAIStructured, runAIText } from "@/lib/ai";
import { quizSchema } from "@/lib/ai/schemas";
import { safeErr } from "@/lib/utils";

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

    const parsed = await runAIStructured("fast", quizSchema, () => [["user", prompt]], {
      userId,
      temperature: 0.3,
    });

    return parsed.questions.slice(0, 10);
  } catch (error) {
    console.error("Quiz generation failed:", safeErr(error));
    throw new Error("Failed to generate quiz. Please try again.");
  }
}


async function generateImprovementTip(industry, wrongAnswers, userId) {
  const wrongQuestionsText = wrongAnswers
    .map(
      (q) =>
        `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
    )
    .join("\n\n");

  const prompt = `
      The user got the following ${industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

  return runAIText("write", () => [["user", prompt]], { userId });
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
      improvementTip = await generateImprovementTip(user.industry, wrongAnswers, userId);
    } catch {
      console.error("Error generating improvement tip");
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
    console.error("saveQuizResult failed:", safeErr(error));
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
    console.error("getAssessments failed:", safeErr(error));
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
