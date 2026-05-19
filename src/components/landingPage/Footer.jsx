// Footer.jsx
'use client'

import Link from "next/link";

const Footer = () => {
  return (
    <footer className="py-16 md:py-24 bg-background border-t border-divider/30">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">

          {/* Brand */}
          <div className="text-center md:text-left space-y-2">
            <span className="text-sm font-clash font-bold tracking-[0.2em] text-foreground uppercase">
              AscendAI
            </span>
            <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Your AI-powered career coach
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            <Link href="/dashboard" className="hover:text-accent transition-colors">
              Get Started
            </Link>
            <Link href="#features" className="hover:text-accent transition-colors">
              Features
            </Link>
            <Link href="#faq" className="hover:text-accent transition-colors">
              FAQ
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase text-center md:text-right">
            © {new Date().getFullYear()} AscendAI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;