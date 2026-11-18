"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generationErrorMessage } from "@/components/shared/generationError";
import { LETTER_SWITCHES, runLetterSwitch } from "@/components/shared/letterActions";
import { getCoverLetter, updateCoverLetter, undoLetterChange } from "@/actions/CoverLetter";
import { getColdEmail, updateColdEmail } from "@/actions/ColdEmail";
import { TONE_LABELS } from "@/lib/writing";

const toneName = (t) => (TONE_LABELS[t] ? TONE_LABELS[t].split(" ")[0] : null);

/**
 * A cover letter or cold email, editable in place: the text saves on blur (Esc puts back the last saved text).
 * Letters also get a tone chip with quick switches (shorter / more formal / warmer); each one is followed by a
 * 5 s Undo, no dialogs. Nothing is ever sent.
 */
export default function LetterReview({ kind, item, href, onApprove, approving }) {
  const isLetter = kind === "letter";
  const refId = item.refId;
  const [state, setState] = useState({ status: "loading" });
  const [text, setText] = useState("");
  const [tone, setTone] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | failed
  const [working, setWorking] = useState(null);
  const savedRef = useRef("");
  const textRef = useRef("");
  const pendingSave = useRef(Promise.resolve(true));
  textRef.current = text;

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const doc = await (isLetter ? getCoverLetter(refId) : getColdEmail(refId));
      if (!doc) {
        setState({ status: "gone" });
        return;
      }
      if (doc.error) {
        setState({ status: "error", error: generationErrorMessage(doc, "We couldn't open this one.") });
        return;
      }
      savedRef.current = doc.content || "";
      setText(doc.content || "");
      setTone(doc.tone ?? null);
      setState({ status: "ready", doc });
    } catch {
      setState({ status: "error", error: "We couldn't open this one." });
    }
  }, [isLetter, refId]);

  useEffect(() => {
    load();
  }, [load]);

  // Saves the current text if it changed. Resolves true when nothing is left unsaved.
  const flush = useCallback(() => {
    const next = textRef.current;
    if (next === savedRef.current) return pendingSave.current;
    if (!next.trim()) {
      setText(savedRef.current); // an empty letter is never saved
      return pendingSave.current;
    }
    setSaveState("saving");
    pendingSave.current = pendingSave.current.then(async () => {
      try {
        const res = await (isLetter ? updateCoverLetter(refId, next) : updateColdEmail(refId, next));
        if (!res || res.error) {
          setSaveState("failed");
          toast.error(generationErrorMessage(res, "That edit didn't save. Your text is still here."));
          return false;
        }
        savedRef.current = next;
        setSaveState("saved");
        return true;
      } catch {
        setSaveState("failed");
        toast.error("That edit didn't save. Your text is still here.");
        return false;
      }
    });
    return pendingSave.current;
  }, [isLetter, refId]);

  const doSwitch = async (sw) => {
    if (working) return;
    setWorking(sw.key);
    try {
      if (!(await flush())) return; // unsaved edits must be safe first, so Undo brings them back
      const res = await runLetterSwitch(refId, sw.key, tone);
      if (!res || res.error || res.code) {
        toast.error(generationErrorMessage(res));
        return;
      }
      savedRef.current = res.content;
      setText(res.content);
      setTone(res.tone ?? tone);
      toast.success(sw.done, {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: async () => {
            const back = await undoLetterChange(refId).catch(() => null);
            if (!back || back.error) {
              toast.error(generationErrorMessage(back, "Couldn't undo that."));
              return;
            }
            savedRef.current = back.content;
            setText(back.content);
            setTone(back.tone ?? null);
            toast.success("Change undone");
          },
        },
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setWorking(null);
    }
  };

  if (state.status === "loading") {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading draft">
        <div className="h-4 w-1/3 animate-pulse rounded bg-soft" />
        <div className="h-40 w-full animate-pulse rounded-lg bg-soft" />
      </div>
    );
  }
  if (state.status === "gone") {
    return <p className="text-xs text-muted">This draft was deleted. Reload the list to clear it.</p>;
  }
  if (state.status === "error") {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E8C9C0] bg-[#FDF3F0] p-3 text-xs text-text">
        <span className="min-w-0 flex-1">{state.error}</span>
        <button type="button" onClick={load} className="btn-pill-secondary min-h-10 px-4 text-xs">
          Retry
        </button>
      </div>
    );
  }

  const label = isLetter ? "cover letter" : "cold email";
  return (
    <div className="space-y-3">
      {!isLetter && state.doc.subject && <p className="text-xs text-muted">Subject: {state.doc.subject}</p>}
      {isLetter && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Tone">
          {toneName(tone) && (
            <span className="inline-flex h-8 items-center rounded-full border border-pip bg-pip-soft px-3 font-pixel text-[11px] text-pip-ink">
              tone: {toneName(tone)}
            </span>
          )}
          {LETTER_SWITCHES.map((sw) => (
            <button
              key={sw.key}
              type="button"
              disabled={!!working}
              onClick={() => doSwitch(sw)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-panel px-4 text-xs text-text outline-none transition hover:border-pip focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95 disabled:opacity-60"
            >
              {working === sw.key && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
              {sw.label}
            </button>
          ))}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (saveState !== "idle") setSaveState("idle");
        }}
        onBlur={flush}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            setText(savedRef.current);
            e.currentTarget.blur();
          }
        }}
        readOnly={!!working}
        rows={Math.min(Math.max(text.split("\n").length + 2, 8), 24)}
        maxLength={10000}
        aria-label={`Edit this ${label}`}
        className="w-full resize-y rounded-xl border border-line bg-panel p-4 font-serif text-[13px] leading-relaxed text-text outline-none focus-visible:border-pip focus-visible:ring-2 focus-visible:ring-pip/40"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={approving || !!working}
          onClick={async () => {
            if (await flush()) onApprove();
          }}
          className="btn-pill-primary inline-flex min-h-11 items-center gap-2 px-5 text-xs disabled:opacity-60"
        >
          {approving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          Looks good
        </button>
        <Link href={href} className="text-xs text-pip-ink underline-offset-4 hover:underline rounded focus-visible:ring-2 focus-visible:ring-pip/50">
          open full editor
        </Link>
        <span className="text-[11px] text-muted" role="status" aria-live="polite">
          {saveState === "saving" ? "saving…" : saveState === "saved" ? "saved" : saveState === "failed" ? "not saved" : "saves when you click away"}
        </span>
      </div>
      <p className="text-[11px] text-muted">Approving only marks it reviewed. Nothing is ever sent for you.</p>
    </div>
  );
}
