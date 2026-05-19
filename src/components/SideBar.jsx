// SideBar.jsx
"use client";

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
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
  Mail,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function SideNavbar() {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();

  const userName = user?.fullName || "User";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <LayoutDashboard className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-accent transition-editorial" />
      ),
    },
    {
      label: "Resume Builder",
      href: "/resume",
      icon: (
        <ScrollText className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-accent transition-editorial" />
      ),
    },
    {
      label: "Interview Prep",
      href: "/interview",
      icon: (
        <Briefcase className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-accent transition-editorial" />
      ),
    },
    {
      label: "Cover Letter",
      href: "/cover-letter",
      icon: (
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-accent transition-editorial" />
      ),
    },
    {
      label: "Cold Email",
      href: "/cold-email",
      icon: (
        <Mail className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-accent transition-editorial" />
      ),
    },
    {
      label: "Career Roadmap",
      href: "/roadmap",
      icon: (
        <BrainCircuit className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-accent transition-editorial" />
      ),
    },
    {
      label: "Resume Parser",
      href: "/resume-parser",
      icon: (
        <ClipboardList className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-accent transition-editorial" />
      ),
    },
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10 bg-background border-r border-border py-8">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-12 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink
                key={idx}
                link={link}
                className="hover:bg-divider/50 rounded-sm transition-editorial px-4 py-3"
              />
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className={`mt-auto border-t border-divider pt-6 ${open ? "px-4" : "px-2"}`}>


          {/* Theme toggle + user profile row */}
          <div className={`flex items-center mb-6 ${open ? "gap-4" : "flex-col gap-3 justify-center"}`}>
            {!isLoaded ? (
              <div className="w-10 h-10 rounded-sm bg-divider animate-pulse shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-sm bg-accent flex items-center justify-center text-accent-foreground font-bold shrink-0 text-sm shadow-sm transition-editorial">
                {userName.charAt(0)}
              </div>
            )}
            
            {open && (
              <div className="flex-1 min-w-0">
                {!isLoaded ? (
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-divider animate-pulse rounded-sm" />
                    <div className="h-3 w-32 bg-divider animate-pulse rounded-sm" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-clash font-bold text-foreground truncate uppercase tracking-tight">
                      {userName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest leading-none mt-1">
                      {userEmail}
                    </p>
                  </>
                )}
              </div>
            )}
            <ThemeToggle />
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center ${
              open ? "gap-3 px-4" : "justify-center"
            } py-3 rounded-sm text-muted-foreground hover:bg-border/20 hover:text-foreground transition-editorial group border-t border-divider pt-6`}
          >
            <span className="shrink-0 group-hover:text-accent transition-editorial">
              <LogOut size={18} />
            </span>
            {open && (
              <span className="text-xs font-bold tracking-widest uppercase">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <a href="/dashboard" className="relative z-20 flex items-center space-x-3 py-2 px-4">
      <div className="h-2 w-2 rounded-full bg-accent" />
      <span className="font-clash font-bold text-xl uppercase tracking-tighter text-foreground">
        AscendAI
      </span>
    </a>
  );
};

export const LogoIcon = () => {
  return (
    <a href="/dashboard" className="relative z-20 flex items-center justify-center py-2">
      <div className="h-4 w-4 rounded-full bg-accent" />
    </a>
  );
};