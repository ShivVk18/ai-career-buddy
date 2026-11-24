"use client";

import { useEffect } from "react";
import PipAvatar from "./PipAvatar";
import { cn } from "@/lib/utils";

/** Bottom pill: "3 edits accepted · nothing sent yet  [undo]". Auto-closes after `duration` ms. */
export default function UndoToast({ open, message, onUndo, onClose, duration = 6000, className }) {
  useEffect(() => {
    if (!open || !duration) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose, message]);
  if (!open) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fade-up fixed bottom-6 left-1/2 z-50 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full bg-ink py-2 pl-3 pr-2 text-sm text-ink-foreground shadow-soft",
        className,
      )}
    >
      <PipAvatar outfit="coffee" size="sm" alt="" />
      <span>{message}</span>
      <button
        type="button"
        onClick={() => {
          onUndo?.();
          onClose?.();
        }}
        className="rounded-full bg-ink-foreground/15 px-4 py-1.5 font-medium hover:bg-ink-foreground/25"
      >
        undo
      </button>
    </div>
  );
}
