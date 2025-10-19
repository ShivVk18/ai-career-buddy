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
    icon: <ScrollText className="w-12 h-12 text-[#f59e0b]" />,
    title: "Smart Resume Creation",
    description: "Generate ATS-optimized resumes with AI assistance.",
    link: "/resume",
  },
  {
    icon: <Briefcase className="w-12 h-12 text-[#f59e0b]" />,
    title: "Interview Preparation",
    description:
      "Practice with role-specific questions and get instant feedback to improve your performance.",
    link: "/interview",
  },
  {
    icon: <FileText className="w-12 h-12 text-[#f59e0b]" />,
    title: "Cover Letter Generator",
    description:
      "Craft professional, job-specific cover letters in seconds using AI suggestions.",
    link: "/cover-letter",
  },
  {
    icon: <BrainCircuit className="w-12 h-12 text-[#f59e0b]" />,
    title: "AI-Powered Career Guidance",
    description:
      "Get personalized career advice and step-by-step roadmaps for your dream role.",
    link: "/roadmap",
  },
  {
    icon: <ClipboardList className="w-12 h-12 text-[#f59e0b]" />,
    title: "Resume Parser",
    description:
      "Upload your resume and let AI extract key details to enhance your job profile.",
    link: "/resume-parser",
  },
  {
    icon: <FileText className="w-12 h-12 text-[#f59e0b]" />,
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
    <div className="min-h-screen bg-[#0f0e0a] relative">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 -left-32 w-96 h-96 bg-[#f59e0b]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 -right-32 w-96 h-96 bg-[#fbbf24]/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 lg:px-8 py-16 relative z-10">
        

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
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02, y: -4 }}
    className="group relative rounded-2xl overflow-hidden border border-[#f59e0b]/20 bg-gradient-to-br from-[#1a1815]/80 via-[#252218]/60 to-[#1a1815]/80 backdrop-blur-xl shadow-xl shadow-[#f59e0b]/5 hover:shadow-2xl hover:shadow-[#f59e0b]/10 transition-all duration-300 text-left"
  >
    {/* Top gradient accent */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/50 to-transparent" />
    
    {/* Glow effect on hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-[#f59e0b]/5 to-transparent" />
    </div>

    <div className="relative z-10 p-8">
      <div className="group-hover:scale-110 transition-transform duration-300 mb-6">
        {feature.icon}
      </div>
      <h3 className="text-2xl font-semibold text-white mb-3 group-hover:text-[#fbbf24] transition-colors">
        {feature.title}
      </h3>
      <p className="text-[#b0b0b0] text-base leading-relaxed">
        {feature.description}
      </p>
    </div>
  </motion.button>
);