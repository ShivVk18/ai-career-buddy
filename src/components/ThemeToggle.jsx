"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={`
        group flex items-center justify-center w-9 h-9 rounded-sm
        border border-border bg-transparent
        hover:border-accent hover:bg-accent/10
        transition-editorial shrink-0
        ${className}
      `}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-muted group-hover:text-accent transition-editorial" />
      ) : (
        <Moon className="h-4 w-4 text-muted group-hover:text-accent transition-editorial" />
      )}
    </button>
  );
}
