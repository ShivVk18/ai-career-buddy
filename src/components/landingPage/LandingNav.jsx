"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { href: "#why", label: "Why ascend" },
  { href: "#tools", label: "Tools" },
  { href: "#bots", label: "Bots" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

// Glass pill navbar inside the blue hero; CTAs on the right.
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 px-4 py-3 transition-[background-color,backdrop-filter,box-shadow] duration-300 sm:px-8 sm:py-4 ${scrolled ? "bg-[color-mix(in_srgb,var(--sky-solid)_88%,transparent)] shadow-[0_8px_24px_-12px_rgba(10,20,90,0.5)] backdrop-blur-lg" : "bg-transparent"}`}>
      <Link href="/" className="rounded-lg px-1 text-xl font-bold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        ascend
      </Link>
      <nav aria-label="Main" className="glass hidden items-center gap-0.5 rounded-full p-1 text-sm text-white lg:flex">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="rounded-full px-3.5 py-1.5 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            {l.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-1.5 text-white">
        <ThemeToggle />
        <Link href="/dashboard" className="hidden min-h-10 items-center rounded-full px-3.5 text-sm font-medium text-white transition hover:bg-white/15 sm:inline-flex">
          Sign in
        </Link>
        <Link href="/dashboard" className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-sky-solid transition duration-200 hover:bg-white/90 active:scale-[0.98]">
          Get started
        </Link>
        <details className="group relative lg:hidden">
          <summary aria-label="Menu" className="glass flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-white [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-12 z-40 w-48 rounded-2xl border border-line bg-panel p-2 shadow-pop">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-sm text-text hover:bg-soft">{l.label}</a>
            ))}
            <Link href="/dashboard" className="block rounded-lg px-3 py-2.5 text-sm text-text hover:bg-soft">Sign in</Link>
          </div>
        </details>
      </div>
    </header>
  );
}
