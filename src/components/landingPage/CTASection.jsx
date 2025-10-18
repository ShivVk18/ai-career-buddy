"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AnimatedSection, AnimatedText } from "@/components/AnimatedSection";

const CTASection = () => {
  return (
    <section className="py-32 px-6 lg:px-8 relative bg-[#0f0e0a]">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#f59e0b]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#fbbf24]/10 rounded-full blur-3xl" />
      </div>
      
      <AnimatedSection>
        <div className="max-w-5xl mx-auto relative z-10">
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/30 to-transparent" />
          <div className="relative rounded-3xl overflow-hidden border border-[#f59e0b]/20 bg-gradient-to-br from-[#1a1815]/80 via-[#252218]/60 to-[#1a1815]/80 backdrop-blur-xl shadow-2xl shadow-[#f59e0b]/5">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/50 to-transparent" />
            
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f59e0b]/5 to-transparent" />
            </div>

            <div className="relative px-8 py-16 md:px-16 md:py-24 text-center">
              <div className="space-y-10">
                <div className="space-y-6">
                  <AnimatedText>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                      Ready to Take Control
                      <br />
                      <span className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] bg-clip-text text-transparent">
                        of Your Career?
                      </span>
                    </h2>
                  </AnimatedText>
                  <AnimatedText delay={0.2}>
                    <p className="text-xl md:text-2xl text-[#b0b0b0] max-w-2xl mx-auto font-light leading-relaxed">
                      Start your journey today with our free career assessment
                      and discover your potential
                    </p>
                  </AnimatedText>
                </div>

                <motion.div
                  className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Link href="/assessment">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto px-10 py-7 text-base font-semibold bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#f59e0b]/90 hover:to-[#fbbf24]/90 text-black border-0 rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 transition-all duration-300"
                    >
                      Start Free Assessment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto px-10 py-7 text-base font-medium bg-[rgba(245,158,11,0.05)] border-[#f59e0b]/30 hover:bg-[rgba(245,158,11,0.1)] hover:border-[#f59e0b]/50 rounded-xl transition-all duration-300 backdrop-blur-sm text-white"
                    >
                      Learn More
                    </Button>
                  </Link>
                </motion.div>

                {/* Stats or trust indicators (optional) */}
                <motion.div
                  className="pt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-[#808080]"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" />
                    <span>Free forever plan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" />
                    <span>Cancel anytime</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
};

export default CTASection;