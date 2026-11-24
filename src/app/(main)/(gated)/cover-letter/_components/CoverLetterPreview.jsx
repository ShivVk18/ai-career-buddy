"use client";

import React, { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { useTheme } from "next-themes";
import { Copy, Edit3, Eye, Save, Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { ChoiceChips } from "@/components/shared/ToolBits";
import PipStatus from "@/components/ui/PipStatus";
import { ParagraphSources } from "@/components/shared/SourceChips";
import { generationErrorMessage } from "@/components/shared/generationError";
import { updateCoverLetter, undoLetterChange } from "@/actions/CoverLetter";
import { LETTER_SWITCHES, runLetterSwitch } from "@/components/shared/letterActions";
import { WordCount, ClicheCheck } from "@/components/shared/WritingHints";
import { COVER_LETTER_WORDS, COVER_LETTER_TONES, DEFAULT_TONE, TONE_LABELS } from "@/lib/writing";

const CoverLetterPreview = ({ id, content, sources: initialSources, tone: initialTone = null }) => {
  const { resolvedTheme } = useTheme();
  const [sources, setSources] = useState(initialSources);
  const [tone, setTone] = useState(COVER_LETTER_TONES.includes(initialTone) ? initialTone : DEFAULT_TONE);
  const [working, setWorking] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [previewMode, setPreviewMode] = useState("preview");
  const [savedContent, setSavedContent] = useState(content);
  const [saving, setSaving] = useState(false);
  const isDirty = (editedContent ?? "") !== (savedContent ?? "")

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateCoverLetter(id, editedContent)
      if (!res || res.error) {
        toast.error(generationErrorMessage(res, "Failed to save your changes"))
        return
      }
      setSavedContent(editedContent)
      toast.success("Changes saved")
    } catch (error) {
      toast.error(error?.message || "Failed to save your changes")
    } finally {
      setSaving(false)
    }
  };

  // No confirm dialog: the server keeps the previous letter, and Undo (5 s) swaps it back.
  const runAction = async (kind) => {
    setWorking(true);
    try {
      // Unsaved edits are saved first, so Undo brings them back too.
      if (isDirty) {
        const saved = await updateCoverLetter(id, editedContent);
        if (!saved || saved.error) {
          toast.error(generationErrorMessage(saved, "Save your edits first, then try again."));
          return;
        }
        setSavedContent(editedContent);
      }
      const res = await runLetterSwitch(id, kind, tone);
      if (!res || res.error || res.code) {
        toast.error(generationErrorMessage(res));
        return;
      }
      setEditedContent(res.content);
      setSavedContent(res.content);
      setSources(res.sources ?? null);
      const sw = LETTER_SWITCHES.find((x) => x.key === kind);
      toast.success(sw ? sw.done : "Letter regenerated", {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: async () => {
            const back = await undoLetterChange(id).catch(() => null);
            if (!back || back.error) {
              toast.error(generationErrorMessage(back, "Couldn't undo that. Your letter is as it was after the change."));
              return;
            }
            setEditedContent(back.content);
            setSavedContent(back.content);
            setSources(back.sources ?? null);
            toast.success("Change undone");
          },
        },
      });
    } catch (error) {
      toast.error(error?.message || "Something went wrong. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      toast.success("Cover letter copied to clipboard! ✨");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([editedContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "cover-letter.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Cover letter downloaded! 📄");
  };

  const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-panel px-5 text-sm text-text outline-none transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2.5">
        <div role="group" aria-label="view" className="inline-flex gap-1 rounded-full bg-soft p-1">
          {[["edit", Edit3], ["preview", Eye]].map(([m, Icon]) => (
            <button
              key={m}
              type="button"
              aria-pressed={previewMode === m}
              onClick={() => setPreviewMode(m)}
              className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", previewMode === m ? "bg-ink text-ink-foreground" : "text-muted hover:text-text")}
            >
              <Icon className="size-4" aria-hidden="true" /> {m}
            </button>
          ))}
        </div>
        <button type="button" onClick={handleSave} disabled={saving || !isDirty || !id} className={btn}>
          {saving ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          {saving ? "saving…" : isDirty ? "save changes" : "saved"}
        </button>
        <button type="button" onClick={handleCopy} className={btn}>
          <Copy className="size-4" aria-hidden="true" /> copy
        </button>
        <button type="button" onClick={handleDownload} className="btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <FileDown className="size-4" aria-hidden="true" /> download txt
        </button>
      </div>

      <section aria-label="rewrite" className="space-y-3">
        <p className="text-xs font-medium text-faint">rewrite it. undo is one tap away.</p>
        <ChoiceChips label="tone" value={tone} onChange={(t) => !working && setTone(t)} options={COVER_LETTER_TONES.map((t) => [t, TONE_LABELS[t]])} />
        <div className="flex flex-wrap items-center gap-2">
          {[["regenerate", "regenerate"], ["formal", "more formal"], ["shorten", "shorter"], ["warmer", "warmer"]].map(([k, label]) => (
            <button key={k} type="button" disabled={working || !id} onClick={() => runAction(k)} className={btn}>
              {label}
            </button>
          ))}
        </div>
        {working && <PipStatus outfit="wizard" text="rewriting your letter…" />}
      </section>

      <div className="overflow-hidden rounded-[20px] border border-line">
        <MDEditor
          value={editedContent || content}
          onChange={setEditedContent}
          preview={previewMode}
          hideToolbar={previewMode === "preview"}
          visibleDragbar={false}
          height={520}
          data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
          className="custom-md-editor"
          style={{ backgroundColor: "transparent" }}
          textareaProps={{
            "aria-label": "cover letter text",
            className: "bg-transparent text-foreground placeholder:text-muted border-none outline-none resize-none font-sans text-sm leading-relaxed p-6",
            style: { backgroundColor: "transparent", color: "var(--foreground)" },
          }}
          previewOptions={{
            className: "prose max-w-none p-6 dark:prose-invert",
            style: { backgroundColor: "transparent", color: "var(--foreground)" },
          }}
        />
      </div>

      <div className="space-y-3">
        <WordCount text={editedContent} range={COVER_LETTER_WORDS} />
        <ClicheCheck text={editedContent || ""} />
        <p className="text-xs text-faint">before you send: add one specific project, and make sure no [placeholders] are left.</p>
      </div>

      <ParagraphSources content={editedContent} sources={sources} />

      <style jsx global>{`
        .custom-md-editor { background: transparent !important; border: none !important; box-shadow: none !important; }
        .custom-md-editor .w-md-editor-text-pre,
        .custom-md-editor .w-md-editor-text-textarea { background: transparent !important; color: var(--foreground) !important; }
        .custom-md-editor .wmde-markdown { background: transparent !important; color: var(--foreground) !important; }
        .custom-md-editor .w-md-editor-preview { background: transparent !important; border-left: 1px solid var(--line) !important; box-shadow: none !important; }
        .custom-md-editor .w-md-editor-toolbar { background: var(--soft) !important; border-bottom: 1px solid var(--line) !important; }
        .custom-md-editor .w-md-editor-toolbar button { color: var(--foreground) !important; }
        .custom-md-editor .w-md-editor-content { background: transparent !important; }
      `}</style>
    </div>
  );
};

export default CoverLetterPreview;
