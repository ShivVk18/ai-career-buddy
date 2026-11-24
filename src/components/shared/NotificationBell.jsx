"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Popover } from "radix-ui";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "@/actions/Notifications";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

/**
 * Bell + popover. `demo` ({ items, unreadCount }) skips the server actions (used by /dev/shell).
 * Mark-read is optimistic and rolls back by refetching if the action fails.
 */
export default function NotificationBell({ demo, className, align = "end", side = "bottom" }) {
  const [state, setState] = useState(demo ? { status: "ok", ...demo } : { status: "loading", items: [], unreadCount: 0 });
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (demo) return;
    try {
      const res = await listNotifications({ limit: 20 });
      if (!res || res.error) setState((s) => ({ ...s, status: s.items.length ? "ok" : "error" }));
      else setState({ status: "ok", items: res.items, unreadCount: res.unreadCount });
    } catch {
      setState((s) => ({ ...s, status: s.items.length ? "ok" : "error" }));
    }
  }, [demo]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const readOne = (n) => {
    if (n.read) return;
    setState((s) => ({ ...s, unreadCount: Math.max(0, s.unreadCount - 1), items: s.items.map((i) => (i.id === n.id ? { ...i, read: true } : i)) }));
    if (!demo) markNotificationRead(n.id).then((r) => r?.error && load()).catch(load);
  };
  const readAll = () => {
    setState((s) => ({ ...s, unreadCount: 0, items: s.items.map((i) => ({ ...i, read: true })) }));
    if (!demo) markAllNotificationsRead().then((r) => r?.error && load()).catch(load);
  };

  const { status, items, unreadCount } = state;
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          aria-label={unreadCount > 0 ? `notifications, ${unreadCount} unread` : "notifications"}
          className={cn("relative flex h-11 w-11 items-center justify-center rounded-full text-muted transition hover:bg-soft hover:text-text md:h-9 md:w-9", className)}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && <span aria-hidden="true" className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-panel md:right-2 md:top-2" />}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align={align}
          side={side}
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel text-text shadow-soft outline-none"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold">notifications</span>
            <button
              onClick={readAll}
              disabled={unreadCount === 0}
              className="min-h-8 text-xs font-medium text-brand-ink disabled:text-faint"
            >
              mark all read
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {status === "loading" && (
              <div className="space-y-3 p-4" aria-busy="true">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}
            {status === "error" && (
              <div className="px-4 py-8 text-center text-sm text-muted">
                couldn&apos;t load these.{" "}
                <button onClick={load} className="font-medium text-brand-ink underline-offset-2 hover:underline">try again</button>
              </div>
            )}
            {status === "ok" && items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">all quiet. nothing new.</p>}
            {status === "ok" &&
              items.map((n) => {
                const inner = (
                  <>
                    <span aria-hidden="true" className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand")} />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm", n.read ? "text-muted" : "font-medium text-text")}>{n.title}</span>
                      {n.body && <span className="line-clamp-2 text-xs text-muted">{n.body}</span>}
                    </span>
                    <span className="shrink-0 font-pixel text-[10px] text-muted">{ago(n.createdAt)}</span>
                  </>
                );
                const cls = "flex min-h-11 w-full items-start gap-2.5 border-b border-line px-4 py-3 text-left transition last:border-0 hover:bg-soft";
                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => { readOne(n); setOpen(false); }} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <button key={n.id} onClick={() => readOne(n)} className={cls}>
                    {inner}
                  </button>
                );
              })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
