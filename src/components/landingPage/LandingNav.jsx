import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pip-soft p-1">
            <Image src="/pip/pip-coffee.svg" alt="pip" width={24} height={24} style={{ imageRendering: "pixelated" }} unoptimized />
          </span>
          <span className="text-base font-semibold tracking-tight text-text">ascendai</span>
        </Link>

        <div className="hidden items-center gap-7 text-sm text-muted md:flex">
          <a href="#how" className="transition hover:text-text">how it works</a>
          <a href="#tools" className="transition hover:text-text">tools</a>
          <a href="#trust" className="transition hover:text-text">trust</a>
          <a href="#pricing" className="transition hover:text-text">pricing</a>
          <a href="#faq" className="transition hover:text-text">faq</a>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/dashboard" className="hidden px-3 py-2 text-sm font-medium text-text transition hover:text-primary-ink sm:inline">
            sign in
          </Link>
          <Link href="/dashboard" className="btn-pill-primary gap-1.5 text-sm">
            open app <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
