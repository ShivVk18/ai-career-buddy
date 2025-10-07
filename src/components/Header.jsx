import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 w-full z-50">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-orange-950/80 backdrop-blur-2xl border-b border-orange-500/10"></div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/40 through-amber-400/40 to-transparent">
        <div className="h-full bg-gradient-to-r from-orange-500/30 via-rose-500/30 to-amber-500/30 animate-pulse"></div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <nav className="relative container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="group flex items-center space-x-3">
          <div className="relative">
            <Image
              src={"/logo.png"}
              alt="Sensai Logo"
              width={180}
              height={50}
              className="h-10 w-auto object-contain transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 via-amber-500/20 to-rose-500/30 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150"></div>
          </div>
        </Link>

        <div className="flex items-center space-x-3">
          <SignInButton mode="modal">
            <Button className="group relative px-5 py-2 h-11 bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 hover:from-orange-500 hover:via-rose-500 hover:to-amber-500 text-white shadow-xl hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-500 rounded-2xl border-0 overflow-hidden">
              <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-500" />
              <span className="font-semibold">Get Started</span>

              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 opacity-0 group-hover:opacity-30 transition-all duration-500 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </Button>
          </SignInButton>
        </div>
      </nav>
    </header>
  );
}
