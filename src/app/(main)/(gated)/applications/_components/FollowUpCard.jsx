"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveAndCopy, unapproveFollowUp } from "@/actions/Track";
import { undo as undoAction } from "@/actions/Undo";
import PipAvatar from "@/components/ui/PipAvatar";
import { generationErrorMessage } from "@/components/shared/generationError";
import { cn } from "@/lib/utils";

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * The follow-up draft in "needs you": pip's short note and one button. "approve & copy" copies at once (inside the tap,
 * so the browser allows it), removes the card optimistically, and tells the server. Nothing is ever sent for the user.
 * onDone(item) removes it from the list; onRestore(item) puts it back if the server said no.
 */
export default function FollowUpCard({ item, onDone, onRestore, approve = approveAndCopy, unapprove = unapproveFollowUp, undo = undoAction, className }) {
  const [busy, setBusy] = useState(false);
  const text = item.draft?.text || "";

  const go = async () => {
    if (busy) return;
    setBusy(true);
    const copied = text ? await copyText(text) : false;
    onDone?.(item);
    let res;
    try {
      res = await approve(item.id);
    } catch {
      res = { error: "We couldn't reach the server.", code: "FAILED" };
    }
    setBusy(false);
    if (!res || res.error) {
      onRestore?.(item);
      toast.error(generationErrorMessage(res, "that didn't save. nothing changed."));
      return;
    }
    const body = res.text || text;
    toast.success(copied ? "copied. you send it, pip never does." : "approved. copy it from the draft, then send it yourself.", {
      duration: 6000,
      action: {
        label: "undo",
        onClick: async () => {
          let r;
          try {
            r = res.undoToken ? await undo(res.undoToken) : await unapprove(item.id);
          } catch {
            r = { error: "failed" };
          }
          if (!r || r.error) toast.error("we couldn't undo that.");
          else {
            onRestore?.(item);
            toast.success("back in needs you");
          }
        },
      },
    });
  };

  return (
    <div className={cn("fade-up rounded-[18px] border border-line bg-panel p-4 shadow-soft", className)}>
      <div className="mb-2 flex items-center gap-2">
        <PipAvatar outfit="coffee" size={34} alt="" />
        <p className="min-w-0 flex-1 truncate font-doc text-sm text-muted">
          needs you · follow-up draft{item.company ? ` · ${item.company.toLowerCase()}` : ""}
        </p>
      </div>
      {text ? (
        <p className="line-clamp-4 whitespace-pre-line font-doc text-base text-text">{text}</p>
      ) : (
        <p className="font-doc text-base text-muted">the draft is empty. open it to write one.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={go}
          disabled={busy || !text}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 font-doc text-sm text-ink-foreground outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
          approve &amp; copy
        </button>
        {item.href && (
          <Link href={item.href} className="inline-flex min-h-11 items-center px-2 font-doc text-sm text-muted underline outline-none focus-visible:ring-2 focus-visible:ring-brand">
            open draft
          </Link>
        )}
      </div>
    </div>
  );
}
