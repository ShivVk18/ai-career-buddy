"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { runAIStructured, runAIText } from "@/lib/ai";
import { quizSchema } from "@/lib/ai/schemas";
import { safeErr } from "@/lib/utils";
import { z } from "zod";

const skillsSchema = z.array(z.string().trim().min(1).max(100)).min(1).max(20);
const submitSchema = z.object({
  quizId: z.string().min(1).max(64),
  answers: z.array(z.string().max(1000).nullable()).min(1).max(20),
});

const MESSAGES = {
  AI_LIMIT: "Daily AI limit reached. Please try again tomorrow.",
  ALREADY_SUBMITTED: "This quiz has already been submitted.",
  NOT_FOUND: "Quiz not found.",
  INVALID: "Invalid input. Please check your submission and try again.",
  FAILED: "Something went wrong. Please try again.",
};
const fail = (code, message) => ({ error: message || MESSAGES[code], code });

export async function generateQuiz(skills) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const skillsParsed = skillsSchema.safeParse(skills);
    if (!skillsParsed.success) return fail("INVALID", "Please provide 1-20 skills, each 1-100 characters.");

    // Fetch user industry + skills from DB
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        industry: true,
        skills: true,
      },
    });

    if (!user) return fail("NOT_FOUND", "User not found.");

    const sanitizedSkills = skillsParsed.data;

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

    // Keep only well-formed questions (correct answer must be one of the options).
    const valid = parsed.questions
      .filter((q) => q.options.includes(q.correctAnswer))
      .slice(0, 10);
    if (valid.length < 5) return fail("FAILED", "Could not generate a quiz. Please try again.");

    // Housekeeping: drop this user's own unsubmitted sessions older than 7 days.
    await db.quizSession
      .deleteMany({
        where: {
          userId: user.id,
          submittedAt: null,
          createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      })
      .catch(() => {});

    const session = await db.quizSession.create({
      data: { userId: user.id, questions: valid },
      select: { id: true },
    });

    // correctAnswer and explanation stay on the server until submitQuiz.
    return {
      quizId: session.id,
      questions: valid.map((q) => ({ question: q.question, options: q.options })),
    };
  } catch (error) {
    if (error?.message === "Unauthorized") throw error;
    console.error("Quiz generation failed:", safeErr(error));
    if (error?.code === "AI_LIMIT") return fail("AI_LIMIT");
    return fail("FAILED", "Failed to generate quiz. Please try again.");
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

export async function submitQuiz(quizId, answers) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const parsedInput = submitSchema.safeParse({ quizId, answers });
    if (!parsedInput.success) return fail("INVALID");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) return fail("NOT_FOUND", "User not found.");

    const session = await db.quizSession.findFirst({
      where: { id: parsedInput.data.quizId, userId: user.id },
    });
    if (!session) return fail("NOT_FOUND");
    if (session.submittedAt) return fail("ALREADY_SUBMITTED");

    const stored = Array.isArray(session.questions) ? session.questions : [];
    const given = parsedInput.data.answers;
    if (stored.length === 0 || given.length !== stored.length) return fail("INVALID");

    const results = stored.map((q, i) => ({
      question: q.question,
      options: q.options,
      userAnswer: given[i],
      correctAnswer: q.correctAnswer,
      isCorrect: given[i] !== null && given[i] === q.correctAnswer,
      explanation: q.explanation,
    }));
    const correctCount = results.filter((r) => r.isCorrect).length;
    const total = results.length;
    const score = (correctCount / total) * 100;

    const wrongAnswers = results
      .filter((r) => !r.isCorrect)
      .map((r) => ({ question: r.question, answer: r.correctAnswer, userAnswer: r.userAnswer ?? "(no answer)" }));

    // Claim the session and write the result atomically: a double submit cannot
    // be scored twice, and a crash cannot leave a submitted quiz with no result.
    const assessment = await db.$transaction(async (tx) => {
      const claimed = await tx.quizSession.updateMany({
        where: { id: session.id, userId: user.id, submittedAt: null },
        data: { submittedAt: new Date() },
      });
      if (claimed.count !== 1) return null;
      return tx.assessment.create({
        data: {
          userId: user.id,
          quizScore: score,
          questions: results.map((r) => ({
            question: r.question,
            answer: r.correctAnswer,
            userAnswer: r.userAnswer,
            isCorrect: r.isCorrect,
            explanation: r.explanation,
          })),
          category: "Technical",
          improvementTip: null,
        },
      });
    });
    if (!assessment) return fail("ALREADY_SUBMITTED");

    // Only the winner spends an AI call, outside the transaction. Failure or
    // AI_LIMIT leaves improvementTip null; the submission still succeeds.
    let improvementTip = null;
    if (wrongAnswers.length > 0) {
      try {
        improvementTip = (await generateImprovementTip(user.industry, wrongAnswers, userId)) || null;
        if (improvementTip) {
          await db.assessment.update({
            where: { id: assessment.id },
            data: { improvementTip },
          });
        }
      } catch {
        console.error("Error generating or saving improvement tip");
      }
    }

    return { assessmentId: assessment.id, score, correctCount, total, improvementTip, results };
  } catch (error) {
    console.error("submitQuiz failed:", safeErr(error));
    return fail("FAILED", "Failed to save quiz result. Please try again.");
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
