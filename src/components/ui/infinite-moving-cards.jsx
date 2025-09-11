"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    addAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addAnimation() {
    const container = containerRef.current;
    const scroller = scrollerRef.current;
    if (!container || !scroller || !items || !items.length) return;

    // prevent duplicating items multiple times (HMR / re-runs)
    if (scroller.children.length >= items.length * 2) {
      applyDirectionAndSpeed(container);
      setStart(true);
      return;
    }

    const originalCount = scroller.children.length;
    for (let i = 0; i < originalCount; i++) {
      scroller.appendChild(scroller.children[i].cloneNode(true));
    }

    applyDirectionAndSpeed(container);
    setStart(true);
  }

  const applyDirectionAndSpeed = (container) => {
    if (!container) return;
    container.style.setProperty(
      "--animation-direction",
      direction === "left" ? "forwards" : "reverse"
    );
    const duration = speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s";
    container.style.setProperty("--animation-duration", duration);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          <li
            key={`${item.name ?? "card"}-${idx}`}
            className="w-[350px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-700 px-8 py-6 md:w-[450px]"
            style={{
              background:
                "linear-gradient(180deg, var(--slate-800), var(--slate-900))",
            }}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="select-none -z-10 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              />
              <span className="relative z-20 text-sm leading-[1.6] text-gray-100 font-normal">
                {item.quote}
              </span>
              <div className="relative z-20 mt-6 flex flex-row items-center">
                <span className="flex flex-col gap-1">
                  <span className="text-sm leading-[1.6] text-gray-400 font-normal">
                    {item.name}
                  </span>
                  <span className="text-sm leading-[1.6] text-gray-400 font-normal">
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};
