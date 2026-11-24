"use client";

import { WAVE_BARS } from "@/hooks/use-voice-answer";

// Static pattern used under reduced motion (and as the recording look before the first level arrives).
const STATIC = Array.from({ length: WAVE_BARS }, (_, i) => Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));

/** Idle = a dotted line. Recording = bars from the mic level history (static bars under reduced motion). */
export default function Wave({ recording, levels, reduced, className = "" }) {
  const src = recording ? (reduced ? STATIC : levels) : null;
  return (
    <div aria-hidden="true" className={`flex h-14 items-center justify-between gap-[2px] overflow-hidden sm:gap-[3px] ${className}`}>
      {Array.from({ length: WAVE_BARS }, (_, i) => {
        const l = src ? src[i] || 0 : 0;
        const h = src ? 5 + l * 48 : 5;
        return (
          <i
            key={i}
            className="block min-w-px max-w-[5px] flex-1 rounded-full bg-brand transition-[height] duration-75"
            style={{ height: h }}
          />
        );
      })}
    </div>
  );
}
