"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { AnimatedSection, AnimatedText } from "@/components/AnimatedSection";

const CTASection = () => {
  return (
    <section className="py-32 px-6 lg:px-8 relative">
      <AnimatedSection>
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
           
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-slate-900 to-slate-900"></div>

            
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(249, 115, 22, 0) 50%, rgba(249, 115, 22, 0.2) 100%)",
                padding: "1px",
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            ></div>

            <div className="relative px-8 py-16 md:px-16 md:py-24 text-center">
              <div className="space-y-10">
                <div className="space-y-6">
                  <AnimatedText>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                      Ready to Take Control
                      <br />
                      of Your Career?
                    </h2>
                  </AnimatedText>
                  <AnimatedText delay={0.2}>
                    <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
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
                      className="w-full sm:w-auto px-10 py-7 text-base font-medium bg-orange-600 hover:bg-orange-500 text-white border-0 rounded-xl shadow-xl shadow-orange-600/20 hover:shadow-2xl hover:shadow-orange-600/30 transition-all duration-300"
                    >
                      Start Free Assessment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/assessment">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto px-10 py-7 text-base font-medium border-slate-700 hover:bg-slate-800/50 rounded-xl hover:border-slate-600 transition-all duration-300 backdrop-blur-sm text-slate-200"
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
