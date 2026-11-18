"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAllMyData, deleteAccount } from "@/actions/Account";

const DANGER = {
  data: {
    phrase: "DELETE MY DATA",
    title: "Delete all my data",
    button: "Delete all my data",
    body: "This removes your resume, jobs, applications, letters, emails, ATS results, roadmaps and practice history. Your login stays, so you can start fresh. It can't be undone.",
  },
  account: {
    phrase: "DELETE MY ACCOUNT",
    title: "Delete account",
    button: "Delete my account",
    body: "This removes all of your data and then your login itself. You'll be signed out. It can't be undone.",
  },
};

function DangerDialog({ kind, onClose }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const cfg = DANGER[kind];
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const matches = typed.trim() === cfg.phrase;

  const run = async (e) => {
    e.preventDefault();
    if (!matches || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await (kind === "data" ? deleteAllMyData({ confirmation: typed.trim() }) : deleteAccount({ confirmation: typed.trim() }));
      if (!res || res.error) {
        setError(
          res?.code === "CLERK_FAILED"
            ? "Your data is deleted, but we couldn't remove your login yet. Press the button again to retry just that step."
            : res?.error || "That didn't work. Nothing else was changed. Please try again."
        );
        return;
      }
      if (kind === "account") {
        toast.success("Your account was deleted. Goodbye, and good luck.");
        await signOut({ redirectUrl: "/" });
      } else {
        toast.success("All your data was deleted.");
        onClose();
        router.replace("/onboarding");
      }
    } catch {
      setError("We couldn't reach the server. Nothing was changed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <form onSubmit={run} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{cfg.title}</DialogTitle>
            <DialogDescription>{cfg.body}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-phrase" className="text-xs">
              Type <strong className="font-mono">{cfg.phrase}</strong> to confirm
            </Label>
            <Input
              id="confirm-phrase"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="h-11"
            />
          </div>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <button type="button" onClick={onClose} disabled={busy} className="btn-pill-secondary min-h-11 px-5 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!matches || busy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-destructive px-5 text-sm font-medium text-white outline-none transition focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {cfg.button}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsView() {
  const [open, setOpen] = useState(null);
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-text lowercase">settings</h1>
        <p className="text-xs text-muted">you own your data. these are the only two things in the app that ask you to confirm.</p>
      </div>
      <section aria-labelledby="danger" className="space-y-4 rounded-2xl border border-[#E8C9C0] bg-white p-5 sm:p-6">
        <h2 id="danger" className="flex items-center gap-2 text-sm font-semibold text-text">
          <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden="true" /> danger zone
        </h2>
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-text">Delete all my data</p>
            <p className="text-xs text-muted">Keeps your login. Starts you fresh.</p>
          </div>
          <button type="button" onClick={() => setOpen("data")} className="btn-pill-secondary min-h-11 px-5 text-sm text-destructive">
            Delete all my data
          </button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-text">Delete account</p>
            <p className="text-xs text-muted">Removes your data and your login.</p>
          </div>
          <button type="button" onClick={() => setOpen("account")} className="btn-pill-secondary min-h-11 px-5 text-sm text-destructive">
            Delete account
          </button>
        </div>
      </section>
      {open && <DangerDialog kind={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
