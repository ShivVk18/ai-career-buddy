"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="w-full z-50 px-4 sm:px-8 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-2.5">
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
          <span className="font-semibold text-sm tracking-tight text-text">
            ascendai
          </span>
          <span className="font-pixel text-[11px] text-pip-ink bg-pip-soft px-2 py-0.5 rounded-full">
            with pip
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 text-xs">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="btn-pill-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
            >
              <span>dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <SignInButton mode="modal">
              <button className="btn-pill-secondary text-xs py-2 px-4 shadow-xs">
                sign in
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
