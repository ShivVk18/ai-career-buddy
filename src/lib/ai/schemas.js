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

// The model proposes sources; the server verifies them (quotes against the PDF text, jd ids against the catalog).
const atsSource = z.object({
  type: z.string(),
  quote: z.string().optional(),
  id: z.string().optional(),
});
const atsItem = z.object({ text: z.string().min(1), sources: z.array(atsSource).default([]) });

export const atsSchema = z.object({
  candidateLevel: z.string().optional(),
  atsScore: z.number().min(0).max(100),
  matchPercentage: z.number().min(0).max(100).nullable().optional(),
  strengths: z.array(atsItem).default([]),
  weaknesses: z.array(atsItem).default([]),
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
        sources: z.array(atsSource).default([]),
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
        sourceIds: z.array(z.string()).default([]),
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

// Cover letters and cold emails: paragraphs with the catalog ids each body paragraph is based on.
export const paragraphsSchema = z.object({
  paragraphs: z
    .array(
      z.object({
        kind: z.enum(["greeting", "body", "closing"]),
        text: z.string().min(1),
        sourceIds: z.array(z.string()).default([]),
      })
    )
    .min(2),
});
