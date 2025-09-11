'use client'

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Target,
  CheckCircle2,
  Brain,
  Rocket,
  Users,
  Zap,
  Globe,
  BookOpen,
  TrendingUp
} from "lucide-react";
import ModernHeroSection from "@/components/HeroSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { howItWorks } from "@/data/howitWorks";
import { AnimatedSection, AnimatedCard, AnimatedText, FloatingElement } from "@/components/AnimatedSection";
import { GradientText } from "@/components/GradientText";

// Animation variants
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

const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export default function LandingPage() {
  const features = [
    {
      title: "Smart Career Assessment",
      description: "Discover your strengths and identify growth opportunities with our comprehensive skills evaluation tool.",
      icon: <Target className="h-8 w-8 text-purple-500" />,
      className: "md:col-span-2",
    },
    {
      title: "Personalized Learning Paths",
      description: "Get customized skill development recommendations based on your career goals.",
      icon: <BookOpen className="h-8 w-8 text-blue-500" />,
    },
    {
      title: "Industry Insights",
      description: "Stay updated with latest trends and requirements in your field.",
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
    },
    {
      title: "Goal Tracking",
      description: "Set and monitor your professional milestones with our progress tracking system.",
      icon: <CheckCircle2 className="h-8 w-8 text-emerald-500" />,
    },
    {
      title: "AI-Powered Recommendations",
      description: "Receive intelligent suggestions for your next career moves and skill improvements.",
      icon: <Brain className="h-8 w-8 text-indigo-500" />,
      className: "md:col-span-2",
    },
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

  const benefits = [
    {
      title: "Clear Direction",
      description: "Stop second-guessing your career choices with data-driven insights",
      icon: <Target className="h-6 w-6 text-blue-400" />
    },
    {
      title: "Skill Development",
      description: "Focus your learning efforts on skills that matter most for your goals",
      icon: <TrendingUp className="h-6 w-6 text-green-400" />
    },
    {
      title: "Stay Competitive",
      description: "Keep up with industry changes and emerging opportunities",
      icon: <Rocket className="h-6 w-6 text-purple-400" />
    },
    {
      title: "Build Confidence",
      description: "Make informed decisions backed by comprehensive analysis",
      icon: <Zap className="h-6 w-6 text-yellow-400" />
    }
  ];

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingElement amplitude={20} duration={8} className="absolute top-1/4 left-1/4">
          <div className="w-2 h-2 bg-blue-400/20 rounded-full blur-sm"></div>
        </FloatingElement>
        <FloatingElement amplitude={15} duration={6} className="absolute top-1/3 right-1/4">
          <div className="w-3 h-3 bg-purple-400/20 rounded-full blur-sm"></div>
        </FloatingElement>
        <FloatingElement amplitude={25} duration={10} className="absolute bottom-1/4 left-1/3">
          <div className="w-1 h-1 bg-pink-400/20 rounded-full blur-sm"></div>
        </FloatingElement>
      </div>

      {/* Hero Section */}
      <AnimatedSection className="relative z-10">
        <ModernHeroSection />
      </AnimatedSection>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <AnimatedText delay={0}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                <GradientText>Why Choose Our Platform?</GradientText>
              </h2>
            </AnimatedText>
            <AnimatedText delay={0.2}>
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                Built for the modern professional who wants to take control of their career journey
              </p>
            </AnimatedText>
          </AnimatedSection>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
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
                  y: -10,
                  scale: 1.05,
                  rotate: [0, 1, -1, 0],
                  transition: { duration: 0.3 }
                }}
                className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-500 cursor-pointer group"
              >
                <motion.div 
                  className="flex items-center mb-4"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {benefit.icon}
                  </motion.div>
                  <h3 className="text-xl font-semibold ml-3 group-hover:text-blue-400 transition-colors duration-300">
                    {benefit.title}
                  </h3>
                </motion.div>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <AnimatedText>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                <GradientText>How It Works</GradientText>
              </h2>
            </AnimatedText>
            <AnimatedText delay={0.2}>
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
                Get started in four simple steps and transform your career prospects
              </p>
            </AnimatedText>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Animated connection lines for desktop */}
            <motion.div 
              className="hidden lg:block absolute top-16 left-1/2 w-3/4 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 to-orange-500 opacity-30 transform -translate-x-1/2"
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
                <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-500 text-center relative z-10 group">
                  {/* Animated step number */}
                  <motion.div 
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div 
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold"
                      variants={pulseVariants}
                      animate="animate"
                    >
                      {step.step}
                    </motion.div>
                  </motion.div>
                  
                  <div className="pt-4">
                    <motion.div 
                      className="flex justify-center mb-4"
                      whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {step.icon}
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-blue-400 transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                      {step.description}
                    </p>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <AnimatedText>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                <GradientText>Powerful Features</GradientText>
              </h2>
            </AnimatedText>
            <AnimatedText delay={0.2}>
              <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
                Everything you need to navigate and accelerate your career development
              </p>
            </AnimatedText>
          </AnimatedSection>

          <AnimatedSection delay={0.2} stagger>
            <BentoGrid className="max-w-5xl mx-auto">
              {features.map((item, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{
                    y: -5,
                    scale: 1.02,
                    transition: { duration: 0.3 }
                  }}
                >
                  <BentoGridItem
                    title={item.title}
                    description={item.description}
                    header={
                      <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 items-center justify-center">
                        <motion.div
                          whileHover={{ 
                            scale: 1.2, 
                            rotate: [0, -10, 10, 0] 
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          {item.icon}
                        </motion.div>
                      </div>
                    }
                    className={`${item.className} glass-dark border-white/10 hover:border-white/30 transition-all duration-500 group cursor-pointer`}
                    icon={item.icon}
                  />
                </motion.div>
              ))}
            </BentoGrid>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <AnimatedText>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                <GradientText>Frequently Asked Questions</GradientText>
              </h2>
            </AnimatedText>
            <AnimatedText delay={0.2}>
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
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
                    className="glass-dark border-white/10 rounded-2xl px-6 md:px-8 hover:border-white/30 transition-all duration-500 group"
                  >
                    <AccordionTrigger className="text-left text-white hover:text-blue-400 transition-colors py-6 text-lg group-hover:scale-[1.01] transition-transform duration-300">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-400 pb-6 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
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
      <section className="py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative">
        <AnimatedSection>
          <motion.div
            className="max-w-4xl mx-auto text-center"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <BackgroundGradient className="rounded-3xl max-w-4xl mx-auto p-8 md:p-12 glass-dark">
              <div className="space-y-8">
                <div className="space-y-6">
                  <AnimatedText>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                      <GradientText>Ready to Take Control of Your Career?</GradientText>
                    </h2>
                  </AnimatedText>
                  <AnimatedText delay={0.2}>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                      Start your journey today with our free career assessment and discover your potential
                    </p>
                  </AnimatedText>
                </div>
                
                <motion.div 
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Link href="/assessment">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        size="lg"
                        className="w-full sm:w-auto px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group text-white border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
                      >
                        Start Free Assessment
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </motion.div>
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/features">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto px-8 py-4 text-lg glass-dark border-white/20 hover:bg-white/10 rounded-2xl hover:border-white/40 transition-all duration-300"
                      >
                        Learn More
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            </BackgroundGradient>
          </motion.div>
        </AnimatedSection>
      </section>

      <div className="py-12"></div>
    </div>
  );
}