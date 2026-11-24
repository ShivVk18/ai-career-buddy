import Image from "next/image";
import { cn } from "@/lib/utils";

export const PIP_OUTFITS = ["detective", "thinking", "wizard", "rocket", "headphones", "coffee"];
const SIZES = { sm: 28, md: 40, lg: 64, xl: 96, "2xl": 140 };

/** Pip in one of six outfits. `working` adds a gentle hop (off under reduced motion). */
export default function PipAvatar({ outfit = "coffee", size = "md", working = false, className, alt }) {
  const px = typeof size === "number" ? size : SIZES[size] || 40;
  const o = PIP_OUTFITS.includes(outfit) ? outfit : "coffee";
  return (
    <span className={cn("inline-block shrink-0", working && "pip-hop", className)} style={{ width: px, height: px }}>
      <Image
        src={`/pip/pip-${o}.svg`}
        alt={alt ?? `pip, ${o}`}
        width={px}
        height={px}
        unoptimized
        loading="eager"
        className="size-full object-contain"
        style={{ imageRendering: "pixelated" }}
      />
    </span>
  );
}
