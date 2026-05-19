// FAQSection.jsx
'use client'

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const FAQSection = () => {
  const faqs = [
    {
      question: "How does the career assessment work?",
      answer:
        "Our AI evaluates your current skills, experience, and goals through a short set of questions. It then gives you personalized insights — highlighting your strengths, pinpointing gaps, and suggesting a clear next step.",
    },
    {
      question: "What makes AscendAI different from other career platforms?",
      answer:
        "Most tools do one thing. AscendAI does it all — resume building, interview prep, cover letters, cold emails, ATS scoring, and career roadmaps — all powered by the same AI that understands your unique profile.",
    },
    {
      question: "Is it free to get started?",
      answer:
        "Yes! You can start using AscendAI for free right away. No credit card needed. Premium features are available if you want to go deeper with advanced AI tools.",
    },
    {
      question: "How up-to-date is the career advice?",
      answer:
        "Our AI is continuously trained on current job market data, real hiring trends, and industry shifts — so the advice you get is relevant to today's job market, not last year's.",
    },
    {
      question: "Can I use this if I'm just starting my career?",
      answer:
        "Absolutely. AscendAI is built for everyone — whether you're a fresh graduate looking for your first role, a mid-career professional making a pivot, or a senior leader aiming for the next level.",
    },
    {
      question: "Will the AI actually help me get more interviews?",
      answer:
        "Yes — and that's the whole point. Our resume builder is ATS-optimized, our cold email generator gets responses, and our interview prep builds real confidence. Thousands of users have used AscendAI to land interviews at top companies.",
    },
  ];

  return (
    <section className="py-32 px-6 md:px-12 relative bg-background">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-divider opacity-30" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-[1px] bg-accent" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
              Common Questions
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-clash font-bold text-foreground uppercase tracking-tight mb-6">
            Got questions? <br />
            <span className="text-accent">We've got answers.</span>
          </h2>
          <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl">
            Everything you need to know before you get started.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <AccordionItem
                value={`item-${index}`}
                className="border border-border bg-background px-8 rounded-sm transition-editorial hover:border-accent"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-accent transition-colors py-8 text-lg font-clash font-bold uppercase tracking-tight">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-8 leading-relaxed font-general font-light text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-divider opacity-30" />
    </section>
  );
};

export default FAQSection;