/**
 * Adapted from Aceternity UI (https://ui.aceternity.com) - MIT License.
 * Copyright (c) Aceternity. Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software, to deal in it without restriction, subject to the MIT
 * license terms (https://opensource.org/licenses/MIT). Provided "as is", without warranty.
 * Re-themed to the ascendai tokens (docs/ai/DESIGN.md). No fake data. Motion is
 * disabled under prefers-reduced-motion.
 */
import { cn } from "@/lib/utils";

/**
 * Words fade in one by one. CSS-only (works in server components, text is in the HTML for
 * SEO/LCP). Under reduced motion the global rule collapses the animation to the end state.
 */
export function TextGenerateEffect({ words, className, step = 0.07 }) {
  return (
    <span className={className}>
      {String(words)
        .split(" ")
        .map((w, i) => (
          <span key={i} className={cn("inline-block animate-[wordIn_0.7s_ease_both]")} style={{ animationDelay: `${i * step}s` }}>
            {w}&nbsp;
          </span>
        ))}
    </span>
  );
}
