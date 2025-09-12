import { GoogleGenAI } from "@google/genai";
import { inngest } from "./Client";
import { db } from "../prisma";

// Initialize the Google AI client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyCO8rkIcXYIaRqWeLqUg-Omdn34bR1HUqs"
});

export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights" },
  { cron: "0 0 * * 0" },
  async ({ event, step }) => {
    const industries = await step.run("Fetch industries", async () => {
      return await db.industryInsight.findMany({
        select: { industry: true },
      });
    });

    for (const { industry } of industries) {
      const prompt = `
        Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
        {
          "salaryRanges": [
            { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
          ],
          "growthRate": number,
          "demandLevel": "High" | "Medium" | "Low",
          "topSkills": ["skill1", "skill2"],
          "marketOutlook": "Positive" | "Neutral" | "Negative",
          "keyTrends": ["trend1", "trend2"],
          "recommendedSkills": ["skill1", "skill2"]
        }
        
        IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
        Include at least 5 common roles for salary ranges.
        Growth rate should be a percentage.
        Include at least 5 skills and trends.
      `;

      const result = await step.run(`Generate ${industry} insights`, async () => {
        try {
          const response = await genAI.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 2000,
              temperature: 0.3,
            }
          });

          if (!response?.candidates?.[0]) {
            throw new Error("No response generated from AI");
          }

          const text = response.candidates[0].content?.parts?.[0]?.text;
          if (!text) {
            throw new Error("Empty response from AI");
          }
          
          
          const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
          
          // Parse the JSON response
          const insights = JSON.parse(cleanedText);
          
          return insights;
        } catch (error) {
          console.error(`Error generating insights for ${industry}:`, error);
          throw error;
        }
      });

      await step.run(`Update ${industry} insights`, async () => {
        try {
          await db.industryInsight.update({
            where: { industry },
            data: {
              ...result,
              lastUpdated: new Date(),
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        } catch (error) {
          console.error(`Error updating ${industry} insights in database:`, error);
          throw error;
        }
      });
    }
  }
);