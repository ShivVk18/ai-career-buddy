"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-[#ECEAE4] bg-white py-12 px-4 sm:px-6 text-xs text-muted">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-pip-soft flex items-center justify-center p-0.5">
            <Image
              src="/pip/pip-coffee.svg"
              alt="pip"
              width={18}
              height={18}
              style={{ imageRendering: "pixelated" }}
              unoptimized
            />
          </div>
          <span className="font-semibold text-text">ascendai</span>
          <span>•</span>
          <span className="font-pixel text-[11px] text-pip-ink">
            pip by stick it up (mit)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <Link href="/tools/resume" className="hover:text-text transition">resume</Link>
          <Link href="/tools/interview" className="hover:text-text transition">interview</Link>
          <Link href="/tools/cover-letter" className="hover:text-text transition">cover letter</Link>
          <Link href="/tools/cold-email" className="hover:text-text transition">cold email</Link>
          <Link href="/tools/roadmap" className="hover:text-text transition">roadmap</Link>
          <Link href="/tools/ats" className="hover:text-text transition">ats</Link>
        </div>

        <div className="text-[11px]">
          © {new Date().getFullYear()} ascendai • built for tech job seekers
        </div>
      </div>
    </footer>
  );
}
