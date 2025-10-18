// FAQSection.tsx
'use client'

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimatedSection, AnimatedCard, AnimatedText } from "@/components/AnimatedSection";

const FAQSection = () => {
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

  return (
    <section className="py-32 px-6 lg:px-8 relative bg-[#0f0e0a]">
      {/* Subtle amber glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#f59e0b]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/30 to-transparent" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatedSection className="text-center mb-20">
          <AnimatedText>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </AnimatedText>
          <AnimatedText delay={0.2}>
            <p className="text-xl md:text-2xl text-[#b0b0b0] max-w-3xl mx-auto font-light leading-relaxed">
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
                  className="relative border border-[#f59e0b]/20 rounded-2xl px-8 hover:border-[#f59e0b]/40 transition-all duration-300 backdrop-blur-sm bg-[#1a1815]/50 hover:bg-[#1a1815]/70"
                >
                  <AccordionTrigger className="text-left text-white hover:text-[#fbbf24] transition-colors py-6 text-lg font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[#b0b0b0] pb-6 leading-relaxed font-light">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </AnimatedCard>
            ))}
          </Accordion>
        </AnimatedSection>
      </div>
    </section>
  )
}

export default FAQSection