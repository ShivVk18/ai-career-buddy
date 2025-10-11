import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

class aiServices {
  constructor() {
    this.ai = ai;
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    this.MAX_REQUESTS_PER_MINUTE = 30;
    this.DEBUG_MODE = true;
  }

  debugLog(message, data) {
    if (this.DEBUG_MODE) {
      console.log(`[AiServices Debug] ${message}:`, data);
    }
  }

  checkRateLimit() {
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) return false;
    this.requestCount++;
    return true;
  }

  // Helper function to clean and validate JSON response
  cleanJsonResponse(response) {
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

  // Helper function to safely parse JSON with fallback
  safeJsonParse(jsonString, fallbackData = null) {
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

  async generateContent(prompt, options = {}) {
    try {
      if (!this.checkRateLimit()) {
        throw new Error(
          "Rate limit exceeded. Please wait a moment before trying again."
        );
      }

      const defaultOptions = {
        model: "gemini-2.5-flash",
        maxOutputTokens: 1000,
        temperature: 0.7,
      };

      const config = { ...defaultOptions, ...options };

      const response = await this.ai.models.generateContent({
        model: config.model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: config.maxOutputTokens,
          temperature: config.temperature,
        },
      });

      const candidate = response?.candidates?.[0];
      if (!candidate) {
        throw new Error("No response generated");
      }

      // Handle truncated responses more gracefully
      if (candidate.finishReason === "MAX_TOKENS") {
        console.warn(
          "Response truncated due to token limit - using partial response"
        );
        // Don't throw error for MAX_TOKENS, try to parse what we have
      }

      const text = candidate.content?.parts?.[0]?.text || response.text;
      if (!text) {
        throw new Error("Empty response generated");
      }

      return text.trim();
    } catch (err) {
      console.error("AI Generation Error:", err);
      throw new Error(`AI service error: ${err.message}`);
    }
  }

  async generateQuiz(industry, skills) {
    const prompt = `
You are an AI that outputs ONLY valid JSON.

Generate exactly 10 multiple-choice interview questions for a ${industry} professional${
      skills?.length ? ` with expertise in ${skills.join(", ")}` : ""
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
      const response = await this.generateContent(prompt, {
        maxOutputTokens: 3500,
        temperature: 0.3,
      });

      const cleanedText = this.cleanJsonResponse(response);
      const quiz = this.safeJsonParse(cleanedText);
      return quiz.questions;
    } catch (error) {
      console.error("Error generating quiz:", error);
      throw new Error("Failed to generate quiz questions");
    }
  }

  // Improvement tip generation
  async generateImprovementTip(industry, wrongAnswers) {
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

    try {
      return await this.generateContent(prompt, {
        maxOutputTokens: 2500,
        temperature: 0.6,
      });
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      return null;
    }
  }

  // Cover letter generation
  async generateCoverLetter(data, user) {
    const prompt = `
      Write a professional cover letter for a ${data.jobTitle} position at ${
      data.companyName
    }.
      
      About the candidate:
      - Industry: ${user.industry}
      - Years of Experience: ${user.experience}
      - Skills: ${user.skills?.join(", ")}
      - Professional Background: ${user.bio}
      
      Job Description:
      ${data.jobDescription}
      
      Requirements:
      1. Use a professional, enthusiastic tone
      2. Highlight relevant skills and experience
      3. Show understanding of the company's needs
      4. Keep it concise (max 400 words)
      5. Use proper business letter formatting in markdown
      6. Include specific examples of achievements
      7. Relate candidate's background to job requirements
      
      Format the letter in markdown.
    `;

    return await this.generateContent(prompt, {
      maxOutputTokens: 1500,
      temperature: 0.7,
    });
  }

  // Industry insights generation
  async generateIndustryInsights(industry) {
    const prompt = `
You are an AI that outputs ONLY valid JSON.
Do not add explanations, notes, or markdown.

Generate insights for the ${industry} industry in the following strict JSON format:

{
  "salaryRanges": [
    { "role": "string", "min": number, "max": number, "median": number, "location": "string" },
    { "role": "string", "min": number, "max": number, "median": number, "location": "string" },
    { "role": "string", "min": number, "max": number, "median": number, "location": "string" },
    { "role": "string", "min": number, "max": number, "median": number, "location": "string" },
    { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
  ],
  "growthRate": number, 
  "demandLevel": "High" | "Medium" | "Low",
  "topSkills": ["string", "string", "string", "string", "string"],
  "marketOutlook": "Positive" | "Neutral" | "Negative",
  "keyTrends": ["string", "string", "string", "string", "string"],
  "recommendedSkills": ["string", "string", "string", "string", "string"]
}

Rules:
1. Output MUST be valid JSON.
2. Do not include extra fields.
3. Do not include comments, markdown, or text outside JSON.
`;

    try {
      const response = await this.generateContent(prompt, {
        maxOutputTokens: 2000,
        temperature: 0.3,
      });

      const cleanedText = this.cleanJsonResponse(response);
      return this.safeJsonParse(cleanedText);
    } catch (error) {
      console.error("Error generating industry insights:", error);
      throw new Error("Failed to generate industry insights");
    }
  }

  // Resume improvement
  async improveResumeContent(current, type, industry) {
    const prompt = `
      As an expert resume writer, improve the following ${type} description for a ${industry} professional.
      Make it more impactful, quantifiable, and aligned with industry standards.
      Current content: "${current}"

      Requirements:
      1. Use action verbs
      2. Include metrics and results where possible
      3. Highlight relevant technical skills
      4. Keep it concise but detailed
      5. Focus on achievements over responsibilities
      6. Use industry-specific keywords

      Format the response as a single paragraph without any additional text or explanations.
    `;

    return await this.generateContent(prompt, {
      maxOutputTokens: 300,
      temperature: 0.6,
    });
  }

  // Optimized career roadmap generation - much smaller and focused
  async generateCareerRoadmap(data, user) {
    // Super minimal prompt to avoid token limits
    const prompt = `Generate career roadmap JSON for ${data.currentRole} to ${
      data.targetRole
    } in ${data.industry}.

Skills: ${user.skills?.join(", ") || "Basic"}
Experience: ${user.experience} years

Return exact JSON:
{
  "steps": [
    {"id": 1, "title": "Assess Skills", "description": "Evaluate current abilities", "duration": "2 weeks", "priority": "High", "category": "skill", "estimatedHours": 20, "dependencies": [], "resources": ["Online assessments", "Skill frameworks"]},
    {"id": 2, "title": "Learn Core Tech", "description": "Master essential technologies", "duration": "2 months", "priority": "High", "category": "skill", "estimatedHours": 80, "dependencies": [1], "resources": ["Courses", "Tutorials"]},
    {"id": 3, "title": "Build Portfolio", "description": "Create demonstration projects", "duration": "1 month", "priority": "Medium", "category": "experience", "estimatedHours": 60, "dependencies": [2], "resources": ["GitHub", "Project ideas"]},
    {"id": 4, "title": "Get Certified", "description": "Obtain industry certifications", "duration": "3 weeks", "priority": "Medium", "category": "certification", "estimatedHours": 40, "dependencies": [2], "resources": ["Certification sites", "Practice exams"]}
  ],
  "milestones": [
    {"id": 1, "title": "Skills Mapped", "description": "Gap analysis complete", "targetMonth": 1, "criteria": ["Assessment done", "Plan created"], "reward": "Clear direction"},
    {"id": 2, "title": "Portfolio Ready", "description": "Projects showcase skills", "targetMonth": 4, "criteria": ["3+ projects", "Documentation complete"], "reward": "Interview readiness"}
  ],
  "resources": [
    {"title": "Online Courses", "type": "course", "url": "https://coursera.org", "description": "Skill development", "estimatedCost": "$49/month", "timeCommitment": "5h/week"},
    {"title": "Practice Platform", "type": "project", "url": "https://github.com", "description": "Build portfolio", "estimatedCost": "Free", "timeCommitment": "10h/week"}
  ],
  "timeline": 6
}

Customize for specific role transition. Keep JSON compact.`;

    try {
      const response = await this.generateContent(prompt, {
        maxOutputTokens: 2500, // Reduced from 4000
        temperature: 0.2, // Lower temperature for more consistent output
      });

      this.debugLog("Raw AI Response", response.substring(0, 200) + "...");

      let cleanedText = this.cleanJsonResponse(response);

      // Additional cleaning for partial responses
      if (cleanedText.includes('"timeline"')) {
        // Find the last complete field
        const timelineIndex = cleanedText.lastIndexOf('"timeline"');
        if (timelineIndex !== -1) {
          const afterTimeline = cleanedText.substring(timelineIndex);
          const nextComma = afterTimeline.indexOf(",");
          const nextBrace = afterTimeline.indexOf("}");

          if (nextBrace !== -1 && (nextComma === -1 || nextBrace < nextComma)) {
            // Timeline is the last field, this is likely complete
            cleanedText = cleanedText.substring(
              0,
              timelineIndex + afterTimeline.substring(0, nextBrace + 1).length
            );
          }
        }
      }

      // Create comprehensive fallback data
      const fallbackData = {
        steps: [
          {
            id: 1,
            title: "Skills Assessment & Gap Analysis",
            description:
              "Evaluate current skills against target role requirements",
            duration: "2 weeks",
            priority: "High",
            category: "skill",
            estimatedHours: 15,
            dependencies: [],
            resources: [
              "Industry skill frameworks",
              "Online assessment tools",
              "Job posting analysis",
            ],
          },
          {
            id: 2,
            title: "Core Skill Development",
            description: "Focus on the top 3 most important missing skills",
            duration: "2-3 months",
            priority: "High",
            category: "education",
            estimatedHours: 100,
            dependencies: [1],
            resources: [
              "Online courses",
              "Technical documentation",
              "Practice projects",
            ],
          },
          {
            id: 3,
            title: "Hands-on Project Experience",
            description: "Build practical projects showcasing new skills",
            duration: "1-2 months",
            priority: "Medium",
            category: "experience",
            estimatedHours: 80,
            dependencies: [2],
            resources: [
              "Personal projects",
              "Open source contributions",
              "Portfolio development",
            ],
          },
          {
            id: 4,
            title: "Industry Networking",
            description: "Connect with professionals in target role",
            duration: "Ongoing",
            priority: "Medium",
            category: "networking",
            estimatedHours: 20,
            dependencies: [],
            resources: [
              "LinkedIn networking",
              "Industry meetups",
              "Professional associations",
            ],
          },
        ],
        milestones: [
          {
            id: 1,
            title: "Skills Gap Identified",
            description: "Clear understanding of what skills need development",
            targetMonth: 1,
            criteria: [
              "Skills assessment completed",
              "Learning plan created",
              "Resources identified",
            ],
            reward: "Focused learning direction",
          },
          {
            id: 2,
            title: "Portfolio Established",
            description:
              "Demonstrable projects showing target role competencies",
            targetMonth: 4,
            criteria: [
              "2-3 projects completed",
              "Portfolio website live",
              "Case studies written",
            ],
            reward: "Interview-ready portfolio",
          },
          {
            id: 3,
            title: "Network Established",
            description: "Meaningful connections in target industry",
            targetMonth: 6,
            criteria: [
              "10+ relevant connections",
              "Informational interviews conducted",
              "Industry knowledge current",
            ],
            reward: "Insider job opportunities",
          },
        ],
        resources: [
          {
            title: "Online Learning Platform",
            type: "course",
            url: "https://coursera.org",
            description: "Comprehensive courses for skill development",
            estimatedCost: "$49/month",
            timeCommitment: "5-10 hours/week",
          },
          {
            title: "GitHub Portfolio",
            type: "project",
            url: "https://github.com",
            description: "Showcase projects and code samples",
            estimatedCost: "Free",
            timeCommitment: "2-5 hours/week",
          },
          {
            title: "LinkedIn Learning",
            type: "course",
            url: "https://linkedin.com/learning",
            description: "Professional development courses",
            estimatedCost: "$29.99/month",
            timeCommitment: "3-5 hours/week",
          },
          {
            title: "Industry Certifications",
            type: "certification",
            url: "https://example.com",
            description: "Relevant professional certifications",
            estimatedCost: "$100-500",
            timeCommitment: "20-40 hours prep",
          },
        ],
        timeline: 6,
      };

      this.debugLog("Cleaned JSON", cleanedText.substring(0, 200) + "...");

      const result = this.safeJsonParse(cleanedText, fallbackData);

      // Validate the structure
      if (
        !result.steps ||
        !Array.isArray(result.steps) ||
        result.steps.length === 0
      ) {
        console.warn("Invalid or missing steps, using fallback");
        result.steps = fallbackData.steps;
      }

      if (
        !result.milestones ||
        !Array.isArray(result.milestones) ||
        result.milestones.length === 0
      ) {
        console.warn("Invalid or missing milestones, using fallback");
        result.milestones = fallbackData.milestones;
      }

      if (
        !result.resources ||
        !Array.isArray(result.resources) ||
        result.resources.length === 0
      ) {
        console.warn("Invalid or missing resources, using fallback");
        result.resources = fallbackData.resources;
      }

      return result;
    } catch (error) {
      console.error("Error generating career roadmap:", error);

      // Return comprehensive fallback roadmap
      return {
        steps: [
          {
            id: 1,
            title: "Skills Assessment",
            description:
              "Evaluate current skills against target role requirements",
            duration: "2 weeks",
            priority: "High",
            category: "skill",
            estimatedHours: 20,
            dependencies: [],
            resources: [
              "Skills assessment tools",
              "Job requirement analysis",
              "Industry research",
            ],
          },
          {
            id: 2,
            title: "Targeted Skill Development",
            description: "Focus on developing the most critical missing skills",
            duration: "2-3 months",
            priority: "High",
            category: "education",
            estimatedHours: 120,
            dependencies: [1],
            resources: ["Online courses", "Books", "Practice exercises"],
          },
          {
            id: 3,
            title: "Portfolio Development",
            description: "Create projects that demonstrate new capabilities",
            duration: "1-2 months",
            priority: "Medium",
            category: "experience",
            estimatedHours: 80,
            dependencies: [2],
            resources: ["Project templates", "Portfolio guides", "GitHub"],
          },
          {
            id: 4,
            title: "Professional Networking",
            description: "Build connections in target industry/role",
            duration: "Ongoing",
            priority: "Medium",
            category: "networking",
            estimatedHours: 30,
            dependencies: [],
            resources: [
              "LinkedIn",
              "Professional associations",
              "Industry events",
            ],
          },
        ],
        milestones: [
          {
            id: 1,
            title: "Learning Plan Complete",
            description: "Skills gap identified and learning plan established",
            targetMonth: 1,
            criteria: [
              "Skills assessment done",
              "Gap analysis complete",
              "Learning resources identified",
            ],
            reward: "Clear development roadmap",
          },
          {
            id: 2,
            title: "Portfolio Ready",
            description: "Demonstrable projects showcasing target role skills",
            targetMonth: 4,
            criteria: [
              "3+ projects completed",
              "Portfolio website live",
              "Work samples documented",
            ],
            reward: "Interview-ready demonstration of abilities",
          },
        ],
        resources: [
          {
            title: "Online Learning Platform",
            type: "course",
            url: "https://coursera.org",
            description: "Professional development courses",
            estimatedCost: "$49/month",
            timeCommitment: "5-10 hours/week",
          },
          {
            title: "GitHub",
            type: "project",
            url: "https://github.com",
            description: "Code repository and portfolio hosting",
            estimatedCost: "Free",
            timeCommitment: "2-3 hours/week",
          },
          {
            title: "Professional Network",
            type: "network",
            url: "https://linkedin.com",
            description: "Industry connections and job opportunities",
            estimatedCost: "Free (Premium $29.99/month)",
            timeCommitment: "1-2 hours/week",
          },
        ],
        timeline: 6,
      };
    }
  }

  // Update career roadmap progress
  async generateProgressUpdate(roadmap, completedSteps, userFeedback) {
    const prompt = `
Analyze the career roadmap progress and provide personalized recommendations.

Current roadmap progress:
- Total steps: ${roadmap.steps.length}
- Completed steps: ${completedSteps.length}
- Current step: ${roadmap.currentStep}
- Overall progress: ${roadmap.progress}%

User feedback on completed steps:
${userFeedback || "No feedback provided"}

Provide specific, actionable advice for the next 2-3 steps and any adjustments needed.
Keep the response encouraging and practical.
Maximum 200 words.
`;

    try {
      return await this.generateContent(prompt, {
        maxOutputTokens: 1500,
        temperature: 0.6,
      });
    } catch (error) {
      console.error("Error generating progress update:", error);
      return "Continue following your roadmap. Focus on the next step and track your progress regularly.";
    }
  }

  // Generate skill recommendations based on roadmap
  async generateSkillRecommendations(
    currentRole,
    targetRole,
    industry,
    currentSkills
  ) {
    const prompt = `
As a career advisor, analyze the skill gap between "${currentRole}" and "${targetRole}" in ${industry}.

Current skills: ${currentSkills?.join(", ") || "Not specified"}

Provide a prioritized list of 5-7 skills to develop, with:
1. Why each skill is important
2. How to learn it (specific resources)
3. Time investment needed
4. Priority level (1-5)

Format as plain text, not JSON. Be concise but specific.
`;

    try {
      return await this.generateContent(prompt, {
        maxOutputTokens: 1500,
        temperature: 0.5,
      });
    } catch (error) {
      console.error("Error generating skill recommendations:", error);
      return "Focus on developing technical skills, leadership abilities, and industry-specific knowledge relevant to your target role.";
    }
  }

  async resumeParser(companyName, jobTitle, jobDescription, resumePdf) {
    const contents = [
      {
        text: `You are an expert in ATS (Applicant Tracking Systems), resume writing, and job market analysis.  
Your task is to evaluate the resume thoroughly and provide constructive feedback.  

### Instructions:
1. Rate the resume’s **ATS compatibility** (0–100).  
2. Highlight **strengths** (what’s good in the resume).  
3. Point out **weaknesses** (grammar issues, formatting, vague points, etc.).  
4. Suggest **improvements** (action verbs, quantifiable achievements, tailoring tips).  
5. If a job description is provided, evaluate how well the resume matches it.  
6. Give **tailored suggestions** for increasing relevance and impact.  
7. Feedback should be **clear, detailed, and professional**, not generic.  

### Context:
- Company Name: ${companyName}
- Job Title: ${jobTitle}  
- Job Description: ${jobDescription}  

### Response Format:
Respond ONLY in **valid JSON** with the following schema (no markdown, no extra text).`,
      },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: Buffer.from(fs.readFileSync(resumePdf)).toString("base64"),
        },
      },
    ];

    try {
      return await this.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          maxOutputTokens: 4000,
          temperature: 0.2,
        },
      });
    } catch (error) {
      console.error("Error generating resume ats score:", error);
      return "Focus on developing technical skills, leadership abilities, and industry-specific knowledge relevant to your target role.";
    }
  }

  async generateColdEmail(data, user) {
   const safeJoin = (arr) => (arr && arr.length ? arr.join(", ") : "N/A");

const prompt = `
Write a professional and compelling cold email for a ${
  data.jobTitle || "position"
} position at ${data.companyName || "the company"}.

About the candidate:
- Industry: ${user.industry || "N/A"}
- Years of Experience: ${user.experience || "N/A"}
- Skills: ${safeJoin(user.skills)}
- Professional Background: ${user.bio || "N/A"}

Job Description:
${data.jobDescription || "N/A"}

Requirements for the email:
1. Keep it concise (max 100-150 words)
2. Use a confident, professional, and approachable tone
3. Grab attention in the first line
4. Highlight key achievements and relevant skills
5. Show understanding of the company's needs
6. Include a call-to-action (e.g., request a meeting, interview, or call)
7. Avoid generic phrases; personalize based on the job description
8. Format in a professional email structure (greeting, body, closing, signature)

Output ONLY the email text (no extra commentary, JSON not required).
`;

    return await this.generateContent(prompt, {
      temperature: 0.7,
    });
  }
}

export default new aiServices();