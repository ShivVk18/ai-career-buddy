import React from "react";
import { Check, Sparkles } from "lucide-react";

export default function PricingSection() {
  return (
    <section className="py-24 md:py-32 relative border-b border-divider/50">
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-8 h-[1px] bg-accent" />
            <span className="text-xs font-bold tracking-[0.3em] text-accent uppercase">
              Pricing
            </span>
            <div className="w-8 h-[1px] bg-accent" />
          </div>
          <h2 className="text-4xl md:text-6xl font-clash font-bold text-foreground uppercase tracking-tight mb-8">
            Start Free, <span className="text-muted-foreground/50">Go Premium Soon.</span>
          </h2>
          <p className="text-lg text-muted-foreground font-light leading-relaxed">
            AscendAI is currently in Beta and completely free to use. We are working hard to bring you even more powerful, personalized career tools in our upcoming premium tiers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="border border-border bg-background p-10 flex flex-col justify-between shadow-sm relative">
            <div>
              <div className="mb-6 inline-flex px-3 py-1 border border-accent/20 bg-accent/10 rounded-sm text-[10px] font-bold tracking-widest uppercase text-accent">
                Current
              </div>
              <h3 className="text-3xl font-clash font-bold text-foreground uppercase tracking-tight mb-2">Beta Access</h3>
              <p className="text-muted-foreground font-light mb-8 pb-8 border-b border-divider">
                Everything you need to kickstart your career journey.
              </p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-clash font-bold text-foreground">$0</span>
                <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">/ forever</span>
              </div>
              <ul className="space-y-4 mb-10">
                {["AI Resume Tailoring", "Mock Interview Prep", "Cover Letter Generation", "Career Roadmaps", "Standard ATS Parsing"].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button className="w-full h-14 border border-border bg-background hover:bg-divider/10 text-xs font-bold tracking-widest uppercase transition-editorial">
              Your Current Plan
            </button>
          </div>

          {/* Premium Tier */}
          <div className="border border-accent bg-accent/5 p-10 flex flex-col justify-between shadow-lg relative overflow-hidden group">
            {/* "Coming Soon" Overlay */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center transition-editorial">
              <div className="px-6 py-3 bg-accent text-accent-foreground text-xs font-bold tracking-[0.3em] uppercase shadow-xl transform -rotate-3 group-hover:scale-105 transition-editorial">
                Coming Soon
              </div>
            </div>

            <div className="relative opacity-50">
              <div className="mb-6 inline-flex px-3 py-1 border border-accent/50 bg-accent/20 rounded-sm text-[10px] font-bold tracking-widest uppercase text-accent flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Premium
              </div>
              <h3 className="text-3xl font-clash font-bold text-foreground uppercase tracking-tight mb-2">Pro Ascend</h3>
              <p className="text-muted-foreground font-light mb-8 pb-8 border-b border-divider">
                Advanced tools for serious career growth.
              </p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-clash font-bold text-foreground">TBA</span>
              </div>
              <ul className="space-y-4 mb-10">
                {["Unlimited AI Credits", "Advanced Industry-specific Mock Interviews", "Priority Resume Review", "1-on-1 AI Career Coaching", "Custom Portfolio Generation"].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button className="w-full h-14 bg-accent text-accent-foreground text-xs font-bold tracking-widest uppercase opacity-50 cursor-not-allowed">
              Join Waitlist
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
