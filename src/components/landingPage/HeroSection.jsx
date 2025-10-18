// HeroSection.tsx
'use client'

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Star, Trophy, ArrowRight } from "lucide-react";

export default function HeroSection() {
  const heroWords = "Transform Your Career Journey with AI-Powered Guidance";

  const testimonialUsers = [
    { id: 1, name: "Sarah M.", designation: "Software Engineer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
    { id: 2, name: "John D.", designation: "Product Manager", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
    { id: 3, name: "Emma W.", designation: "UX Designer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma" },
    { id: 4, name: "Mike R.", designation: "Data Analyst", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 overflow-hidden bg-[#0f0e0a] pt-32 md:pt-40 pb-20 md:pb-32">
       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/30 to-transparent" />
        <BackgroundBeams className="absolute inset-0 opacity-40" />
        
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#f59e0b]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-[#fbbf24]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#1a1815]/80 border border-[#f59e0b]/30 backdrop-blur-sm">
              <Star className="h-4 w-4 text-[#fbbf24] mr-2" />
              <span className="text-sm font-medium text-white">AI-Powered Career Platform</span>
              <Trophy className="h-4 w-4 text-[#fbbf24] ml-2" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-10"
          >
            <TextGenerateEffect 
              words={heroWords}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight text-white"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-xl sm:text-2xl md:text-2xl text-[#b0b0b0] mb-16 max-w-3xl mx-auto leading-relaxed font-light"
          >
            Discover your potential, map your path, and accelerate your professional growth with personalized insights and expert guidance
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20"
          >
            <Link href="/assessment">
              <Button
                size="lg"
                className="px-10 py-7 text-base font-semibold bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#f59e0b]/90 hover:to-[#fbbf24]/90 text-black border-0 rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Start Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link href="/features">
              <Button
                size="lg"
                variant="outline"
                className="px-10 py-7 text-base font-medium bg-[rgba(245,158,11,0.05)] border-[#f59e0b]/30 hover:bg-[rgba(245,158,11,0.1)] hover:border-[#f59e0b]/50 rounded-xl backdrop-blur-sm transition-all duration-300 text-white"
              >
                Explore Features
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="flex items-center justify-center">
              <AnimatedTooltip items={testimonialUsers} />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.6 + i * 0.1 }}
                  >
                    <Star className="h-5 w-5 text-[#fbbf24] fill-[#fbbf24]" />
                  </motion.div>
                ))}
              </div>
              <span className="text-[#b0b0b0] text-sm ml-2 font-light">Trusted by 10,000+ professionals</span>
            </div>
          </motion.div>
        </div>
      </section>
  );
}