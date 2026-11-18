"use client";

import React, { useEffect, useState } from "react";
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
  Inbox,
  Settings,
  Search,
} from "lucide-react";
import ChatSlideOver from "../chat/ChatSlideOver";
import CommandMenu from "./CommandMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { getNeedsYou } from "@/actions/Applications";

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [chatOpen, setChatOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [needsCount, setNeedsCount] = useState(0);

  // Needs-you badge: best effort, silent on failure.
  useEffect(() => {
    let alive = true;
    getNeedsYou()
      .then((res) => {
        if (alive && res && !res.error) setNeedsCount((res.items || []).length);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  const mainNav = [
    { label: "home", href: "/dashboard", icon: Home },
    { label: "applications", href: "/applications", icon: Briefcase },
    { label: "needs you", href: "/needs-you", icon: Inbox, count: true },
    { label: "chat with pip", href: "/chat", icon: MessageSquare, badge: "ai" },
    { label: "profile", href: "/onboarding?edit=1", icon: User },
    { label: "settings", href: "/settings", icon: Settings },
  ];

  const tools = [
    { label: "resume builder", href: "/resume", icon: ScrollText },
    { label: "ats checker", href: "/resume-parser", icon: ClipboardCheck },
    { label: "interview prep", href: "/interview", icon: Sparkles },
    { label: "cover letter", href: "/cover-letter", icon: FileText },
    { label: "cold email", href: "/cold-email", icon: Mail },
    { label: "career roadmap", href: "/roadmap", icon: BrainCircuit },
  ];

  const navLink = (item, active) =>
    `group relative flex min-h-10 items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
      active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted hover:bg-soft hover:text-text"
    }`;

  const Badge = ({ item, active }) => {
    if (item.count && needsCount > 0)
      return (
        <span
          aria-label={`${needsCount} waiting`}
          className={`rounded-full px-1.5 text-[11px] font-semibold leading-5 ${active ? "bg-lime text-lime-foreground" : "bg-primary text-primary-foreground"}`}
        >
          {needsCount}
        </span>
      );
    if (item.badge)
      return <span className="rounded-full bg-lime px-1.5 text-[10px] font-semibold uppercase leading-5 text-lime-foreground">{item.badge}</span>;
    return active ? <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-lime" /> : null;
  };

  const tab = (href, label, Icon, active) => (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-w-12 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] ${active ? "font-semibold text-primary-ink" : "text-muted"}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{label}</span>
      <span aria-hidden="true" className={`h-1 w-1 rounded-full ${active ? "bg-lime" : "bg-transparent"}`} />
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar (hidden under 768px) */}
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 select-none flex-col border-r border-line bg-panel md:flex">
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pip-soft p-1">
              <Image src="/pip/pip-coffee.svg" alt="pip" width={26} height={26} style={{ imageRendering: "pixelated" }} unoptimized />
            </span>
            <span className="text-sm font-semibold tracking-tight text-text">ascendai</span>
          </Link>
          <button
            onClick={() => setChatOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg text-primary-ink transition hover:border-primary"
            title="quick chat with pip"
            aria-label="Open chat with pip"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3.5 pt-4">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-line bg-bg px-3 text-sm text-muted transition hover:border-primary/50"
            title="search and jump (Ctrl/Cmd + K)"
            aria-label="Open command menu"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1 text-left">search</span>
            <kbd className="rounded border border-line px-1.5 font-pixel text-[10px]">ctrl k</kbd>
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 space-y-6 overflow-y-auto px-3.5 py-4">
          <div className="space-y-1">
            <span className="mb-1 block px-3 text-[11px] font-medium uppercase tracking-wider text-faint">overview</span>
            {mainNav.map((item) => {
              const active = pathname === item.href.split("?")[0];
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={navLink(item, active)}>
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </span>
                  <Badge item={item} active={active} />
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <span className="mb-1 block px-3 text-[11px] font-medium uppercase tracking-wider text-faint">tools</span>
            {tools.map((t) => {
              const active = pathname === t.href || pathname.startsWith(t.href + "/");
              const Icon = t.icon;
              return (
                <Link key={t.label} href={t.href} aria-current={active ? "page" : undefined} className={navLink(t, active)}>
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {t.label}
                  </span>
                  <Badge item={t} active={active} />
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-line p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pip-soft text-xs font-semibold text-pip-ink">
                {user?.firstName?.[0] || "A"}
              </span>
              <span className="block truncate text-xs font-medium text-text">{user?.fullName || "your account"}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ThemeToggle className="!h-8 !w-8" />
              <button onClick={() => signOut()} className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-soft hover:text-text" title="sign out" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-panel/90 px-4 backdrop-blur-md md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pip-soft p-0.5">
            <Image src="/pip/pip-coffee.svg" alt="pip" width={22} height={22} style={{ imageRendering: "pixelated" }} unoptimized />
          </span>
          <span className="text-sm font-semibold text-text">ascendai</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCmdOpen(true)} aria-label="Open command menu" className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-soft">
            <Search className="h-4 w-4" />
          </button>
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-soft"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-14 z-40 max-h-[calc(100vh-7.5rem)] space-y-3 overflow-y-auto border-b border-line bg-panel p-4 shadow-pop md:hidden">
          <div className="grid grid-cols-2 gap-2">
            {tools.map((t) => (
              <Link key={t.label} href={t.href} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl border border-line p-2.5 text-xs font-medium text-text hover:border-primary">
                <t.icon className="h-4 w-4 text-primary-ink" aria-hidden="true" />
                <span>{t.label}</span>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "applications", href: "/applications", icon: Briefcase },
              { label: "needs you", href: "/needs-you", icon: Inbox },
              { label: "settings", href: "/settings", icon: Settings },
            ].map((t) => (
              <Link key={t.label} href={t.href} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl border border-line p-2.5 text-xs font-medium text-text hover:border-primary">
                <t.icon className="h-4 w-4 text-primary-ink" aria-hidden="true" />
                <span>{t.label}{t.label === "needs you" && needsCount > 0 ? ` (${needsCount})` : ""}</span>
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-line pt-2 text-xs text-muted">
            <span>logged in as {user?.firstName || "candidate"}</span>
            <button onClick={() => signOut()} className="min-h-11 font-medium text-primary-ink">sign out</button>
          </div>
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-line bg-panel/95 px-2 backdrop-blur-md md:hidden">
        {tab("/dashboard", "home", Home, pathname === "/dashboard")}
        {tab("/applications", "jobs", Briefcase, pathname.startsWith("/applications"))}
        {tab("/resume", "resume", ScrollText, pathname.includes("/resume"))}
        <button onClick={() => setChatOpen(true)} className="-mt-5 flex flex-col items-center gap-1 text-[11px] font-medium text-primary-ink" aria-label="Open chat with pip">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_-6px_var(--glow)] ring-4 ring-panel">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>pip</span>
        </button>
        {tab("/interview", "interview", Sparkles, pathname.includes("/interview"))}
        {tab("/onboarding?edit=1", "profile", User, pathname === "/onboarding")}
      </nav>

      {/* Slide-over Pip chat from any page */}
      <ChatSlideOver isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Cmd/Ctrl+K from anywhere in the app */}
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} onOpenChat={() => setChatOpen(true)} />
    </>
  );
}
