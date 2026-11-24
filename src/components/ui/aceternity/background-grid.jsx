/**
 * Adapted from Aceternity UI (https://ui.aceternity.com) - MIT License.
 * Copyright (c) Aceternity. Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software, to deal in it without restriction, subject to the MIT
 * license terms (https://opensource.org/licenses/MIT). Provided "as is", without warranty.
 * Re-themed to the ascendai tokens (docs/ai/DESIGN.md). No fake data. Motion is
 * disabled under prefers-reduced-motion.
 */
import { cn } from "@/lib/utils";

/** Subtle masked grid backdrop. Pure CSS, no canvas. */
export function BackgroundGrid({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]",
        className
      )}
    />
  );
}

/** Subtle masked dot backdrop. */
export function BackgroundDots({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]",
        className
      )}
    />
  );
}
