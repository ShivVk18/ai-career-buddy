"use client";

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  ScrollText,
  Briefcase,
  FileText,
  BrainCircuit,
  ClipboardList,
  LayoutDashboard,
  CreditCard,
  LogOut,
} from "lucide-react";

export default function SideNavbar() {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const userName = user?.fullName || "User";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";
  const creditsRemaining = 150;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <LayoutDashboard className="h-5 w-5 shrink-0 text-[#b0b0b0] group-hover:text-[#f59e0b] transition-colors" />
      ),
    },
    {
      label: "Resume Builder",
      href: "/resume",
      icon: (
        <ScrollText className="h-5 w-5 shrink-0 text-[#b0b0b0] group-hover:text-[#f59e0b] transition-colors" />
      ),
    },
    {
      label: "Interview Prep",
      href: "/interview",
      icon: (
        <Briefcase className="h-5 w-5 shrink-0 text-[#b0b0b0] group-hover:text-[#f59e0b] transition-colors" />
      ),
    },
    {
      label: "Cover Letter",
      href: "/cover-letter",
      icon: (
        <FileText className="h-5 w-5 shrink-0 text-[#b0b0b0] group-hover:text-[#f59e0b] transition-colors" />
      ),
    },
    {
      label: "Cold Email",
      href: "/cold-email",
      icon: (
        <FileText className="h-5 w-5 shrink-0 text-[#b0b0b0] group-hover:text-[#f59e0b] transition-colors" />
      ),
    },
    {
      label: "Career Roadmap",
      href: "/roadmap",
      icon: (
        <BrainCircuit className="h-5 w-5 shrink-0 text-[#b0b0b0] group-hover:text-[#f59e0b] transition-colors" />
      ),
    },
    {
      label: "Resume Parser",
      href: "/resume-parser",
      icon: (
        <ClipboardList className="h-5 w-5 shrink-0 text-[#b0b0b0] group-hover:text-[#f59e0b] transition-colors" />
      ),
    },
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10 bg-gradient-to-br from-[#1a1815]/95 via-[#252218]/90 to-[#1a1815]/95 backdrop-blur-xl border-r border-[#f59e0b]/20">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/50 to-transparent" />
        
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>

        {/* Credits Section */}
        <div className={`border-t border-[#f59e0b]/20 pt-4 ${open ? 'px-2' : 'px-1'}`}>
          <div className="relative rounded-xl overflow-hidden border border-[#f59e0b]/20 bg-gradient-to-br from-[#1a1815]/80 via-[#252218]/60 to-[#1a1815]/80 p-3 mb-4">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/50 to-transparent" />
            <div className={`flex items-center ${open ? 'gap-3' : 'justify-center'} relative z-10`}>
              <CreditCard className="text-[#f59e0b] shrink-0" size={20} />
              {open && (
                <div>
                  <p className="text-xs text-[#b0b0b0]">Credits</p>
                  <p className="text-lg font-bold bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] bg-clip-text text-transparent">
                    {creditsRemaining}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User Profile */}
          <div className={`flex items-center ${open ? 'gap-3 mb-3' : 'justify-center mb-3'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] flex items-center justify-center text-black font-semibold shrink-0">
              {userName.charAt(0)}
            </div>
            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userName}
                </p>
                <p className="text-xs text-[#b0b0b0] truncate">{userEmail}</p>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center ${open ? 'gap-3 px-3' : 'justify-center px-2'} py-2.5 rounded-lg text-[#b0b0b0] hover:bg-[#252218]/50 hover:text-white transition-all group border-t border-[#f59e0b]/20 pt-3`}
          >
            <span className="shrink-0 group-hover:text-[#f59e0b] transition-colors">
              <LogOut size={20} />
            </span>
            {open && (
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
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal px-2"
    >
      <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#fbbf24]" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-lg whitespace-pre text-white"
      >
        AscendAI
      </motion.span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a
      href="/dashboard"
      className="relative z-20 flex items-center justify-center py-1 text-sm font-normal"
    >
      <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#fbbf24]" />
    </a>
  );
};