/**
 * Adapted from Aceternity UI (https://ui.aceternity.com) - MIT License.
 * Copyright (c) Aceternity. Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software, to deal in it without restriction, subject to the MIT
 * license terms (https://opensource.org/licenses/MIT). Provided "as is", without warranty.
 * Re-themed to the ascendai tokens (docs/ai/DESIGN.md). No fake data. Motion is
 * disabled under prefers-reduced-motion.
 */
"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The standard "premium card": a surface with a cursor-following glow on hover.
 * The glow is a CSS variable update (no re-render) and is hidden under reduced motion.
 */
export function GlowCard({ as: Comp = "div", className, children, ...props }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <Comp
      ref={ref}
      onMouseMove={onMove}
      className={cn(
        "group/glow relative overflow-hidden rounded-2xl border border-line bg-panel shadow-card transition-colors hover:border-primary/40",
        className
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover/glow:opacity-100 motion-reduce:hidden"
        style={{ background: "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), var(--glow), transparent 70%)" }}
      />
      <div className="relative">{children}</div>
    </Comp>
  );
}

export { GlowCard as CardSpotlight };
