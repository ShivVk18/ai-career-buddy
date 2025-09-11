import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "ascend-ai", 
  name: "Career buddy",
  credentials: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
  },
});
