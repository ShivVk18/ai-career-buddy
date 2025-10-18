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
    icon: <ScrollText className="w-10 h-10 mb-4 text-[#ff8c42]" />,
    title: "Smart Resume Creation",
    description: "Generate ATS-optimized resumes with AI assistance.",
    link: "/resume",
  },
  {
    icon: <Briefcase className="w-10 h-10 mb-4 text-[#ff8c42]" />,
    title: "Interview Preparation",
    description:
      "Practice with role-specific questions and get instant feedback to improve your performance.",
    link: "/interview",
  },
  {
    icon: <FileText className="w-10 h-10 mb-4 text-[#ff8c42]" />,
    title: "Cover Letter Generator",
    description:
      "Craft professional, job-specific cover letters in seconds using AI suggestions.",
    link: "/cover-letter",
  },
  {
    icon: <BrainCircuit className="w-10 h-10 mb-4 text-[#ff8c42]" />,
    title: "AI-Powered Career Guidance",
    description:
      "Get personalized career advice and step-by-step roadmaps for your dream role.",
    link: "/roadmap",
  },
  {
    icon: <ClipboardList className="w-10 h-10 mb-4 text-[#ff8c42]" />,
    title: "Resume Parser",
    description:
      "Upload your resume and let AI extract key details to enhance your job profile.",
    link: "/resume-parser",
  },
  {
    icon: <FileText className="w-10 h-10 mb-4 text-[#ff8c42]" />,
    title: "Cold Email Generator",
    description:
      "Craft professional, job-specific cover email in seconds using AI suggestions.",
    link: "/cold-email",
  },
];

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();

  const userName = user?.firstName || "User";

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#fff4ed] mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-[#c4a893]">
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

const FeatureCard = ({ feature, index, onClick }) => (
  <motion.button
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02 }}
    className="group relative bg-[#312214]/60 backdrop-blur-sm border border-[#ffa36c]/20 rounded-xl p-6 hover:border-[#ff8c42]/50 transition-all duration-300 overflow-hidden text-left"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#ff5e00]/0 to-[#ff8c42]/0 group-hover:from-[#ff5e00]/5 group-hover:to-[#ff8c42]/5 transition-all duration-300"></div>

    <div className="relative z-10">
      <div className="group-hover:scale-110 transition-transform duration-300">
        {feature.icon}
      </div>
      <h3 className="text-xl font-semibold text-[#fff4ed] mb-2 group-hover:text-[#ff8c42] transition-colors">
        {feature.title}
      </h3>
      <p className="text-[#c4a893] text-sm leading-relaxed">
        {feature.description}
      </p>
    </div>

    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <svg
        className="w-5 h-5 text-[#ff8c42]"
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