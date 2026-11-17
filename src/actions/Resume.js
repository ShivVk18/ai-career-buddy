"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { runAIText } from "@/lib/ai";
import { safeErr } from "@/lib/utils";
import { z } from "zod";
import { assignEntryIds, buildSources, snapshot } from "@/lib/ai/sources";

// Helper function to validate and sanitize resume data
async function validateResumeData(data) {
  let templateId = null;
  
  // If templateId is provided, check if it's a templateKey or actual ID
  if (data.templateId) {
    // Try to find template by templateKey first (for frontend compatibility)
    const template = await db.resumeTemplate.findFirst({
      where: {
        OR: [
          { id: data.templateId },
          { templateKey: data.templateId }
        ]
      }
    });
    
    if (template) {
      templateId = template.id;
    } else {
      console.warn(`Template not found: ${data.templateId}`);
      templateId = null;
    }
  }
  
  return {
    content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content || ''),
    templateId: templateId,
    photoUrl: data.photoUrl || null,
    contactInfo: data.contactInfo || null,
    summary: data.summary || null,
    skills: data.skills || null,
    // Stable entry ids are assigned only here, on save. Existing ids are kept.
    experience: assignEntryIds(data.experience),
    education: assignEntryIds(data.education),
    projects: assignEntryIds(data.projects),
  };
}

export async function saveResume(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Validate and sanitize data (this now handles template lookup)
    const sanitizedData = await validateResumeData(data);

    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: sanitizedData,
      create: {
        userId: user.id,
        ...sanitizedData,
      },
    });

   
    if (sanitizedData.templateId) {
      await db.resumeTemplate.update({
        where: { id: sanitizedData.templateId },
        data: {
          usageCount: { increment: 1 },
        },
      }).catch((error) => {
        console.warn("Template usage count update failed:", error);
        // Don't throw - this is non-critical
      });
    }

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("saveResume failed:", safeErr(error));
    const known = ["Unauthorized", "User not found"];
    throw new Error(known.includes(error?.message) ? error.message : "Failed to save resume");
  }
}

export async function getResume() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return null;

    const resume = await db.resume.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        template: true,
      },
    });

    
    if (resume && resume.template) {
      return {
        ...resume,
        templateId: resume.template.templateKey, 
      };
    }

    return resume;
  } catch (error) {
    console.error("getResume failed:", safeErr(error));
    return null;
  }
}

export async function getResumeTemplates() {
  try {
    const templates = await db.resumeTemplate.findMany({
      where: { isActive: true },
      orderBy: [
        { usageCount: "desc" },
        { createdAt: "desc" },
      ],
    });

    return templates;
  } catch (error) {
    console.error("getResumeTemplates failed:", safeErr(error));
    return [];
  }
}

const improveSchema = z.object({
  current: z.string().trim().min(1).max(5000),
  type: z.string().trim().min(1).max(40),
});

/**
 * Returns { text, sources } where sources is a snapshot of what the improvement is based on:
 * the user's own input text plus the profile industry used in the prompt.
 * Expected failures are RETURNED as { error, code } (INVALID | NOT_FOUND | AI_LIMIT | FAILED).
 */
export async function improveWithAI(input) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const parsed = improveSchema.safeParse(input ?? {});
  if (!parsed.success) return { error: "Please enter some text to improve first.", code: "INVALID" };
  const { current, type } = parsed.data;

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, industry: true },
    });

    if (!user) return { error: "We couldn't find your profile. Please finish onboarding first.", code: "NOT_FOUND" };

    const industryContext = user.industry 
      ? `for a ${user.industry} industry professional` 
      : "for a professional";

    let prompt = "";

    if (type === "skills") {
      prompt = `As an expert resume writer, improve the following skills list ${industryContext}.
Make it more professional, organized, and aligned with industry standards.

Current skills: "${current}"

Requirements:
1. Group related skills logically (e.g., Languages, Frameworks, Soft Skills) if there are many.
2. Use industry-standard terminology.
3. Keep it concise but comprehensive.
4. Return only the improved skills content separated by commas or newlines, without any explanations or introductory text.`;
    } else if (type === "summary") {
      prompt = `As an expert resume writer, improve the following professional summary ${industryContext}.
Make it more impactful, compelling, and aligned with industry standards.

Current summary: "${current}"

Requirements:
1. Make it a strong elevator pitch (3-4 sentences max).
2. Highlight key achievements, expertise, and career goals.
3. Use powerful adjectives and a professional tone.
4. Avoid first-person pronouns (I, me, my) if possible, or use them sparingly.
5. Return only the improved summary text without any explanations or introductory text.`;
    } else {
      prompt = `As an expert resume writer, improve the following ${type} description ${industryContext}.
Make it more impactful, quantifiable, and aligned with industry standards.

Current content: "${current}"

Requirements:
1. Use strong action verbs (led, achieved, developed, implemented).
2. Keep any metrics already in the content; never invent numbers, employers or achievements.
3. Highlight relevant technical and soft skills.
4. Keep it concise (2-4 bullet points or 100-150 words).
5. Focus on achievements and impact, not just responsibilities.
6. Use industry-specific keywords.
7. Return only the improved content without any explanations or introductory text.`;
    }

    const improvedText = await runAIText("write", () => [["user", prompt]], {
      userId,
      temperature: 0.7,
      maxOutputTokens: 300,
    });

    const text = improvedText.replace(/^\d+:/gm, "").trim();
    const catalog = buildSources({
      profile: { industry: user.industry },
      extra: [{ id: "input:current", kind: "input", label: "Your text", text: current }],
    });
    return { text, sources: snapshot(["input:current", "profile:industry"], catalog) };
  } catch (error) {
    console.error("improveWithAI failed:", safeErr(error));
    if (error?.code === "AI_LIMIT") return { error: "Daily AI limit reached. Please try again tomorrow.", code: "AI_LIMIT" };
    return { error: "Failed to improve content. Please try again.", code: "FAILED" };
  }
}

export async function deleteResume() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    await db.resume.delete({
      where: {
        userId: user.id,
      },
    });

    revalidatePath("/resume");
    return { success: true };
  } catch (error) {
    console.error("deleteResume failed:", safeErr(error));
    throw new Error("Failed to delete resume");
  }
}

export async function duplicateResume() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const existingResume = await db.resume.findUnique({
      where: { userId: user.id },
    });

    if (!existingResume) throw new Error("No resume to duplicate");

    // Create a version instead of duplicating
    const version = await db.resumeVersion.create({
      data: {
        resumeId: existingResume.id,
        jobTitle: "Copy",
        companyName: "Duplicate",
        tailoredContent: existingResume.content,
      },
    });

    revalidatePath("/resume");
    return version;
  } catch (error) {
    console.error("duplicateResume failed:", safeErr(error));
    throw new Error("Failed to duplicate resume");
  }
}

// Seed initial templates (run once)
export async function seedResumeTemplates() {
  try {
    const templates = [
      {
        templateKey: "modern-pro",
        name: "Modern Professional",
        category: "professional",
        difficulty: "intermediate",
        style: "modern",
        requiresPhoto: true,
        colorScheme: "blue",
        description: "Clean and contemporary design with subtle accents",
        htmlContent: "",
        cssStyles: "",
        thumbnail: "/templates/modern-pro.png",
        colorSchemes: [
          { primary: "#3B82F6", secondary: "#60A5FA", accent: "#1E40AF" },
        ],
        fontOptions: ["Inter", "Roboto", "Open Sans"],
        layoutVariations: [{ name: "default", columns: 3 }],
      },
      {
        templateKey: "minimal-classic",
        name: "Minimal Classic",
        category: "professional",
        difficulty: "beginner",
        style: "classic",
        requiresPhoto: false,
        colorScheme: "gray",
        description: "Traditional layout focused on content",
        htmlContent: "",
        cssStyles: "",
        thumbnail: "/templates/minimal-classic.png",
        colorSchemes: [
          { primary: "#1F2937", secondary: "#4B5563", accent: "#111827" },
        ],
        fontOptions: ["Georgia", "Times New Roman", "Merriweather"],
        layoutVariations: [{ name: "default", columns: 1 }],
      },
      {
        templateKey: "creative-bold",
        name: "Creative Bold",
        category: "creative",
        difficulty: "intermediate",
        style: "modern",
        requiresPhoto: true,
        colorScheme: "purple",
        description: "Eye-catching design with vibrant colors",
        htmlContent: "",
        cssStyles: "",
        thumbnail: "/templates/creative-bold.png",
        colorSchemes: [
          { primary: "#9333EA", secondary: "#EC4899", accent: "#7C3AED" },
        ],
        fontOptions: ["Montserrat", "Poppins", "Raleway"],
        layoutVariations: [{ name: "default", columns: 2 }],
      },
      {
        templateKey: "executive-elite",
        name: "Executive Elite",
        category: "executive",
        difficulty: "advanced",
        style: "luxury",
        requiresPhoto: true,
        colorScheme: "emerald",
        description: "Sophisticated layout for senior roles",
        htmlContent: "",
        cssStyles: "",
        thumbnail: "/templates/executive-elite.png",
        colorSchemes: [
          { primary: "#059669", secondary: "#10B981", accent: "#047857" },
        ],
        fontOptions: ["Playfair Display", "Lora", "Crimson Text"],
        layoutVariations: [{ name: "default", columns: 4 }],
      },
      {
        templateKey: "tech-modern",
        name: "Tech Modern",
        category: "technical",
        difficulty: "intermediate",
        style: "tech",
        requiresPhoto: false,
        colorScheme: "cyan",
        description: "Developer-friendly with code-style aesthetics",
        htmlContent: "",
        cssStyles: "",
        thumbnail: "/templates/tech-modern.png",
        colorSchemes: [
          { primary: "#06B6D4", secondary: "#22D3EE", accent: "#0891B2" },
        ],
        fontOptions: ["Fira Code", "JetBrains Mono", "Source Code Pro"],
        layoutVariations: [{ name: "default", columns: 1 }],
      },
      {
        templateKey: "academic-formal",
        name: "Academic Formal",
        category: "academic",
        difficulty: "beginner",
        style: "formal",
        requiresPhoto: false,
        colorScheme: "amber",
        description: "Traditional academic CV format",
        htmlContent: "",
        cssStyles: "",
        thumbnail: "/templates/academic-formal.png",
        colorSchemes: [
          { primary: "#D97706", secondary: "#F59E0B", accent: "#B45309" },
        ],
        fontOptions: ["Garamond", "Baskerville", "Palatino"],
        layoutVariations: [{ name: "default", columns: 1 }],
      },
    ];

    for (const template of templates) {
      await db.resumeTemplate.upsert({
        where: { templateKey: template.templateKey },
        update: template,
        create: template,
      });
    }

    return { success: true, message: "Templates seeded successfully" };
  } catch (error) {
    console.error("seedResumeTemplates failed:", safeErr(error));
    throw new Error("Failed to seed templates");
  }
}