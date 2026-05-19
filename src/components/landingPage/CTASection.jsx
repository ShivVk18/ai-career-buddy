"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-32 px-6 md:px-12 relative bg-background overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-divider opacity-30" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="border border-border bg-background p-12 md:p-24 rounded-sm flex flex-col md:flex-row items-center justify-between gap-12"
        >
          <div className="max-w-2xl text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-clash font-bold text-foreground uppercase tracking-tight leading-[0.85] mb-8">
              Ready to level up <br />
              <span className="text-accent">your career?</span>
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              Join thousands of job seekers using AscendAI to get interviews
              faster, negotiate better, and land roles they love.
            </p>
          </div>

          <div className="flex flex-col gap-4 min-w-[280px]">
            <Link href="/dashboard">
              <button className="w-full px-10 py-5 bg-accent text-accent-foreground font-bold tracking-widest uppercase rounded-sm hover:brightness-110 transition-editorial">
                Start for Free
              </button>
            </Link>
            <Link href="#features">
              <button className="w-full px-10 py-5 border border-border text-foreground font-medium tracking-widest uppercase rounded-sm hover:bg-border/20 transition-editorial">
                Explore Features
              </button>
            </Link>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] text-center mt-2">
              No credit card required
            </p>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-divider opacity-30" />
    </section>
  );
};

export default CTASection;