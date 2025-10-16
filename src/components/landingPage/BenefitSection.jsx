'use client'

import React from "react";
import { motion } from "framer-motion";
import {
 
  Target,
  
  Rocket,
  Zap,
 
  TrendingUp,
 
} from "lucide-react";


import { AnimatedSection, AnimatedText } from "@/components/AnimatedSection";

const BenefitSection = () => { 

    const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.25, 0.25, 0.75]
    }
  }
}
 const benefits = [
    {
      title: "Clear Direction",
      description: "Stop second-guessing your career choices with data-driven insights",
      icon: <Target className="h-6 w-6 text-orange-400" />
    },
    {
      title: "Skill Development",
      description: "Focus your learning efforts on skills that matter most for your goals",
      icon: <TrendingUp className="h-6 w-6 text-amber-400" />
    },
    {
      title: "Stay Competitive",
      description: "Keep up with industry changes and emerging opportunities",
      icon: <Rocket className="h-6 w-6 text-rose-400" />
    },
    {
      title: "Build Confidence",
      description: "Make informed decisions backed by comprehensive analysis",
      icon: <Zap className="h-6 w-6 text-yellow-400" />
    }
  ];
  
  return (
 <section className="py-32 px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-24">
            <AnimatedText delay={0}>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white tracking-tight">
                Why Choose Our Platform?
              </h2>
            </AnimatedText>
            <AnimatedText delay={0.2}>
              <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
                Built for the modern professional who wants to take control of their career journey
              </p>
            </AnimatedText>
          </AnimatedSection>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.3 }
                }}
                className="relative group"
              >
                <div className="relative p-8 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-300 cursor-pointer backdrop-blur-sm bg-slate-900/50 h-full">
                  <div className="flex items-start mb-6">
                    <div className="p-3 rounded-xl bg-slate-800/50 group-hover:bg-slate-800 transition-colors duration-300">
                      {benefit.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-white group-hover:text-orange-400 transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed font-light">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
  )
}

export default BenefitSection