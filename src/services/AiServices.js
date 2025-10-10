import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

class ModelPool {
  constructor(modelName) {
    this.modelName = modelName;
    this.modelInstance = null;
  }

  async getModel() {
    if (!this.modelInstance) {
      this.modelInstance = await ai.models.get(this.modelName);
    }
    return this.modelInstance;
  }
}

class AIService {
  constructor() {
    this.modelPools = {
      quiz: new ModelPool("gemini-2.5-flash"),
      email: new ModelPool("gemini-2.5-flash"),
      coverLetter: new ModelPool("gemini-2.5-flash"),
      insights: new ModelPool("gemini-2.5-flash"),
      resume: new ModelPool("gemini-2.5-flash"),
      roadmap: new ModelPool("gemini-2.5-flash"),
      general: new ModelPool("gemini-2.5-flash"),
    };

    this.requestCount = 0;
    this.lastResetTime = Date.now();
    this.MAX_REQUESTS_PER_MINUTE = 50;
    this.DEBUG_MODE = true;
    this.serviceRequests = {};
  }

  debugLog(msg, data) {
    if (this.DEBUG_MODE) console.log(`[AIService Debug] ${msg}:`, data);
  }

  checkRateLimit() {
    const now = Date.now();
    if (now - this.lastResetTime > 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
      this.debugLog("Rate limit reset", new Date().toISOString());
    }
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }
    this.requestCount++;
    return true;
  }

  estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  cleanJsonResponse(response) {
    let cleaned = response.replace(/```(?:json)?\n?/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}") + 1;
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd);
    }
    return cleaned;
  }

  safeJsonParse(jsonString, fallback = null) {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      if (fallback) return fallback;
      throw new Error(`Invalid JSON: ${e.message}`);
    }
  }

  async generateContent(prompt, options = {}, feature = "general", retries = 3) {
    const maxTokens = 8000; // Stable 8000 tokens per feature
    const config = { maxOutputTokens: maxTokens, temperature: 0.7, ...options };

    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (!this.checkRateLimit()) {
          await new Promise((r) => setTimeout(r, 2000));
          if (!this.checkRateLimit()) throw new Error("Rate limit exceeded");
        }

        const pool = this.modelPools[feature] || this.modelPools.general;
        const model = await pool.getModel();

        this.serviceRequests[feature] = (this.serviceRequests[feature] || 0) + 1;
        const startTime = Date.now();

        const response = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config,
        });

        const candidate = response?.candidates?.[0];
        if (!candidate) throw new Error("No candidate response");

        const text = candidate.content?.parts?.[0]?.text || candidate.text || response.text;
        if (!text || !text.trim()) throw new Error("Empty response");

        this.debugLog(`${feature} response time`, Date.now() - startTime);
        return text.trim();
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ [${feature}] Attempt ${attempt} failed: ${err.message}`);
        await new Promise((r) => setTimeout(r, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
      }
    }

    throw lastError;
  }

  // ===== EXAMPLE FEATURES =====
  async generateQuiz(industry, skills) {
    const skillText = skills?.length ? ` (${skills.slice(0, 3).join(", ")})` : "";
    const prompt = `Generate 10 MCQs for ${industry}${skillText}. JSON only:
{"questions":[{"question":"str","options":["a","b","c","d"],"correctAnswer":"str","explanation":"str"}]}`;

    try {
      const response = await this.generateContent(prompt, { temperature: 0.3 }, "quiz");
      return this.safeJsonParse(this.cleanJsonResponse(response), this.getQuizFallback()).questions;
    } catch (err) {
      console.error("Quiz generation error:", err.message);
      return this.getQuizFallback();
    }
  }

  async generateCoverLetter(data, user) {
    const skills = user.skills?.slice(0, 5).join(", ") || "various skills";
    const bioShort = user.bio?.slice(0, 200) || "experienced professional";
    const jdShort = data.jobDescription?.slice(0, 300) || "the position";

    const prompt = `Cover letter for ${data.jobTitle} at ${data.companyName}.
Candidate: ${user.industry}, ${user.experience}yr exp, ${skills}.
Bio: ${bioShort}
JD: ${jdShort}
Write professional 250-word cover letter in markdown.`;

    return this.generateContent(prompt, { temperature: 0.7 }, "coverLetter");
  }

  getQuizFallback() {
    return [
      {
        question: "What is a key principle in this field?",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
        explanation: "Fundamental concept",
      },
    ];
  }

  getServiceStats() {
    return {
      totalRequests: this.requestCount,
      requestsPerService: this.serviceRequests,
      rateLimitRemaining: this.MAX_REQUESTS_PER_MINUTE - this.requestCount,
      resetTime: new Date(this.lastResetTime + 60000).toISOString(),
    };
  }
}

export default new AIService();
