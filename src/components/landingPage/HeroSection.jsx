'use client'

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { SparklesCore } from "@/components/ui/sparkles";
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
   <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-8 overflow-hidden">
        <SparklesCore
          id="hero-sparkles"
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={80}
          className="absolute inset-0"
          particleColor="#f97316"
        />

        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"
        />

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
              <Star className="h-4 w-4 text-orange-400 mr-2" />
              <span className="text-sm font-medium text-slate-300">AI-Powered Career Platform</span>
              <Trophy className="h-4 w-4 text-orange-400 ml-2" />
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
            className="text-xl sm:text-2xl md:text-2xl text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed font-light"
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
                className="px-10 py-7 text-base font-medium bg-orange-600 hover:bg-orange-500 text-white border-0 rounded-xl shadow-lg shadow-orange-600/20 hover:shadow-xl hover:shadow-orange-600/30 transition-all duration-300"
              >
                Start Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link href="/features">
              <Button
                size="lg"
                variant="outline"
                className="px-10 py-7 text-base font-medium border-slate-700 hover:bg-slate-800/50 rounded-xl backdrop-blur-sm hover:border-slate-600 transition-all duration-300 text-slate-200"
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
                    <Star className="h-5 w-5 text-orange-400 fill-orange-400" />
                  </motion.div>
                ))}
              </div>
              <span className="text-slate-400 text-sm ml-2 font-light">Trusted by 10,000+ professionals</span>
            </div>
          </motion.div>
        </div>
      </section>
  );
}
