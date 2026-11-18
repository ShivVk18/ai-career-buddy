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
 * Pill CTA with a slowly rotating indigo-to-lime border. Wrap a Link or button as `children`
 * via `as`. The rotation stops under reduced motion (border stays as a static gradient).
 */
export function HoverBorderGradient({ as: Comp = "button", className, containerClassName, children, ...props }) {
  return (
    <span className={cn("group/hbg relative inline-flex overflow-hidden rounded-full p-[2px]", containerClassName)}>
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 aspect-square w-[300%] -translate-x-1/2 -translate-y-1/2 animate-border-spin motion-reduce:animate-none"
        style={{ background: "conic-gradient(from 0deg, var(--primary), var(--lime), var(--primary))" }}
      />
      <Comp
        className={cn(
          "relative z-10 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-panel px-6 text-sm font-medium text-text transition-colors group-hover/hbg:bg-soft",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    </span>
  );
}
