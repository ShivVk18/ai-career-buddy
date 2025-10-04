'use client'

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Spotlight } from "@/components/ui/spotlight";
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
import { GradientText } from "@/components/GradientText";

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
      icon: <Target className="h-8 w-8 text-orange-500" />,
      className: "md:col-span-2",
    },
    {
      title: "Personalized Learning Paths",
      description: "Get customized skill development recommendations based on your career goals.",
      icon: <BookOpen className="h-8 w-8 text-amber-500" />,
    },
    {
      title: "Industry Insights",
      description: "Stay updated with latest trends and requirements in your field.",
      icon: <TrendingUp className="h-8 w-8 text-rose-500" />,
    },
    {
      title: "Goal Tracking",
      description: "Set and monitor your professional milestones with our progress tracking system.",
      icon: <CheckCircle2 className="h-8 w-8 text-emerald-500" />,
    },
    {
      title: "AI-Powered Recommendations",
      description: "Receive intelligent suggestions for your next career moves and skill improvements.",
      icon: <Brain className="h-8 w-8 text-purple-500" />,
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

  const heroWords = "Transform Your Career Journey with AI-Powered Guidance";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20 text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="orange" />
        <Spotlight className="top-10 left-full h-[80vh] w-[50vw]" fill="amber" />
        <Spotlight className="top-28 left-80 h-[80vh] w-[50vw]" fill="rose" />
        
        <SparklesCore
          id="hero-sparkles"
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={100}
          className="absolute inset-0"
          particleColor="#f97316"
        />

        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl"
        />

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/20 backdrop-blur-xl">
              <Star className="h-4 w-4 text-orange-400 mr-2" />
              <span className="text-sm font-medium text-orange-300">AI-Powered Career Platform</span>
              <Trophy className="h-4 w-4 text-rose-400 ml-2" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8"
          >
            <TextGenerateEffect 
              words={heroWords}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Discover your potential, map your path, and accelerate your professional growth with personalized insights and expert guidance
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
          >
            <Link href="/assessment">
              <Button
                size="lg"
                className="px-8 py-6 text-lg bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white border-0 rounded-2xl shadow-2xl transition-all duration-300"
              >
                Start Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link href="/features">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg border-orange-500/30 hover:bg-orange-500/10 rounded-2xl backdrop-blur-xl hover:border-orange-500/50 transition-all duration-300"
              >
                Explore Features
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="flex flex-col items-center gap-4"
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
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </div>
              <span className="text-gray-400 text-sm ml-2">Trusted by 10,000+ professionals</span>
            </div>
          </motion.div>

         
        </div>
      </section>

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
                  transition: { duration: 0.3 }
                }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative glass-dark p-6 rounded-2xl border border-orange-500/10 hover:border-orange-500/30 transition-all duration-500 cursor-pointer backdrop-blur-xl bg-slate-900/50">
                  <div className="flex items-center mb-4">
                    {benefit.icon}
                    <h3 className="text-xl font-semibold ml-3 group-hover:text-orange-400 transition-colors duration-300">
                      {benefit.title}
                    </h3>
                  </div>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {benefit.description}
                  </p>
                </div>
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
            <motion.div 
              className="hidden lg:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-orange-500/30 via-amber-500/30 to-orange-500/30"
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
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-rose-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative glass-dark p-6 rounded-2xl border border-orange-500/10 hover:border-orange-500/30 transition-all duration-500 text-center backdrop-blur-xl bg-slate-900/50">
                    <motion.div 
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                      whileHover={{ scale: 1.2 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-600 to-rose-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-orange-500/50">
                        {step.step}
                      </div>
                    </motion.div>
                    
                    <div className="pt-4">
                      <div className="flex justify-center mb-4">
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-orange-400 transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
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
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <BentoGridItem
                    title={item.title}
                    description={item.description}
                    header={
                      <div className="flex flex-1 w-full h-full min-h-[8rem] rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 items-center justify-center">
                        {item.icon}
                      </div>
                    }
                    className={`${item.className} relative glass-dark border-orange-500/10 hover:border-orange-500/30 transition-all duration-500 cursor-pointer backdrop-blur-xl bg-slate-900/50`}
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
                    className="relative group glass-dark border-orange-500/10 rounded-2xl px-6 md:px-8 hover:border-orange-500/30 transition-all duration-500 backdrop-blur-xl bg-slate-900/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <AccordionTrigger className="relative text-left text-white hover:text-orange-400 transition-colors py-6 text-lg">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="relative text-gray-400 pb-6 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
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
          <div className="max-w-4xl mx-auto text-center">
            <BackgroundGradient className="rounded-3xl max-w-4xl mx-auto p-8 md:p-12 glass-dark backdrop-blur-xl bg-slate-900/50">
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
                    <Button
                      size="lg"
                      className="w-full sm:w-auto px-8 py-4 text-lg bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white border-0 rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300"
                    >
                      Start Free Assessment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/features">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto px-8 py-4 text-lg glass-dark border-orange-500/20 hover:bg-orange-500/10 rounded-2xl hover:border-orange-500/40 transition-all duration-300 backdrop-blur-xl"
                    >
                      Learn More
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </BackgroundGradient>
          </div>
        </AnimatedSection>
      </section>

      <div className="py-12"></div>
    </div>
  );
}