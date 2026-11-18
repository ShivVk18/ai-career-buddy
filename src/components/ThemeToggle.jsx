"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className={`inline-block w-9 h-9 shrink-0 ${className}`} aria-hidden="true" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`
        group flex items-center justify-center w-9 h-9 rounded-full
        border border-line bg-panel
        hover:border-primary hover:bg-soft
        transition shrink-0
        ${className}
      `}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-muted group-hover:text-primary-ink transition" />
      ) : (
        <Moon className="h-4 w-4 text-muted group-hover:text-primary-ink transition" />
      )}
    </button>
  );
}

/** Three-way chooser (system / light / dark) for the settings page. */
export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? theme || "system" : null;
  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex rounded-full border border-line bg-soft p-1">
      {["system", "light", "dark"].map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={current === t}
          onClick={() => setTheme(t)}
          className={`min-h-9 rounded-full px-4 text-xs font-medium capitalize transition ${
            current === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted hover:text-text"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
