import Link from "next/link";
import { Menu } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { href: "#flow", label: "how it works" },
  { href: "#features", label: "features" },
  { href: "#trust", label: "trust" },
  { href: "#pricing", label: "pricing" },
  { href: "#faq", label: "faq" },
];

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-panel/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="rounded-lg px-1 font-pixel text-2xl text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          ascendai
        </Link>
        <nav aria-label="main" className="hidden items-center gap-1 text-sm text-muted md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 transition hover:bg-soft hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/sign-in" className="hidden min-h-10 items-center rounded-xl px-3 text-sm text-text transition hover:bg-soft sm:inline-flex">sign in</Link>
          <Link href="/sign-up" className="inline-flex min-h-10 items-center rounded-xl bg-brand px-4 text-sm font-medium text-white transition hover:opacity-90 active:scale-[0.98]">start free</Link>
          <details className="group relative md:hidden">
            <summary aria-label="menu" className="flex size-10 cursor-pointer list-none items-center justify-center rounded-xl border border-line text-text [&::-webkit-details-marker]:hidden">
              <Menu className="size-5" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-12 z-40 w-48 rounded-2xl border border-line bg-panel p-2 shadow-soft">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-sm text-text hover:bg-soft">{l.label}</a>
              ))}
              <Link href="/sign-in" className="block rounded-lg px-3 py-2.5 text-sm text-text hover:bg-soft">sign in</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
