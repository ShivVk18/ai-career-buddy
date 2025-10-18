// Header.tsx
"use client";
import { SignInButton } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <>
      {/* Custom Glassmorphism Header */}
      <header className="fixed top-6 left-0 right-0 w-full z-50 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Glassmorphism Container */}
          <div className="relative backdrop-blur-xl bg-black/20 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Ambient glow background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#f59e0b]/5 via-transparent to-[#fbbf24]/5"></div>

            {/* Subtle animated border */}
            <div className="absolute inset-0 rounded-2xl opacity-50">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#f59e0b]/20 via-[#fbbf24]/20 to-[#f59e0b]/20 animate-pulse"></div>
            </div>

            {/* Floating orbs */}
           

            <nav className="relative px-8 py-4 flex items-center justify-between">
              {/* Brand Logo/Name */}
              <a
                href="/"
                className="group relative flex items-center space-x-3 z-10"
              >
                <div className="relative flex items-center space-x-3">
                 

                  {/* Brand Name with Gradient Text */}
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                    AscendAI
                  </span>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </a>

              {/* CTA Button with Clerk Integration */}
              <SignInButton mode="modal">
                <button className="group relative px-6 py-2.5 bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black font-semibold rounded-xl shadow-lg shadow-[#f59e0b]/30 hover:shadow-xl hover:shadow-[#f59e0b]/40 transition-all duration-300 overflow-hidden z-10">
                  <span className="relative z-10 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    Get Started
                  </span>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>

                  {/* Pulse overlay */}
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </SignInButton>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
