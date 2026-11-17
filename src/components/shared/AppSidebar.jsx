"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Home,
  Briefcase,
  FileText,
  MessageSquare,
  Sparkles,
  User,
  LogOut,
  ScrollText,
  Mail,
  BrainCircuit,
  ClipboardCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import ChatSlideOver from "../chat/ChatSlideOver";

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNav = [
    { label: "home", href: "/dashboard", icon: Home },
    { label: "applications", href: "/dashboard#applications", icon: Briefcase },
    { label: "chat with pip", href: "/chat", icon: MessageSquare, badge: "ai" },
    { label: "profile", href: "/onboarding", icon: User },
  ];

  const tools = [
    { label: "resume builder", href: "/resume", icon: ScrollText },
    { label: "ats checker", href: "/resume-parser", icon: ClipboardCheck },
    { label: "interview prep", href: "/interview", icon: Sparkles },
    { label: "cover letter", href: "/cover-letter", icon: FileText },
    { label: "cold email", href: "/cold-email", icon: Mail },
    { label: "career roadmap", href: "/roadmap", icon: BrainCircuit },
  ];

  const previews = [
    { label: "interview prep", href: "/tools/interview", icon: Sparkles },
    { label: "career roadmap", href: "/tools/roadmap", icon: BrainCircuit },
  ];

  return (
    <>
      {/* Desktop Left Sidebar (hidden on mobile < 768px) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#ECEAE4] h-screen sticky top-0 shrink-0 select-none z-30">
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#ECEAE4] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-pip-soft flex items-center justify-center p-1 pip-hop">
              <Image
                src="/pip/pip-coffee.svg"
                alt="pip"
                width={26}
                height={26}
                style={{ imageRendering: "pixelated" }}
                unoptimized
              />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-text block leading-none">
                ascendai
              </span>
              <span className="font-pixel text-[10px] text-pip-ink">
                with pip
              </span>
            </div>
          </Link>

          <button
            onClick={() => setChatOpen(true)}
            className="w-8 h-8 rounded-full bg-[#FBFAF7] border border-[#ECEAE4] hover:border-pip flex items-center justify-center text-text hover:text-pip transition shadow-2xs"
            title="quick chat with pip"
          >
            <Sparkles className="w-4 h-4 text-pip" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Main Links */}
          <div className="space-y-1">
            <span className="font-pixel text-[10px] uppercase text-muted tracking-wider px-2.5 block mb-1">
              overview
            </span>
            {mainNav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                    active
                      ? "bg-pip-soft text-pip-ink font-semibold"
                      : "text-[#6D6B75] hover:text-[#23222B] hover:bg-[#F4F2EC]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? "text-pip" : "text-[#A8A6AE]"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="font-pixel text-[9px] bg-pip text-white px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Tools Group (All 6, real routes) */}
          <div className="space-y-1">
            <span className="font-pixel text-[10px] uppercase text-muted tracking-wider px-2.5 block mb-1">
              tools (six tools. one pip.)
            </span>
            {tools.map((t) => {
              const active = pathname === t.href || pathname.startsWith(t.href + "/");
              const Icon = t.icon;
              return (
                <Link
                  key={t.label}
                  href={t.href}
                  className={`flex items-center px-3 py-2 rounded-xl text-xs font-medium transition group ${
                    active
                      ? "bg-pip-soft text-pip-ink font-semibold"
                      : "text-[#6D6B75] hover:text-[#23222B] hover:bg-[#F4F2EC]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? "text-pip" : "text-[#A8A6AE] group-hover:text-text"}`} />
                    <span>{t.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Previews (sample data) */}
          <div className="space-y-1">
            <span className="font-pixel text-[10px] uppercase text-muted tracking-wider px-2.5 block mb-1">
              previews (sample data)
            </span>
            {previews.map((t) => {
              const active = pathname === t.href || pathname.startsWith(t.href + "/");
              const Icon = t.icon;
              return (
                <Link
                  key={t.label}
                  href={t.href}
                  className={`flex items-center px-3 py-1.5 rounded-xl text-[11px] font-medium transition group ${
                    active
                      ? "bg-pip-soft text-pip-ink font-semibold"
                      : "text-[#8C8A93] hover:text-[#23222B] hover:bg-[#F4F2EC]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-[#A8A6AE]" />
                    <span>{t.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer / User card */}
        <div className="p-3.5 border-t border-[#ECEAE4] bg-[#FBFAF7]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#E3F4EC] border border-pip/30 flex items-center justify-center text-xs font-semibold text-pip-ink shrink-0">
                {user?.firstName?.[0] || "A"}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-medium text-text truncate block leading-tight">
                  {user?.fullName || "your account"}
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="p-1.5 text-muted hover:text-text hover:bg-[#ECEAE4] rounded-lg transition"
              title="sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden h-14 bg-white border-b border-[#ECEAE4] px-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-pip-soft flex items-center justify-center p-0.5">
            <Image
              src="/pip/pip-coffee.svg"
              alt="pip"
              width={22}
              height={22}
              style={{ imageRendering: "pixelated" }}
              unoptimized
            />
          </div>
          <span className="font-semibold text-sm text-text">ascendai</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(true)}
            className="btn-pill-pip text-xs py-1 px-3 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" /> ask pip
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-muted hover:text-text rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bg-white border-b border-[#ECEAE4] shadow-lg p-4 z-40 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {tools.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl border border-[#ECEAE4] text-xs font-medium hover:border-pip text-text flex items-center gap-2"
              >
                <t.icon className="w-4 h-4 text-pip" />
                <span>{t.label}</span>
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t border-[#ECEAE4]">
            <span className="font-pixel text-[10px] uppercase text-muted block mb-1.5">previews (sample data)</span>
            <div className="grid grid-cols-2 gap-1.5">
              {previews.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#ECEAE4] text-[11px] text-muted hover:border-pip"
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-[#ECEAE4] flex justify-between items-center text-xs text-muted">
            <span>logged in as {user?.firstName || "candidate"}</span>
            <button onClick={() => signOut()} className="text-pip font-medium">sign out</button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar (under 768px) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#ECEAE4] flex items-center justify-around z-40 px-2">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 text-[10px] font-sans ${
            pathname === "/dashboard" ? "text-pip font-semibold" : "text-muted"
          }`}
        >
          <Home className="w-4 h-4" />
          <span>home</span>
        </Link>
        <Link
          href="/resume"
          className={`flex flex-col items-center gap-1 text-[10px] font-sans ${
            pathname.includes("/resume") ? "text-pip font-semibold" : "text-muted"
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>resume</span>
        </Link>
        <button
          onClick={() => setChatOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-sans text-pip font-medium -mt-3"
        >
          <div className="w-10 h-10 rounded-full bg-pip text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-pastel-lemon" />
          </div>
          <span>pip</span>
        </button>
        <Link
          href="/interview"
          className={`flex flex-col items-center gap-1 text-[10px] font-sans ${
            pathname.includes("/interview") ? "text-pip font-semibold" : "text-muted"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>interview</span>
        </Link>
        <Link
          href="/onboarding"
          className={`flex flex-col items-center gap-1 text-[10px] font-sans ${
            pathname === "/onboarding" ? "text-pip font-semibold" : "text-muted"
          }`}
        >
          <User className="w-4 h-4" />
          <span>profile</span>
        </Link>
      </nav>

      {/* Slide-over Pip Chat from any page */}
      <ChatSlideOver isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
