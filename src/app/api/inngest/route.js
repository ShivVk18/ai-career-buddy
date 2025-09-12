import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/Client";
import { generateIndustryInsights } from "@/lib/inngest/Function";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateIndustryInsights],
});
