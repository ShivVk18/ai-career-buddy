'use client';

import React, { useState } from 'react';
import { Loader, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { deleteATSScore, restoreATSScore } from "@/actions/ResumeParser";
import { deleteWithUndo } from "@/components/shared/undoDelete";

// "Delete result": deletes at once and offers a 5 s Undo (no confirm dialog).
// onDeleted(id) is called once the row is gone; onRestored(id) if the user undoes it.
export default function DeleteAtsButton({ scoreId, onDeleted, onRestored, size = "sm", variant = "ghost" }) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (busy) return;
    await deleteWithUndo({
      name: "ATS result",
      hide: () => setBusy(true),
      show: () => setBusy(false),
      remove: () => deleteATSScore(scoreId),
      restore: () => restoreATSScore(scoreId),
      done: (phase) => (phase === "deleted" ? onDeleted?.(scoreId) : onRestored?.(scoreId)),
    });
  };

  return (
    <Button type="button" size={size} variant={variant} onClick={run} disabled={busy} className="text-destructive hover:text-destructive">
      {busy ? <Loader className="w-3 h-3 mr-2 animate-spin" /> : <Trash2 className="w-3 h-3 mr-2" />} Delete result
    </Button>
  );
}
