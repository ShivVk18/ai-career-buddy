/**
 * Adapted from Aceternity UI (https://ui.aceternity.com) - MIT License.
 * Copyright (c) Aceternity. Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software, to deal in it without restriction, subject to the MIT
 * license terms (https://opensource.org/licenses/MIT). Provided "as is", without warranty.
 * Re-themed to the ascendai tokens (docs/ai/DESIGN.md). No fake data. Motion is
 * disabled under prefers-reduced-motion.
 */
import { cn } from "@/lib/utils";
import { GlowCard } from "./glow-card";

export function BentoGrid({ className, children }) {
  return <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-3", className)}>{children}</div>;
}

/** One bento tile. Pass `href` + `as={Link}` to make it a link. */
export function BentoGridItem({ className, title, description, icon, header, children, ...props }) {
  return (
    <GlowCard className={cn("flex flex-col p-5", className)} {...props}>
      {header}
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-base font-semibold text-text">{title}</h3>
      </div>
      {description && <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>}
      {children}
    </GlowCard>
  );
}
