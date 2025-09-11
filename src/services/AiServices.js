// lib/aiServices.js
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey:
    process.env.GEMINI_API_KEY || "AIzaSyCO8rkIcXYIaRqWeLqUg-Omdn34bR1HUqs",
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

      if (candidate.finishReason === "MAX_TOKENS") {
        console.warn("Response truncated due to token limit");
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
       
      
      const cleanedText = response.replace(/```(?:json)?\n?/g, "").trim();
      const quiz = JSON.parse(cleanedText);
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

    const cleanedText = response.replace(/```(?:json)?\n?/g, "").trim();
    return JSON.parse(cleanedText);
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
}

export default new aiServices();
