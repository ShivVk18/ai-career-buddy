// Header.jsx
"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import AscendLogo from "@/components/AscendLogo";

export default function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="absolute top-8 left-0 right-0 w-full z-50 px-6 md:px-12">
      <div className="max-w-[calc(100vw-48px)] mx-auto flex items-center justify-between gap-6">

        {/* Left: Brand */}
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 group">
            <AscendLogo
              size={22}
              className="text-accent transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-foreground uppercase">
              AscendAI
            </span>
          </Link>
        </div>

        {/* Divider */}
        <div className="flex-grow h-[1px] bg-border opacity-40" />

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[10px] md:text-xs font-semibold tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-sm uppercase border border-accent/20">
            Beta
          </span>

          <ThemeToggle />

          {isSignedIn ? (
            <Link href="/dashboard">
              <button className="flex items-center gap-2 text-[10px] md:text-xs font-bold tracking-widest text-accent-foreground bg-accent hover:brightness-110 transition-editorial uppercase px-5 py-2.5 rounded-sm cursor-pointer">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </button>
            </Link>
          ) : (
            <SignInButton mode="modal">
              <button className="text-[10px] md:text-xs font-bold tracking-widest text-foreground hover:text-accent transition-colors uppercase cursor-pointer">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
