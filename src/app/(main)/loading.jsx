import React from "react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
      <div className="relative flex flex-col items-center gap-8">
        {/* Animated Logo Mark */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 m-auto w-3 h-3 bg-accent rounded-full shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)] animate-pulse" />
          <div className="absolute inset-0 border-2 border-accent/20 rounded-full animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-2 border-2 border-accent/10 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-bold tracking-[0.4em] text-accent uppercase animate-pulse">
            Syncing
          </p>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-accent/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-1 bg-accent/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-1 bg-accent/40 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
