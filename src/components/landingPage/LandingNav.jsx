import Link from "next/link";
import { Menu } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const LINKS = [
  { href: "#tools", label: "Tools", badge: "new" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

// Floating pill navbar, rendered inside the hero frame.
export default function LandingNav() {
  return (
    <header className="relative z-30 px-3 pt-3 sm:px-5 sm:pt-5">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-2xl border border-line bg-panel px-3 shadow-sm sm:px-4">
        <Link href="/" className="rounded-lg px-1 text-lg font-bold tracking-tight text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          ascend
        </Link>

        <div className="hidden items-center gap-1 text-sm text-muted md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 transition hover:bg-soft hover:text-text">
              {l.label}
              {l.badge && <span className="rounded-full bg-lime px-1.5 py-0.5 text-[10px] font-semibold leading-none text-lime-foreground">{l.badge}</span>}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/dashboard" className="hidden min-h-9 items-center rounded-xl bg-soft px-3.5 text-sm font-medium text-text transition hover:bg-line sm:inline-flex">
            Sign in
          </Link>
          <Link href="/dashboard" className="inline-flex min-h-9 items-center rounded-xl bg-zinc-900 px-3.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-primary dark:hover:bg-primary-hover">
            Get started
          </Link>
          <details className="group relative md:hidden">
            <summary aria-label="Menu" className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl text-text hover:bg-soft [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-11 z-40 w-48 rounded-2xl border border-line bg-panel p-2 shadow-pop">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-sm text-text hover:bg-soft">{l.label}</a>
              ))}
              <Link href="/dashboard" className="block rounded-lg px-3 py-2.5 text-sm text-text hover:bg-soft">Sign in</Link>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
