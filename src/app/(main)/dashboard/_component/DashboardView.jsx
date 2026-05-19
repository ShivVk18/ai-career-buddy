'use client'

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export const dynamic = "force-dynamic";
import {
  ScrollText,
  Briefcase,
  FileText,
  BrainCircuit,
  ClipboardList,
  Mail,
} from "lucide-react";

const featuresCard = [
  {
    icon: <ScrollText className="w-8 h-8 text-accent" />,
    title: "Smart Resume Builder",
    description:
      "Create ATS-optimized resumes tailored to any job in minutes. Let AI do the heavy lifting.",
    link: "/resume",
  },
  {
    icon: <Briefcase className="w-8 h-8 text-accent" />,
    title: "Interview Prep",
    description:
      "Practice with role-specific questions and get instant AI feedback to sharpen your answers.",
    link: "/interview",
  },
  {
    icon: <FileText className="w-8 h-8 text-accent" />,
    title: "Cover Letter Generator",
    description:
      "Write compelling, personalized cover letters for any role in seconds — no blank-page stress.",
    link: "/cover-letter",
  },
  {
    icon: <BrainCircuit className="w-8 h-8 text-accent" />,
    title: "Career Roadmap",
    description:
      "Get a step-by-step AI-powered plan to move from where you are to where you want to be.",
    link: "/roadmap",
  },
  {
    icon: <ClipboardList className="w-8 h-8 text-accent" />,
    title: "Resume Parser & ATS Score",
    description:
      "Upload your resume and instantly see how it scores against job descriptions.",
    link: "/resume-parser",
  },
  {
    icon: <Mail className="w-8 h-8 text-accent" />,
    title: "Cold Email Generator",
    description:
      "Craft professional outreach emails that get responses — personalized to every opportunity.",
    link: "/cold-email",
  },
];

import Loader from "@/components/Loader";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return <Loader />;
  }

  const userName = user?.firstName || "Friend";

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="container mx-auto px-6 lg:px-8 py-16 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 border-b border-divider pb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-[1px] bg-accent" />
            <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
              Your Career HQ
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-clash font-bold text-foreground uppercase tracking-tight leading-none">
            Hey, <span className="text-accent">{userName} 👋</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground font-light max-w-2xl leading-relaxed">
            What would you like to work on today? Pick a tool and let your AI career coach take it from here.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {featuresCard.map((feature, idx) => (
            <FeatureCard
              key={idx}
              feature={feature}
              index={idx}
              onClick={() => router.push(feature.link)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({ feature, index, onClick }) => (
  <motion.button
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.5 }}
    className="group relative flex flex-col justify-between text-left p-8 rounded-sm border border-border bg-background hover:bg-divider/20 hover:border-accent transition-editorial overflow-hidden"
  >
    <div className="relative z-10">
      <div className="mb-8 p-3 w-fit border border-divider rounded-sm group-hover:border-accent transition-editorial bg-divider/10">
        {feature.icon}
      </div>
      <h3 className="text-xl font-clash font-bold text-foreground mb-4 uppercase tracking-tight group-hover:text-accent transition-editorial">
        {feature.title}
      </h3>
      <p className="text-muted-foreground text-sm font-general font-light leading-relaxed">
        {feature.description}
      </p>
    </div>

    {/* Bottom accent line */}
    <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-accent group-hover:w-full transition-all duration-500" />
  </motion.button>
);