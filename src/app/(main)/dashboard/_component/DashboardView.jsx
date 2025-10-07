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
  LineChart,
} from "lucide-react";

const featuresCard = [
  {
    icon: <ScrollText className="w-10 h-10 mb-4 text-orange-500" />,
    title: "Smart Resume Creation",
    description: "Generate ATS-optimized resumes with AI assistance.",
    link: "/resume",
  },
  {
    icon: <Briefcase className="w-10 h-10 mb-4 text-orange-500" />,
    title: "Interview Preparation",
    description:
      "Practice with role-specific questions and get instant feedback to improve your performance.",
    link: "/interview",
  },
  {
    icon: <FileText className="w-10 h-10 mb-4 text-orange-500" />,
    title: "Cover Letter Generator",
    description:
      "Craft professional, job-specific cover letters in seconds using AI suggestions.",
    link: "/cover-letter",
  },
  {
    icon: <BrainCircuit className="w-10 h-10 mb-4 text-orange-500" />,
    title: "AI-Powered Career Guidance",
    description:
      "Get personalized career advice and step-by-step roadmaps for your dream role.",
    link: "/roadmap",
  },
  {
    icon: <ClipboardList className="w-10 h-10 mb-4 text-orange-500" />,
    title: "Resume Parser",
    description:
      "Upload your resume and let AI extract key details to enhance your job profile.",
    link: "/resume-parser",
  },
  {
    icon: <LineChart className="w-10 h-10 mb-4 text-orange-500" />,
    title: "Industry Insights",
    description:
      "Stay ahead with real-time industry trends, salary data, and market analysis.",
    link: "/industry-insights",
  },
];

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  const userName = user?.firstName || "User";

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-slate-400">
          Choose a feature to get started with your career journey
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}



const FeatureCard= ({ feature, index, onClick }) => (
  <motion.button
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02 }}
    className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300 overflow-hidden text-left"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-rose-500/0 group-hover:from-orange-500/5 group-hover:to-rose-500/5 transition-all duration-300"></div>

    <div className="relative z-10">
      <div className="group-hover:scale-110 transition-transform duration-300">
        {feature.icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">
        {feature.title}
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed">
        {feature.description}
      </p>
    </div>

    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <svg
        className="w-5 h-5 text-orange-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 8l4 4m0 0l-4 4m4-4H3"
        />
      </svg>
    </div>
  </motion.button>
);
