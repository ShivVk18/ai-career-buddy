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
 * Card frame with a travelling gradient edge. Use sparingly (e.g. the pipeline step that is
 * running). When `active` is false it renders a plain bordered surface.
 */
export function MovingBorder({ active = true, className, innerClassName, children }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-px", active ? "" : "border border-line", className)}>
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 animate-border-spin motion-reduce:animate-none"
          style={{ background: "conic-gradient(from 0deg, transparent 0 60%, var(--primary) 80%, var(--lime) 100%)" }}
        />
      )}
      <div className={cn("relative rounded-[15px] bg-panel", innerClassName)}>{children}</div>
    </div>
  );
}
