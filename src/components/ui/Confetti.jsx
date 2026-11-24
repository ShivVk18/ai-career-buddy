"use client";

import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";

const COLORS = ["#F6B9CB", "#FFE48A", "#BCAEF2", "#A9DAF7", "#2F9E77", "#FFFFFF"];
const rng = (seed) => () => ((seed = (Math.imul(seed ^ (seed >>> 15), 1 | seed) + 0x6d2b79f5) | 0), (seed >>> 0) / 4294967296);

/** Falling pixel squares. Renders nothing under prefers-reduced-motion. Put in a relative parent. */
export default function Confetti({ active = true, count = 90, seed = 42 }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(() => {
    const R = rng(seed);
    return Array.from({ length: count }, (_, i) => ({
      left: Math.round(R() * 100),
      size: 6 + (i % 3) * 3,
      delay: R() * 1.5,
      dur: 2.8 + R() * 2.2,
      dx: Math.round((R() - 0.5) * 60 / 6) * 6,
      color: COLORS[i % COLORS.length],
    }));
  }, [count, seed]);
  if (!active || reduce) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <i
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            "--dx": `${p.dx}px`,
            animation: `confettiFall ${p.dur}s steps(24) ${p.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}
