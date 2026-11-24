"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Dialog } from "radix-ui";
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
  Map,
  ClipboardCheck,
  Inbox,
  Settings,
  Search,
  Mic,
  Menu,
  X,
} from "lucide-react";
import ChatSlideOver from "../chat/ChatSlideOver";
import CommandMenu from "./CommandMenu";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { getNeedsYou } from "@/actions/Applications";
import { signOutAction } from "@/actions/Auth";
import { cn } from "@/lib/utils";

const FLOW = [
  { label: "home", href: "/dashboard", icon: Home },
  { label: "applications", href: "/applications", icon: Briefcase },
  { label: "needs you", href: "/needs-you", icon: Inbox, count: true },
  { label: "interview", href: "/interview", icon: Mic },
  { label: "roadmap", href: "/roadmap", icon: Map },
];

const TOOLS = [
  { label: "resume builder", href: "/resume", icon: ScrollText },
  { label: "interview prep", href: "/interview", icon: Sparkles },
  { label: "cover letter", href: "/cover-letter", icon: FileText },
  { label: "cold email", href: "/cold-email", icon: Mail },
  { label: "career roadmap", href: "/roadmap", icon: Map },
  { label: "resume parser / ats", href: "/resume-parser", icon: ClipboardCheck },
];

const ACCOUNT = [
  { label: "profile", href: "/onboarding?edit=1", icon: User },
  { label: "settings", href: "/settings", icon: Settings },
];

const isActive = (pathname, href) => {
  const base = href.split("?")[0];
  return pathname === base || pathname.startsWith(base + "/");
};

/** `demo` ({ name, needsCount, notifications }) renders the shell with mock data and no server calls (/dev/shell). */
export default function AppSidebar({ demo }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [chatOpen, setChatOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [needsCount, setNeedsCount] = useState(demo?.needsCount ?? 0);
  const name = demo?.name || user?.name || user?.email || "your account";

  // Needs-you badge: best effort, silent on failure.
  useEffect(() => {
    if (demo) return;
    let alive = true;
    getNeedsYou()
      .then((res) => {
        if (alive && res && !res.error) setNeedsCount((res.items || []).length);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname, demo]);

  useEffect(() => setMoreOpen(false), [pathname]);

  const navLink = (active) =>
    cn(
      "group relative flex min-h-10 items-center justify-between gap-2 rounded-[var(--radius-chip)] px-3 py-2 text-sm font-medium transition",
      active ? "bg-brand-soft text-brand-ink" : "text-muted hover:bg-soft hover:text-text"
    );

  const countBadge = (item, active) =>
    item.count && needsCount > 0 ? (
      <span aria-label={`${needsCount} waiting`} className={cn("rounded-full px-1.5 text-[11px] font-semibold leading-5", active ? "bg-brand-ink text-white" : "bg-ink text-ink-foreground")}>
        {needsCount}
      </span>
    ) : null;

  const group = (title, items) => (
    <div className="space-y-0.5">
      <span className="mb-1 block px-3 font-pixel text-[11px] uppercase tracking-wider text-muted">{title}</span>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={navLink(active)}>
            <span className="flex items-center gap-2.5">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </span>
            {countBadge(item, active)}
          </Link>
        );
      })}
    </div>
  );

  const tab = (href, label, Icon, active, badge) => (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("relative flex min-h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-chip)] text-[11px]", active ? "font-semibold text-brand-ink" : "text-muted")}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span>{label}</span>
      {badge > 0 && <span aria-label={`${badge} waiting`} className="absolute right-3 top-1 h-2 w-2 rounded-full bg-brand" />}
    </Link>
  );

  const drawerLink = (item) => {
    const Icon = item.icon;
    return (
      <Link key={item.label} href={item.href} className="flex min-h-11 items-center gap-2.5 rounded-[var(--radius-chip)] border border-line px-3 text-sm font-medium text-text transition hover:border-brand">
        <Icon className="h-4 w-4 text-brand-ink" aria-hidden="true" />
        <span className="truncate">{item.label}</span>
        {item.count && needsCount > 0 && <span className="ml-auto rounded-full bg-ink px-1.5 text-[11px] font-semibold leading-5 text-ink-foreground">{needsCount}</span>}
      </Link>
    );
  };

  const logo = (size) => (
    <Link href="/dashboard" className="flex min-h-11 items-center gap-2.5">
      <span className={cn("flex items-center justify-center rounded-full bg-brand-soft p-1", size)}>
        <Image src="/pip/pip-coffee.svg" alt="" width={26} height={26} style={{ imageRendering: "pixelated" }} unoptimized />
      </span>
      <span className="text-sm font-semibold tracking-tight text-text">ascendai</span>
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar (hidden at 768px and below) */}
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 select-none flex-col border-r border-line bg-panel md:flex">
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          {logo("h-8 w-8")}
          <NotificationBell demo={demo?.notifications} align="start" />
        </div>

        <div className="px-3.5 pt-4">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex min-h-10 w-full items-center gap-2 rounded-[var(--radius-chip)] border border-line bg-bg px-3 text-sm text-muted transition hover:border-brand/50"
            aria-label="Open command menu"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1 text-left">search</span>
            <kbd className="rounded border border-line px-1.5 font-pixel text-[10px]">⌘k</kbd>
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 space-y-6 overflow-y-auto px-3.5 py-4">
          {group("flow", FLOW)}
          {group("tools", TOOLS)}
          <div className="space-y-0.5">
            <button onClick={() => setChatOpen(true)} className={cn(navLink(false), "w-full")}>
              <span className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                chat with pip
              </span>
              <span className="rounded-full bg-brand-soft px-1.5 font-pixel text-[10px] uppercase leading-5 text-brand-ink">ai</span>
            </button>
          </div>
        </nav>

        <div className="space-y-1 border-t border-line p-3.5">
          {ACCOUNT.map((item) => {
            const active = isActive(pathname, item.href) && (item.href !== "/onboarding?edit=1" || pathname === "/onboarding");
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={navLink(active)}>
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </span>
              </Link>
            );
          })}
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-ink">{name[0]?.toLowerCase() || "a"}</span>
              <span className="block truncate text-xs font-medium text-text">{name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ThemeToggle className="!h-8 !w-8" />
              <button onClick={() => (demo ? null : signOutAction())} className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-soft hover:text-text" title="sign out" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-panel/90 px-3 backdrop-blur-md md:hidden">
        {logo("h-7 w-7")}
        <div className="flex items-center">
          <button onClick={() => setCmdOpen(true)} aria-label="Open command menu" className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-soft">
            <Search className="h-4 w-4" />
          </button>
          <NotificationBell demo={demo?.notifications} />
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile bottom bar: 4 primary items plus a drawer for the rest */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 flex min-h-16 items-stretch gap-1 border-t border-line bg-panel/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md md:hidden">
        {tab("/dashboard", "home", Home, pathname === "/dashboard")}
        {tab("/applications", "jobs", Briefcase, isActive(pathname, "/applications") || isActive(pathname, "/jobs"), needsCount)}
        {tab("/interview", "interview", Mic, isActive(pathname, "/interview"))}
        <button
          onClick={() => setChatOpen(true)}
          aria-label="Open chat with pip"
          className="flex min-h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-chip)] text-[11px] text-muted"
        >
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          <span>pip</span>
        </button>
        <button
          onClick={() => setMoreOpen(true)}
          aria-label="More"
          aria-expanded={moreOpen}
          className="flex min-h-12 min-w-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-chip)] text-[11px] text-muted"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span>more</span>
        </button>
      </nav>

      <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 md:hidden" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] space-y-4 overflow-y-auto rounded-t-[var(--radius-panel)] border-t border-line bg-panel p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-soft outline-none animate-in slide-in-from-bottom duration-200 md:hidden"
          >
            <div className="flex items-center justify-between">
              <Dialog.Title className="font-doc text-xl text-text">more</Dialog.Title>
              <Dialog.Close aria-label="Close menu" className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-soft">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="grid grid-cols-2 gap-2">{[FLOW[2], FLOW[4], ...ACCOUNT].map(drawerLink)}</div>
            <div>
              <span className="mb-2 block font-pixel text-[11px] uppercase tracking-wider text-muted">tools</span>
              <div className="grid grid-cols-2 gap-2">{TOOLS.map(drawerLink)}</div>
            </div>
            <div className="flex items-center justify-between border-t border-line pt-2 text-xs text-muted">
              <span className="truncate">signed in as {demo?.name || user?.name?.split(" ")[0] || "you"}</span>
              <button onClick={() => (demo ? null : signOutAction())} className="min-h-11 px-2 font-medium text-brand-ink">sign out</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Slide-over Pip chat from any page */}
      <ChatSlideOver isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Cmd/Ctrl+K from anywhere in the app */}
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} onOpenChat={() => setChatOpen(true)} />
    </>
  );
}
