import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 w-full z-50">
      {/* Main background with goldy gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a0c05]/98 via-[#2a1608]/98 to-[#1a0c05]/98 backdrop-blur-2xl border-b border-[#ffa36c]/10"></div>
      
      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff8c42]/40 to-transparent">
        <div className="h-full bg-gradient-to-r from-[#ff5e00]/30 via-[#ffa36c]/30 to-[#ff8c42]/30 animate-pulse"></div>
      </div>
      
      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-[#ff5e00]/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-[#ff8c42]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <nav className="relative container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex items-center space-x-3">
          <div className="relative">
            <Image
              src={"/logo.png"}
              alt="Sensai Logo"
              width={180}
              height={50}
              className="h-10 w-auto object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            />
            {/* Logo hover glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#ff5e00]/30 via-[#ff8c42]/20 to-[#ffa36c]/30 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150"></div>
          </div>
        </Link>
        
        {/* CTA Button */}
        <div className="flex items-center space-x-3">
          <SignInButton mode="modal">
            <Button className="group relative px-5 py-2 h-11 bg-gradient-to-r from-[#ff5e00] via-[#ff8c42] to-[#ffa36c] hover:from-[#ff5e00]/90 hover:via-[#ff8c42]/90 hover:to-[#ffa36c]/90 text-white shadow-xl hover:shadow-2xl hover:shadow-[#ff5e00]/40 transition-all duration-500 rounded-2xl border-0 overflow-hidden">
              <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-500" />
              <span className="font-semibold">Get Started</span>
              
              {/* Hover pulse effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#ffa36c]/40 via-[#ff8c42]/40 to-[#ff5e00]/40 opacity-0 group-hover:opacity-30 transition-all duration-500 animate-pulse"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </Button>
          </SignInButton>
        </div>
      </nav>
    </header>
  );
}