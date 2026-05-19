// HeroSection.jsx
'use client'

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  const { isSignedIn } = useUser();
  const brandName = "AscendAI";

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 pt-32 pb-24 overflow-hidden bg-background">

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="w-12 h-[1px] bg-accent" />
        <span className="text-xs md:text-sm font-medium tracking-[0.3em] text-muted-foreground uppercase">
          Your AI Career Coach
        </span>
      </motion.div>

      {/* Main Headline */}
      <div className="relative w-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          {/* Shadow layer */}
          <h1
            className="absolute top-1 left-1 md:top-[4px] md:left-[4px] w-full text-[16vw] md:text-[11.5vw] font-clash font-bold uppercase tracking-tighter leading-[0.85] pointer-events-none select-none opacity-50"
            style={{ WebkitTextStroke: "1px var(--border)", color: "transparent" }}
            aria-hidden="true"
          >
            {brandName}
          </h1>
          {/* Front layer */}
          <h1 className="relative w-full text-[16vw] md:text-[11.5vw] font-clash font-bold uppercase tracking-tighter leading-[0.85] text-foreground">
            {brandName}
          </h1>
        </motion.div>
      </div>

      {/* Sub-headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="mt-12 max-w-2xl"
      >
        <p className="text-lg md:text-xl font-light leading-relaxed text-muted-foreground">
          Land your dream job faster with AI that writes your resume, preps your
          interviews, builds your career roadmap, and drafts your outreach — all
          in one place.
        </p>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="mt-16 flex flex-wrap gap-6 items-center"
      >
        {isSignedIn ? (
          <Link href="/dashboard">
            <button className="group flex items-center gap-3 px-10 py-5 bg-accent text-accent-foreground font-bold tracking-widest uppercase rounded-sm hover:brightness-110 transition-editorial">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        ) : (
          <SignInButton mode="modal">
            <button className="group flex items-center gap-3 px-10 py-5 bg-accent text-accent-foreground font-bold tracking-widest uppercase rounded-sm hover:brightness-110 transition-editorial">
              Get Started Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </SignInButton>
        )}

        <Link href="#features">
          <button className="px-10 py-5 border border-border text-foreground font-medium tracking-widest uppercase rounded-sm hover:bg-border/20 transition-editorial">
            See What It Does
          </button>
        </Link>
      </motion.div>

      {/* Signed-in welcome note */}
      {isSignedIn && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 text-sm text-muted-foreground"
        >
          Welcome back! 👋 Your career tools are ready.
        </motion.p>
      )}

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-divider opacity-50" />
    </section>
  );
}