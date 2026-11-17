import { z } from "zod";

export const quizSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).min(2),
        correctAnswer: z.string().min(1),
        explanation: z.string().min(1),
      })
    )
    .min(10),
});

const strList = z.array(z.string()).default([]);

export const atsSchema = z.object({
  candidateLevel: z.string().optional(),
  atsScore: z.number().min(0).max(100),
  matchPercentage: z.number().min(0).max(100).nullable().optional(),
  strengths: strList,
  weaknesses: strList,
  improvements: strList,
  relevantSkills: strList,
  missingSkills: strList,
  recommendations: z
    .array(
      z.object({
        category: z.string().default(""),
        priority: z.string().default(""),
        action: z.string().default(""),
        impact: z.string().default(""),
      })
    )
    .default([]),
  finalSummary: z.string().default(""),
});

export const roadmapSchema = z.object({
  steps: z
    .array(
      z.object({
        id: z.number(),
        title: z.string(),
        description: z.string(),
        category: z.string(),
        priority: z.string(),
        resources: z.array(z.string()).default([]),
        completed: z.boolean().default(false),
      })
    )
    .min(1),
  milestones: z
    .array(z.object({ title: z.string(), targetDate: z.string(), summary: z.string() }))
    .default([]),
  resources: z
    .array(
      z.object({
        category: z.string(),
        items: z.array(z.object({ title: z.string() })).default([]),
      })
    )
    .default([]),
  timeline: z
    .object({
      estimatedDuration: z.string(),
      phaseBreakdown: z
        .array(z.object({ title: z.string(), description: z.string(), duration: z.string() }))
        .default([]),
    })
    .optional(),
});
