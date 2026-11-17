"use client";

import React from "react";
import Image from "next/image";
import ToolResultCard from "./ToolResultCard";

const PIP_OUTFIT_SRCS = {
  detective: "/pip/pip-detective.svg",
  thinking: "/pip/pip-thinking.svg",
  wizard: "/pip/pip-wizard.svg",
  headphones: "/pip/pip-headphones.svg",
  rocket: "/pip/pip-rocket.svg",
  coffee: "/pip/pip-coffee.svg",
};

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-lg bg-[#23222B] text-white px-4 py-3 rounded-2xl rounded-tr-sm text-xs sm:text-sm font-sans leading-relaxed shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const outfitKey = message.outfit || "coffee";
  const outfitSrc = PIP_OUTFIT_SRCS[outfitKey] || PIP_OUTFIT_SRCS.coffee;

  return (
    <div className="flex items-start gap-3 mb-5 max-w-2xl min-w-0">
      {/* Pip Avatar with current step outfit */}
      <div className="w-9 h-9 rounded-full bg-white border border-[#ECEAE4] p-1 shrink-0 shadow-sm pip-hop">
        <Image
          src={outfitSrc}
          alt={`pip ${outfitKey}`}
          width={32}
          height={32}
          className="w-full h-full object-contain"
          style={{ imageRendering: "pixelated" }}
          unoptimized
        />
      </div>

      {/* Soft Panel Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="panel-cozy p-3.5 sm:p-4 bg-white border border-[#ECEAE4] text-xs sm:text-sm leading-relaxed text-[#23222B] break-words">
          {message.content}
        </div>

        {/* Tool Result if present */}
        {message.toolResult && (
          <ToolResultCard
            type={message.toolResult.tool}
            data={message.toolResult.data}
          />
        )}
      </div>
    </div>
  );
}
