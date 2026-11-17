'use client';

import React, { useState } from 'react';
import { Loader, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { generationErrorMessage } from "@/components/shared/generationError";
import { deleteATSScore } from "@/actions/ResumeParser";

// "Delete result" with a confirm dialog. Calls onDeleted(id) once the row is really gone.
export default function DeleteAtsButton({ scoreId, onDeleted, size = "sm", variant = "ghost" }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await deleteATSScore(scoreId);
      if (!res || res.error) {
        toast.error(generationErrorMessage(res, "We couldn't delete this result."));
        return;
      }
      setOpen(false);
      toast.success("Result deleted");
      onDeleted?.(scoreId);
    } catch {
      toast.error("We couldn't delete this result. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button type="button" size={size} variant={variant} onClick={() => setOpen(true)} className="text-destructive hover:text-destructive">
        <Trash2 className="w-3 h-3 mr-2" /> Delete result
      </Button>
      <AlertDialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this result?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the score and its feedback. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirm} disabled={busy}>
              {busy && <Loader className="w-3 h-3 mr-2 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
