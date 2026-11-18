"use client";

import React from "react";
import Image from "next/image";

const PIP_OUTFITS = {
  detective: {
    src: "/pip/pip-detective.svg",
    label: "detective",
    desc: "reading the job",
    defaultText: "reading the job requirements…",
    color: "#8B6B45",
  },
  thinking: {
    src: "/pip/pip-thinking.svg",
    label: "thinking",
    desc: "matching profile",
    defaultText: "matching your experience to the role…",
    color: "#2F9E77",
  },
  wizard: {
    src: "/pip/pip-wizard.svg",
    label: "wizard",
    desc: "writing & editing",
    defaultText: "tailoring quantifiable bullet points…",
    color: "#7C3AED",
  },
  headphones: {
    src: "/pip/pip-headphones.svg",
    label: "headphones",
    desc: "interview coaching",
    defaultText: "listening and scoring your response…",
    color: "#E11D48",
  },
  rocket: {
    src: "/pip/pip-rocket.svg",
    label: "rocket",
    desc: "sending outreach",
    defaultText: "preparing application dispatch…",
    color: "#EA580C",
  },
  coffee: {
    src: "/pip/pip-coffee.svg",
    label: "coffee",
    desc: "done & resting",
    defaultText: "all done! take a sip of chai.",
    color: "#2F9E77",
  },
};

export default function PipStatus({
  step = "coffee",
  text,
  size = "md",
  className = "",
  inline = false,
  showLabel = true,
}) {
  const outfit = PIP_OUTFITS[step] || PIP_OUTFITS.coffee;
  const statusText = text || outfit.defaultText;

  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const imageSizes = {
    sm: 28,
    md: 40,
    lg: 64,
    xl: 96,
  };

  if (inline) {
    return (
      <div className={`inline-flex items-center gap-2 max-w-full min-w-0 ${className}`}>
        <div className={`relative ${sizeClasses[size]} shrink-0 pip-hop`}>
          <Image
            src={outfit.src}
            alt={`pip as ${outfit.label}`}
            width={imageSizes[size]}
            height={imageSizes[size]}
            className="w-full h-full object-contain"
            style={{ imageRendering: "pixelated" }}
            unoptimized
          />
        </div>
        <span className="font-pixel text-xs text-text/80 truncate">{statusText}</span>
      </div>
    );
  }

  return (
    <div
      className={`panel-cozy px-3 sm:px-3.5 py-2 sm:py-2.5 inline-flex items-center gap-2.5 sm:gap-3 bg-panel/95 backdrop-blur-sm border border-line max-w-full shadow-xs ${className}`}
    >
      <div className={`relative ${sizeClasses[size]} shrink-0 pip-hop`}>
        <Image
          src={outfit.src}
          alt={`pip as ${outfit.label}`}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="w-full h-full object-contain"
          style={{ imageRendering: "pixelated" }}
          unoptimized
        />
      </div>

      <div className="flex flex-col text-left min-w-0 flex-1">
        {showLabel && (
          <div className="flex items-center gap-1.5 mb-0.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-pip animate-pulse shrink-0" />
            <span className="font-pixel text-[10px] uppercase text-pip-ink tracking-wider truncate">
              pip ({outfit.desc})
            </span>
          </div>
        )}
        <span className="text-[11px] sm:text-xs text-text font-normal font-sans tracking-tight break-words line-clamp-2 sm:line-clamp-none">
          {statusText}
        </span>
      </div>
    </div>
  );
}
