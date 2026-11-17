import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { runAIStructured } from "@/lib/ai";
import { SYSTEM_PROMPT, buildChatContext, chatOutputSchema, resolveCards } from "@/lib/ai/chatContext";
import { safeErr } from "@/lib/utils";

export const runtime = "nodejs";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

const AI_CODES = new Set(["AI_LIMIT", "AI_UNAVAILABLE", "AI_BAD_OUTPUT", "AI_CONFIG", "AI_FAILED"]);
const ERROR_MESSAGES = {
  AI_LIMIT: "You've reached today's AI limit. Try again tomorrow.",
  AI_UNAVAILABLE: "The AI is busy right now. Please try again in a moment.",
  AI_BAD_OUTPUT: "I couldn't put a reliable answer together. Please try again.",
  AI_CONFIG: "The AI isn't set up on the server yet.",
  AI_FAILED: "Something went wrong while thinking. Please try again.",
  INTERNAL: "Something went wrong. Please try again.",
};

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }

    let raw;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body", code: "BAD_REQUEST" }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request: 'message' must be a non-empty string up to 4000 characters", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }
    const message = parsed.data.message;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        try {
          send({ type: "step", step: "detective", text: "reading your records..." });

          const user = await db.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
          if (!user) {
            send({ type: "text", content: "I can't find your profile yet. Please finish onboarding first." });
            send({ type: "done" });
            return;
          }

          const { contextText, cardIndex } = await buildChatContext(user.id);
          send({ type: "step", step: "thinking", text: "putting an answer together..." });

          const out = await runAIStructured(
            "write",
            chatOutputSchema,
            () => [
              ["system", `${SYSTEM_PROMPT}\n\nUSER DATA:\n${contextText}`],
              ["user", message],
            ],
            { userId, temperature: 0.2 }
          );

          send({ type: "text", content: out.reply.trim() });
          for (const card of resolveCards(out.cards, cardIndex)) {
            send({ type: "tool_result", tool: card.tool, data: card.data });
          }
          send({ type: "step", step: "coffee", text: "all set! what would you like to review next?" });
          send({ type: "done" });
        } catch (err) {
          console.error("Chat failed:", safeErr(err));
          const code = AI_CODES.has(err?.code) ? err.code : "INTERNAL";
          send({ type: "error", code, message: ERROR_MESSAGES[code] });
        } finally {
          controller.close();
        }
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
    console.error("Chat error:", safeErr(error));
    return NextResponse.json({ error: "Failed to process chat", code: "INTERNAL" }, { status: 500 });
  }
}
