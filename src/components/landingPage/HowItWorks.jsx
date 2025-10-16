'use client'

import React from "react";

import { motion } from "framer-motion";


import { howItWorks } from "@/data/howitWorks";
import { AnimatedSection, AnimatedCard, AnimatedText } from "@/components/AnimatedSection";   




const HowItWorks = () => {
  return (
    <section className="py-32 px-6 lg:px-8 relative z-10 bg-slate-900/30">
            <div className="max-w-7xl mx-auto">
              <AnimatedSection className="text-center mb-24">
                <AnimatedText>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white tracking-tight">
                    How It Works
                  </h2>
                </AnimatedText>
                <AnimatedText delay={0.2}>
                  <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
                    Get started in four simple steps and transform your career prospects
                  </p>
                </AnimatedText>
              </AnimatedSection>
    
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                <motion.div 
                  className="hidden lg:block absolute top-20 left-1/4 right-1/4 h-px bg-slate-800"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  viewport={{ once: true }}
                ></motion.div>
                
                {howItWorks.map((step, index) => (
                  <AnimatedCard
                    key={index}
                    delay={index * 0.15}
                    className="relative"
                  >
                    <div className="relative group">
                      <div className="relative p-8 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300 text-center backdrop-blur-sm bg-slate-900/50">
                        <motion.div 
                          className="absolute -top-5 left-1/2 transform -translate-x-1/2"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-orange-600/30">
                            {step.step}
                          </div>
                        </motion.div>
                        
                        <div className="pt-6">
                          <div className="flex justify-center mb-6">
                            <div className="p-3 rounded-xl bg-slate-800/50 group-hover:bg-slate-800 transition-colors duration-300">
                              {step.icon}
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold mb-4 text-white">
                            {step.title}
                          </h3>
                          <p className="text-slate-400 leading-relaxed font-light">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AnimatedCard>
                ))}
              </div>
            </div>
          </section>
  )
}

export default HowItWorks