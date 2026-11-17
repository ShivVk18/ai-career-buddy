import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { MOCK_JOBS, MOCK_INTERVIEW_QUESTIONS, MOCK_ATS_REQUIREMENTS, MOCK_WEEKLY_ROADMAP } from "@/lib/mock";

export const runtime = "nodejs";

const bodySchema = z.object({
  message: z.string().max(4000).optional(),
}).passthrough();

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let raw;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request: 'message' must be a string up to 4000 characters" },
        { status: 400 }
      );
    }
    const prompt = (parsed.data.message || "").toLowerCase();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        // Step 1: Detective reading
        sendEvent({
          type: "step",
          step: "detective",
          text: "reading the context & your career notes…",
        });
        await sleep(350);

        // Step 2: Thinking matching
        sendEvent({
          type: "step",
          step: "thinking",
          text: "cross-referencing with your verified profile experience…",
        });
        await sleep(400);

        // Step 3: Tool trigger based on user intent
        if (prompt.includes("resume") || prompt.includes("tailor")) {
          sendEvent({
            type: "step",
            step: "wizard",
            text: "tailoring quantifiable bullet points with source footnotes…",
          });
          await sleep(400);

          sendEvent({
            type: "text",
            content: "i pulled up your recent experience at kredx and tailored 3 impact bullets for razorpay's frontend ii requirements. weak lines struck, quantifiable achievements cited with telemetry footnotes:",
          });

          sendEvent({
            type: "tool_call",
            name: "resume_editor",
            status: "completed",
          });

          sendEvent({
            type: "tool_result",
            tool: "resume_edit",
            data: {
              company: "Razorpay",
              role: "Frontend Engineer II",
              matchRate: 92,
              bullets: [
                {
                  id: 1,
                  original: "Worked on merchant dashboard and payment settlement pages using React and Redux.",
                  improved: "Architected real-time merchant invoice dashboard in Next.js 15, reducing LCP from 3.2s to 1.1s and boosting daily invoice uploads by 28%.",
                  source: "merchant dashboard release telemetry (Q3 2024)",
                  matchedSkill: "Next.js 15 & Performance",
                  accepted: true,
                },
                {
                  id: 2,
                  original: "Helped team integrate third-party payment gateways and fixed checkout bugs.",
                  improved: "Engineered headless payment checkout SDK with resilient fallback retries, processing ₹14Cr+ in monthly disbursements with 99.4% success rate.",
                  source: "datadog checkout telemetry logs",
                  matchedSkill: "Payment SDKs",
                  accepted: false,
                },
              ],
            },
          });
        } else if (prompt.includes("interview") || prompt.includes("prep")) {
          sendEvent({
            type: "step",
            step: "headphones",
            text: "preparing role-specific interview simulation…",
          });
          await sleep(400);

          sendEvent({
            type: "text",
            content: "here is an authentic high-frequency question asked in swiggy and razorpay technical rounds. you can practice typing or voice recording:",
          });

          sendEvent({
            type: "tool_call",
            name: "interview_coach",
            status: "completed",
          });

          sendEvent({
            type: "tool_result",
            tool: "interview_question",
            data: {
              question: MOCK_INTERVIEW_QUESTIONS[0],
            },
          });
        } else if (prompt.includes("ats") || prompt.includes("score")) {
          sendEvent({
            type: "step",
            step: "detective",
            text: "parsing resume against zomato frontend JD…",
          });
          await sleep(400);

          sendEvent({
            type: "text",
            content: "your ats score is currently 78/100 for zomato. the main bottleneck is missing keywords around e2e testing with playwright and module federation. here is the live breakdown with one-click fixes:",
          });

          sendEvent({
            type: "tool_call",
            name: "ats_analyzer",
            status: "completed",
          });

          sendEvent({
            type: "tool_result",
            tool: "ats_score",
            data: {
              score: 78,
              company: "Zomato",
              role: "Frontend Engineer",
              requirements: MOCK_ATS_REQUIREMENTS,
            },
          });
        } else {
          // General career roadmap / guidance
          sendEvent({
            type: "step",
            step: "wizard",
            text: "generating weekly progression roadmap…",
          });
          await sleep(400);

          sendEvent({
            type: "text",
            content: "here is your prioritized roadmap for this week based on the 6 target tech companies in your pipeline. completing these 3 tasks closes your highest-frequency gaps:",
          });

          sendEvent({
            type: "tool_call",
            name: "roadmap_planner",
            status: "completed",
          });

          sendEvent({
            type: "tool_result",
            tool: "roadmap_task",
            data: {
              roadmap: MOCK_WEEKLY_ROADMAP,
            },
          });
        }

        // Finish step: Pip coffee
        sendEvent({
          type: "step",
          step: "coffee",
          text: "all set! what would you like to review next?",
        });

        sendEvent({ type: "done" });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
