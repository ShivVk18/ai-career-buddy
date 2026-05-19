// EditorialContentGrid.jsx
'use client'

import React from 'react';

const EditorialContentGrid = () => {
  return (
    <section className="py-24 px-6 md:px-12 bg-background border-t border-divider/30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">

        {/* Left: Value prop */}
        <div className="md:col-span-5 space-y-6">
          <p className="text-xl md:text-2xl font-light leading-relaxed text-foreground">
            Stop spending hours on applications that go nowhere. AscendAI gives
            you an unfair advantage — personalized, AI-powered tools that make
            every application count.
          </p>

          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Free to start · No card needed
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="hidden md:block md:col-span-1" />

        {/* Right: Email / waitlist capture */}
        <div className="md:col-span-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
              Get early access updates
            </p>
            <div className="flex flex-col md:flex-row overflow-hidden">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-grow bg-transparent border border-border px-6 py-5 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-accent transition-colors rounded-t-sm md:rounded-l-sm md:rounded-tr-none text-sm"
              />
              <button className="bg-accent text-accent-foreground font-bold tracking-widest uppercase px-10 py-5 hover:brightness-110 transition-editorial rounded-b-sm md:rounded-r-sm md:rounded-bl-none whitespace-nowrap text-sm">
                Notify Me
              </button>
            </div>
            <p className="text-[10px] tracking-[0.1em] text-muted-foreground uppercase text-center md:text-left">
              No spam. Unsubscribe any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialContentGrid;
