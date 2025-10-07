"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  ScrollText,
  Briefcase,
  FileText,
  BrainCircuit,
  ClipboardList,
  LineChart,
  LayoutDashboard,
  CreditCard,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navigationItems = [
  {
    icon: <LayoutDashboard size={20} />,
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    icon: <ScrollText size={20} />,
    label: "Resume Builder",
    href: "/resume",
  },
  {
    icon: <Briefcase size={20} />,
    label: "Interview Prep",
    href: "/interview",
  },
  {
    icon: <FileText size={20} />,
    label: "Cover Letter",
    href: "/cover-letter",
  },
  {
    icon: <BrainCircuit size={20} />,
    label: "Career Roadmap",
    href: "/roadmap",
  },
  {
    icon: <ClipboardList size={20} />,
    label: "Resume Parser",
    href: "/resume-parser",
  },
  {
    icon: <LineChart size={20} />,
    label: "Industry Insights",
    href: "/industry-insights",
  },
];

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const userName = user?.fullName || "User";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
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

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <motion.aside
      initial={false}
      animate={{
        width: sidebarOpen ? 280 : 80,
      }}
      className="bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col h-screen sticky top-0"
    >
      <div className="border-b border-slate-800">
        {sidebarOpen ? (
          <Logo />
        ) : (
          <div className="flex items-center justify-center py-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500"></div>
          </div>
        )}
      </div>

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-9 bg-slate-800 text-slate-300 p-1 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors z-10"
      >
        {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      <nav className="flex-1 py-6 overflow-y-auto">
        <div className="space-y-1 px-3">
          {navigationItems.map((item, index) => (
            <SidebarLink
              key={index}
              icon={item.icon}
              label={item.label}
              href={item.href}
              open={sidebarOpen}
            />
          ))}
        </div>
      </nav>

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

      <div className="border-t border-slate-800 p-3">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all group"
        >
          <span className="shrink-0 group-hover:text-orange-500 transition-colors">
            <LogOut size={20} />
          </span>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium"
            >
              Logout
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}


const SidebarLink= ({ icon, label, href, open }) => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all group"
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
    </button>
  );
};
