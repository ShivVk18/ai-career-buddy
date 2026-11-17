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
  // Job requirements checked against the resume. The server verifies the sources (D32).
  requirements: z
    .array(z.object({ requirement: z.string().min(1), status: z.string().default(""), sources: z.array(atsSource).default([]) }))
    .default([]),
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

// Cold emails: paragraphs plus a short subject line with the catalog ids it is based on.
export const emailParagraphsSchema = paragraphsSchema.extend({
  subject: z.object({ text: z.string().min(1), sourceIds: z.array(z.string()).default([]) }).optional(),
});

// Cover letter "shorter": the model rewrites body paragraphs by index; the server keeps the sources.
export const shortenSchema = z.object({
  paragraphs: z.array(z.object({ index: z.number().int().min(0), text: z.string().min(1) })).min(1),
});

// Tailoring: the model picks an existing resume bullet and proposes a rewrite. The server supplies the
// original text and checks entryId, bulletIndex, jd ids and numbers (D36).
export const tailorSchema = z.object({
  proposals: z
    .array(
      z.object({
        entryId: z.string(),
        bulletIndex: z.number().int().min(0),
        proposed: z.string().min(1),
        reason: z.string().default(""),
        sourceIds: z.array(z.string()).default([]),
      })
    )
    .default([]),
});

// ATS 1-click fix: one rewritten line plus the job description ids it responds to (D38).
export const atsFixSchema = z.object({
  proposed: z.string().min(1),
  sourceIds: z.array(z.string()).default([]),
});

// Open interview questions (D45/D46): each cites job-description lines or profile skills; the server checks the ids.
export const openQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        topic: z.string().min(1),
        timeLimitSec: z.number().optional(),
        sourceIds: z.array(z.string()).default([]),
      })
    )
    .min(1),
});

// Open answer rubric (D46). The model's `overall` is ignored: the server recomputes it from the weights.
export const rubricSchema = z.object({
  criteria: z
    .array(
      z.object({
        name: z.enum(["clarity", "depth", "evidence"]),
        score: z.number().min(0).max(10),
        quote: z.string().nullish(),
        feedback: z.string().default(""),
      })
    )
    .length(3),
  summary: z.string().default(""),
  overall: z.number().optional(),
});
