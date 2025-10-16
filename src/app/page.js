'use client'

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { SparklesCore } from "@/components/ui/sparkles";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Target,
  CheckCircle2,
  Brain,
  Rocket,
  Zap,
  BookOpen,
  TrendingUp,
  Star,
  Trophy,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { howItWorks } from "@/data/howitWorks";
import { AnimatedSection, AnimatedCard, AnimatedText } from "@/components/AnimatedSection";
import Header from "@/components/Header";
import { BentoGridAISection } from "@/components/FeatureSections";

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

export default function LandingPage() {
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

  const testimonialUsers = [
    { id: 1, name: "Sarah M.", designation: "Software Engineer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
    { id: 2, name: "John D.", designation: "Product Manager", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
    { id: 3, name: "Emma W.", designation: "UX Designer", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma" },
    { id: 4, name: "Mike R.", designation: "Data Analyst", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" },
  ];

  const faqs = [
    {
      question: "How does the career assessment work?",
      answer: "Our assessment evaluates your current skills, experience, and interests through a series of questions and exercises. It then provides insights into potential career paths and areas for development."
    },
    {
      question: "What makes this different from other career platforms?",
      answer: "We focus on personalized guidance using AI to analyze industry trends and match them with your unique profile. Our approach is data-driven yet human-centered."
    },
    {
      question: "Do I need to pay to get started?",
      answer: "You can begin with our free tier that includes basic assessments and recommendations. Premium features are available for users who want more detailed insights and advanced tools."
    },
    {
      question: "How often is the content updated?",
      answer: "We continuously update our database with the latest industry trends, job market insights, and skill requirements to ensure you receive current and relevant guidance."
    },
    {
      question: "Can I use this if I'm just starting my career?",
      answer: "Absolutely! Our platform is designed for professionals at all stages - from students and recent graduates to experienced professionals looking to pivot or advance."
    }
  ];

  const heroWords = "Transform Your Career Journey with AI-Powered Guidance";

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      <Header/>
      
      {/* Hero Section */}
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

      {/* Benefits Section */}
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

      {/* How It Works Section */}
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

      {/* Features Section */}
      <section className="py-32 px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-24">
            <AnimatedText>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white tracking-tight">
                Powerful Features
              </h2>
            </AnimatedText>
            <AnimatedText delay={0.2}>
              <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
                Everything you need to navigate and accelerate your career development
              </p>
            </AnimatedText>
          </AnimatedSection>

          <AnimatedSection delay={0.2} stagger>
              <BentoGridAISection/>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 lg:px-8 relative bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-24">
            <AnimatedText>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white tracking-tight">
                Frequently Asked Questions
              </h2>
            </AnimatedText>
            <AnimatedText delay={0.2}>
              <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
                Everything you need to know about getting started
              </p>
            </AnimatedText>
          </AnimatedSection>

          <AnimatedSection>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AnimatedCard key={index} delay={index * 0.1}>
                  <AccordionItem 
                    value={`item-${index}`}
                    className="relative border-slate-800 rounded-xl px-8 hover:border-slate-700 transition-all duration-300 backdrop-blur-sm bg-slate-900/50"
                  >
                    <AccordionTrigger className="text-left text-white hover:text-orange-400 transition-colors py-6 text-lg font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-400 pb-6 leading-relaxed font-light">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </AnimatedCard>
              ))}
            </Accordion>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 lg:px-8 relative">
        <AnimatedSection>
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden">
              {/* Subtle gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-slate-900 to-slate-900"></div>
              
              {/* Border effect */}
              <div className="absolute inset-0 rounded-3xl" style={{
                background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(249, 115, 22, 0) 50%, rgba(249, 115, 22, 0.2) 100%)',
                padding: '1px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude'
              }}></div>

              <div className="relative px-8 py-16 md:px-16 md:py-24 text-center">
                <div className="space-y-10">
                  <div className="space-y-6">
                    <AnimatedText>
                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                        Ready to Take Control<br />of Your Career?
                      </h2>
                    </AnimatedText>
                    <AnimatedText delay={0.2}>
                      <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Start your journey today with our free career assessment and discover your potential
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
                    <Link href="/features">
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

      <footer className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-6 text-center text-slate-400">
          <p className="font-light">Made with Efforts</p>
        </div>
      </footer>
    </div>
  );
}