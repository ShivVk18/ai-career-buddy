"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, Send, Sparkles, MessageSquare, ArrowUpRight } from "lucide-react";
import ChatMessage from "./ChatMessage";
import PipStatus from "../pixel/PipStatus";
import { generationErrorMessage } from "../shared/generationError";

const SUGGESTED_PROMPTS = [
  "What's my latest ATS score?",
  "What should I work on next?",
  "Which cover letters have I written?",
  "How am I doing on my roadmap?",
];

const LIMIT_MESSAGE = "You've reached today's AI limit. Try again tomorrow.";
const GENERIC_ERROR_MESSAGE =
  "sorry, something went wrong on my side. please try again in a moment.";

function friendlyError(code) {
  if (code === "AI_LIMIT") return LIMIT_MESSAGE;
  if (code === "UNAUTHORIZED") return "Your session has expired. Please sign in again.";
  if (code === "AI_UNAVAILABLE") return generationErrorMessage({ code }, GENERIC_ERROR_MESSAGE);
  return GENERIC_ERROR_MESSAGE;
}

export default function ChatSlideOver({ isOpen, onClose, embedded = false, initialMessage = null, onInitialMessageSent }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "hey, i'm pip. i can look through your ats scores, roadmaps, letters and emails. what are you working on?",
      outfit: "coffee",
    },
  ]);
  const [input, setInput] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStep]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || isWorking) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsWorking(true);
    setCurrentStep({ step: "detective", text: "reading your records…" });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        // Pre-stream JSON error: { error, code } with status 400/401/500
        let code = "INTERNAL";
        try {
          const body = await res.json();
          code = body?.code || code;
        } catch {
          // non-JSON body; keep generic code
        }
        throw Object.assign(new Error("chat request failed"), { code });
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("no stream");
      const decoder = new TextDecoder();
      let assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        outfit: "detective",
        toolResults: [],
      };

      let buffer = "";
      let sawTerminal = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.replace("data: ", ""));

            if (event.type === "step") {
              setCurrentStep({ step: event.step, text: event.text });
              assistantMsg.outfit = event.step;
            } else if (event.type === "text") {
              assistantMsg.content += event.content;
            } else if (event.type === "tool_result") {
              assistantMsg.toolResults.push(event);
            } else if (event.type === "error") {
              // Terminal: replace anything partial with a friendly message, no cards.
              assistantMsg.content = friendlyError(event.code);
              assistantMsg.toolResults = [];
              assistantMsg.outfit = "thinking";
              sawTerminal = true;
              setCurrentStep(null);
            } else if (event.type === "done") {
              sawTerminal = true;
              setCurrentStep(null);
            }
          } catch (e) {
            console.error("Parse error:", e);
          }
        }
      }

      if (!sawTerminal && !assistantMsg.content) {
        assistantMsg.content = GENERIC_ERROR_MESSAGE;
        assistantMsg.outfit = "thinking";
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: err?.code ? friendlyError(err.code) : "sorry, i ran into a brief snag connecting to my brain. please try again in a second!",
          outfit: "thinking",
        },
      ]);
    } finally {
      setIsWorking(false);
      setCurrentStep(null);
    }
  };

  // Auto-send a pre-supplied message once when the chat is open.
  const sentInitialRef = useRef(null);
  useEffect(() => {
    if (!initialMessage) {
      sentInitialRef.current = null;
      return;
    }
    if (!(isOpen || embedded) || sentInitialRef.current === initialMessage) return;
    // A request is in flight: keep it queued (ref not set). This effect runs on
    // every render, so it re-fires when isWorking flips back to false.
    if (isWorking) return;
    sentInitialRef.current = initialMessage;
    handleSend(initialMessage);
    onInitialMessageSent?.();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const content = (
    <div className="flex flex-col h-full bg-bg text-text">
      {/* Header */}
      <div className="px-5 py-4 bg-panel border-b border-line flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center p-1">
            <Image
              src="/pip/pip-detective.svg"
              alt="pip"
              width={26}
              height={26}
              style={{ imageRendering: "pixelated" }}
              unoptimized
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-text">
              chat with pip
            </h2>
            <span className="font-pixel text-[11px] text-brand-ink">
              read-only. reads your records
            </span>
          </div>
        </div>

        {!embedded && (
          <button
            onClick={onClose}
            className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-muted hover:bg-soft transition"
            aria-label="close chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}

        {/* Live working step indicator */}
        {isWorking && currentStep && (
          <div className="pl-12 py-1">
            <PipStatus
              step={currentStep.step}
              text={currentStep.text}
              size="sm"
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts when few messages */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-line bg-panel/50">
          <span className="font-pixel text-[10px] uppercase text-muted block mb-2 tracking-wider">
            try asking
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((promptText, i) => (
              <button
                key={i}
                onClick={() => handleSend(promptText)}
                className="text-xs min-h-8 px-3 py-1 rounded-[var(--radius-chip)] bg-panel border border-line text-text hover:border-brand hover:text-brand-ink transition text-left"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Footer */}
      <div className="p-3 sm:p-4 bg-panel border-t border-line shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 min-w-0 w-full"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ask pip about your scores, roadmap or documents…"
            disabled={isWorking}
            className="flex-1 min-w-0 bg-soft text-text placeholder:text-faint text-xs sm:text-sm px-4 py-2.5 rounded-full border border-transparent focus:border-brand focus:bg-panel outline-none transition"
          />
          <button
            type="submit"
            disabled={isWorking || !input.trim()}
            className="inline-flex items-center justify-center bg-ink text-ink-foreground hover:opacity-90 transition w-11 h-11 p-0 rounded-full shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  if (embedded) {
    return <div className="h-full w-full panel-cozy overflow-hidden">{content}</div>;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onClick={onClose} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div role="dialog" aria-label="chat with pip" onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-md overflow-hidden shadow-soft animate-in slide-in-from-right duration-200 md:m-3 md:h-[calc(100%-1.5rem)] md:rounded-[var(--radius-panel)] md:border md:border-line">
        {content}
      </div>
    </div>
  );
}
