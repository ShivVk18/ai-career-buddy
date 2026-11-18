"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Check, Briefcase, Bell } from "lucide-react";

// Layered, tilted stack of sample UI cards. Parallax on scroll via CSS variable (skipped for reduced motion).
export default function HeroStack() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => el.style.setProperty("--py", String(Math.min(window.scrollY, 900))));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const layer = (k) => ({ transform: `translate3d(0, calc(var(--py, 0) * ${k} * -1px), 0)` });

  return (
    <figure ref={ref} className="relative mx-auto h-[26rem] w-full max-w-md select-none sm:h-[30rem] lg:max-w-none" aria-label="Sample product preview">
      <div className="absolute inset-x-6 inset-y-8 rounded-[2rem] bg-primary/10 blur-3xl" aria-hidden="true" />

      <div style={layer(0.04)} className="absolute left-0 top-0 w-[78%] sm:w-[72%]">
        <div className="-rotate-3 rounded-2xl border border-line bg-panel p-4 shadow-pop motion-safe:animate-[floatY_7s_ease-in-out_infinite]">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium text-faint"><Briefcase className="h-3.5 w-3.5" aria-hidden="true" /> jobs saved</p>
          <div className="flex flex-wrap gap-2">
            {["Frontend Engineer II", "Senior UI Engineer", "Product Designer"].map((j, i) => (
              <span key={j} className={`rounded-full border px-3 py-1 text-xs ${i === 0 ? "border-primary bg-primary text-white" : "border-line bg-soft text-muted"}`}>{j}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={layer(0.1)} className="absolute right-0 top-[24%] w-[84%] sm:w-[78%]">
        <div className="rotate-2 rounded-2xl border border-line bg-panel p-4 shadow-pop motion-safe:animate-[floatY_8s_ease-in-out_-2s_infinite]">
          <p className="mb-3 text-xs font-medium text-faint">pipeline / Northwind Pay</p>
          <ol className="flex items-center gap-1.5 text-[11px]">
            {["match", "resume", "letter", "prep"].map((s, i) => (
              <li key={s} className="flex flex-1 flex-col gap-1.5">
                <span className={`h-1.5 rounded-full ${i < 2 ? "bg-lime" : i === 2 ? "bg-primary" : "bg-line"}`} />
                <span className={i < 3 ? "text-text" : "text-faint"}>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div style={layer(0.18)} className="absolute bottom-0 left-[6%] w-[92%] sm:w-[84%]">
        <div className="-rotate-1 rounded-2xl border border-line bg-panel p-4 shadow-pop motion-safe:animate-[floatY_9s_ease-in-out_-4s_infinite]">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium text-faint"><Bell className="h-3.5 w-3.5" aria-hidden="true" /> needs you / tracked change</p>
          <p className="text-sm leading-relaxed text-muted">
            <span className="text-faint line-through decoration-danger/70">Responsible for improving site speed</span>{" "}
            <span className="highlight-match rounded px-0.5 text-text">Cut checkout load time with code splitting</span>
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-soft px-2.5 py-1 text-[11px] text-muted">source: your resume</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-lime px-3 py-1 text-[11px] font-medium text-lime-foreground"><Check className="h-3 w-3" aria-hidden="true" /> accept</span>
          </div>
        </div>
      </div>

      <Image src="/pip/pip-rocket.svg" alt="" width={44} height={44} unoptimized style={{ imageRendering: "pixelated" }} className="absolute -right-1 top-0 motion-safe:animate-[floatY_5s_ease-in-out_infinite] sm:right-2" />
      <figcaption className="absolute -bottom-6 right-0 text-[11px] text-faint">sample data, made-up names</figcaption>
    </figure>
  );
}
