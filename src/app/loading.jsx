import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="noise-overlay" />
      <div className="relative flex flex-col items-center gap-8">
       
        <div className="relative w-20 h-20">
         
          <div className="absolute inset-0 m-auto w-4 h-4 bg-accent rounded-full shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)] animate-pulse" />
          
         
          <div className="absolute inset-0 border-2 border-accent/20 rounded-full animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-2 border-2 border-accent/10 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
          
          
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent/40 rounded-full" />
        </div>


        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-bold tracking-[0.4em] text-accent uppercase animate-pulse">
            Ascending
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
