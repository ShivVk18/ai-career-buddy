"use client";

import { useEffect, useRef, useState } from "react";

// Scroll-reveal: content is visible without JS and for above-the-fold items; below-the-fold items fade up once.
export default function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const ref = useRef(null);
  const [state, setState] = useState("show");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return;
    setState("hide");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("show");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: state === "show" ? `${delay}ms` : "0ms" }}
      className={`transition-[opacity,transform] duration-700 ease-out ${state === "hide" ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
