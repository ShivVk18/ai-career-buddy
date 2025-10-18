"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AnimatedSection, AnimatedText } from "@/components/AnimatedSection";

const CTASection = () => {
  return (
    <section className="py-32 px-6 lg:px-8 relative bg-gradient-to-b from-[#1a0c05] to-[#0f0603]">
      {/* Ambient glow effects */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#ff5e00]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff8c42]/10 rounded-full blur-3xl" />
      
      <AnimatedSection>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="relative rounded-3xl overflow-hidden border border-[#ffa36c]/30 bg-gradient-to-br from-[#312214]/50 via-[#312214]/30 to-[#312214]/50 backdrop-blur-sm">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-3xl opacity-50"
              style={{
                background: "linear-gradient(135deg, rgba(255,94,0,0.3) 0%, transparent 50%, rgba(255,140,66,0.2) 100%)",
                padding: "1px",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            <div className="relative px-8 py-16 md:px-16 md:py-24 text-center">
              <div className="space-y-10">
                <div className="space-y-6">
                  <AnimatedText>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#fff4ed] tracking-tight leading-tight">
                      Ready to Take Control
                      <br />
                      of Your Career?
                    </h2>
                  </AnimatedText>
                  <AnimatedText delay={0.2}>
                    <p className="text-xl md:text-2xl text-[#c4a893] max-w-2xl mx-auto font-light leading-relaxed">
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
                      className="w-full sm:w-auto px-10 py-7 text-base font-medium bg-gradient-to-r from-[#ff5e00] to-[#ff8c42] hover:from-[#ff5e00]/90 hover:to-[#ff8c42]/90 text-white border-0 rounded-xl shadow-xl shadow-[#ff5e00]/30 hover:shadow-2xl hover:shadow-[#ff5e00]/40 transition-all duration-300"
                    >
                      Start Free Assessment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto px-10 py-7 text-base font-medium border-[#ffa36c]/40 hover:bg-[#312214]/50 rounded-xl hover:border-[#ffa36c]/60 transition-all duration-300 backdrop-blur-sm text-[#fff4ed]"
                    >
                      Learn More
                    </Button>
                  </Link>
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