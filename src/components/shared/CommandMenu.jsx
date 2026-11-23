"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Briefcase,
  BrainCircuit,
  Gift,
  Home,
  Mic,
  User,
  ClipboardCheck,
  FileText,
  Inbox,
  Mail,
  MessageSquare,
  ScrollText,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { getApplications } from "@/actions/Applications";

// Offer helper is not built yet; flip when /offers ships.
const OFFER_ROUTE_PRESENT = false;

const STATIC_ITEMS = [
  { id: "home", group: "flow", label: "home", href: "/dashboard", icon: Home },
  { id: "onboarding", group: "flow", label: "onboarding / profile", href: "/onboarding?edit=1", icon: User },
  { id: "apps", group: "flow", label: "applications / track", href: "/applications", icon: Briefcase },
  { id: "needs", group: "flow", label: "needs you", href: "/needs-you", icon: Inbox },
  { id: "interview-flow", group: "flow", label: "interview", href: "/interview", icon: Mic },
  { id: "offer", group: "flow", label: "offer helper", href: "/offers", icon: Gift, when: OFFER_ROUTE_PRESENT },
  { id: "resume", group: "tools", label: "resume builder", href: "/resume", icon: ScrollText },
  { id: "interview", group: "tools", label: "interview prep", href: "/interview", icon: Sparkles },
  { id: "cover", group: "tools", label: "cover letter", href: "/cover-letter", icon: FileText },
  { id: "cold", group: "tools", label: "cold email", href: "/cold-email", icon: Mail },
  { id: "roadmap", group: "tools", label: "career roadmap", href: "/roadmap", icon: BrainCircuit },
  { id: "ats", group: "tools", label: "resume parser / ats checker", href: "/resume-parser", icon: ClipboardCheck },
  { id: "settings", group: "go to", label: "settings", href: "/settings", icon: Settings },
  { id: "theme", group: "go to", label: "toggle light / dark theme", action: "theme", icon: Sparkles },
  { id: "chat", group: "go to", label: "open chat with pip", action: "chat", icon: MessageSquare },
].filter((i) => i.when !== false);

/**
 * Cmd/Ctrl+K command menu for the app shell. Arrow keys move, Enter picks, Esc closes (Radix dialog).
 * Recent jobs load the first time it opens; if that fails the rest of the menu still works.
 */
export default function CommandMenu({ open, onOpenChange: setOpen, onOpenChat }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [jobs, setJobs] = useState(null); // null = not loaded, [] = none
  const [jobsFailed, setJobsFailed] = useState(false);
  const listRef = useRef(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!openRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    if (jobs !== null) return;
    let alive = true;
    getApplications()
      .then((res) => {
        if (!alive) return;
        if (!res || res.error) {
          setJobsFailed(true);
          setJobs([]);
          return;
        }
        setJobs(res.applications.slice(0, 6));
      })
      .catch(() => {
        if (alive) {
          setJobsFailed(true);
          setJobs([]);
        }
      });
    return () => {
      alive = false;
    };
  }, [open, jobs]);

  const items = useMemo(() => {
    const recent = (jobs || []).map((a) => ({
      id: `job-${a.job.id}`,
      group: "recent jobs",
      label: [a.job.company, a.job.title].filter(Boolean).join(" - ") || "untitled job",
      href: `/jobs/${a.job.id}`,
      icon: Briefcase,
    }));
    const q = query.trim().toLowerCase();
    const all = [...STATIC_ITEMS, ...recent];
    return q ? all.filter((i) => i.label.toLowerCase().includes(q)) : all;
  }, [jobs, query]);

  const choose = useCallback(
    (item) => {
      setOpen(false);
      if (item.action === "chat") onOpenChat?.();
      else if (item.action === "theme") setTheme(resolvedTheme === "dark" ? "light" : "dark");
      else if (item.href) router.push(item.href);
    },
    [router, onOpenChat, setOpen, resolvedTheme, setTheme]
  );

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[active]) choose(items[active]);
    }
  };

  let lastGroup = null;
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-panel shadow-pop outline-none"
        >
          <DialogPrimitive.Title className="sr-only">Command menu</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-line px-4">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls="command-list"
              aria-activedescendant={items[active] ? `cmd-${items[active].id}` : undefined}
              aria-label="Search tools, pages and jobs"
              placeholder="go to a tool, a page or a job…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
            />
            <kbd className="hidden rounded border border-line px-1.5 font-pixel text-[10px] text-muted sm:inline">esc</kbd>
          </div>
          <ul id="command-list" ref={listRef} role="listbox" aria-label="Commands" className="max-h-[50vh] overflow-y-auto p-2">
            {items.length === 0 && <li className="px-3 py-6 text-center text-xs text-muted">nothing matches that</li>}
            {items.map((item, i) => {
              const header = item.group !== lastGroup;
              lastGroup = item.group;
              const Icon = item.icon;
              return (
                <li key={item.id} role="presentation">
                  {header && (
                    <span className="block px-3 pb-1 pt-2 font-pixel text-[10px] uppercase tracking-wider text-muted" aria-hidden="true">
                      {item.group}
                    </span>
                  )}
                  <div
                    id={`cmd-${item.id}`}
                    data-index={i}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => choose(item)}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm ${
                      i === active ? "bg-pip-soft text-pip-ink ring-2 ring-pip/40" : "text-text"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </li>
              );
            })}
            {jobs === null && open && <li className="px-3 py-2 text-[11px] text-muted">loading recent jobs…</li>}
            {jobsFailed && <li className="px-3 py-2 text-[11px] text-muted">couldn&apos;t load recent jobs</li>}
          </ul>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
