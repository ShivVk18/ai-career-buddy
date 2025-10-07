"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ScrollText,
  Briefcase,
  FileText,
  BrainCircuit,
  ClipboardList,
  LineChart,
  LayoutDashboard,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
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

const DashboardView = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Mock user data - replace with actual Clerk data
  const userName = "John Doe";
  const userEmail = "john@example.com";
  const creditsRemaining = 150;

  const Logo = () => (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500"></div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg font-bold text-white"
      >
        CareerAI
      </motion.span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? 280 : 80,
          }}
          className="bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col"
        >
          {/* Logo */}
          <div className="border-b border-slate-800">
            {sidebarOpen ? (
              <Logo />
            ) : (
              <div className="flex items-center justify-center py-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500"></div>
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-9 bg-slate-800 text-slate-300 p-1 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          {/* Navigation */}
          <nav className="flex-1 py-6">
            <div className="space-y-1 px-3">
              <SidebarLink
                icon={<LayoutDashboard size={20} />}
                label="Dashboard"
                href="#"
                open={sidebarOpen}
              />
            </div>
          </nav>

          {/* Credits Display */}
          <div className="border-t border-slate-800 p-4">
            <div className="bg-gradient-to-br from-orange-500/10 to-rose-500/10 rounded-lg p-3 border border-orange-500/20">
              <div className="flex items-center gap-3">
                <CreditCard className="text-orange-500 shrink-0" size={20} />
                {sidebarOpen && (
                  <div>
                    <p className="text-xs text-slate-400">Credits</p>
                    <p className="text-lg font-bold text-white">
                      {creditsRemaining}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white font-semibold shrink-0">
                {userName.charAt(0)}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                </div>
              )}
            </div>
          </div>

          {/* Logout */}
          <div className="border-t border-slate-800 p-3">
            <SidebarLink
              icon={<LogOut size={20} />}
              label="Logout"
              href="#"
              open={sidebarOpen}
            />
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {userName.split(" ")[0]}!
              </h1>
              <p className="text-slate-400">
                Choose a feature to get started with your career journey
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuresCard.map((feature, idx) => (
                <FeatureCard key={idx} feature={feature} index={idx} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarLink = ({ icon, label, href, open }) => (
  <a
    href={href}
    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all group"
  >
    <span className="shrink-0 group-hover:text-orange-500 transition-colors">
      {icon}
    </span>
    {open && (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm font-medium"
      >
        {label}
      </motion.span>
    )}
  </a>
);

const FeatureCard = ({ feature, index }) => (
  <motion.a
    href={feature.link}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02 }}
    className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300 overflow-hidden"
  >
    {/* Gradient Overlay on Hover */}
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

    {/* Arrow indicator */}
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
  </motion.a>
);

export default DashboardView;