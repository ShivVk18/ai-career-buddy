import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Mic } from "lucide-react";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { improveWithAI } from "@/actions/Resume";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import SourceChips from "@/components/shared/SourceChips";
import { generationErrorMessage } from "@/components/shared/generationError";

export const AITextarea = React.forwardRef(({ label, type, value, onChange, placeholder, ...props }, ref) => {
  const [initialText, setInitialText] = useState("");
  
  const typedRef = useRef(false);
  const { isRecording, toggleRecording, isSupported } = useSpeechToText((text) => {
    if (typedRef.current) return; // user typed after stopping: late results must not overwrite
    if (onChange) {
      onChange({ target: { value: initialText + (initialText && text ? " " : "") + text } });
    }
  });

  const handleToggleRecording = () => {
    if (!isRecording) {
      setInitialText(value || "");
      typedRef.current = false;
    }
    toggleRecording();
  };

  const [isImproving, setIsImproving] = useState(false);
  const [improvedSources, setImprovedSources] = useState([]);

  const handleImprove = async () => {
    if (!value) {
      toast.error("write a line first, then improve it");
      return;
    }

    setIsImproving(true);
    try {
      const result = await improveWithAI({
        current: value,
        type: type,
      });
      if (!result || result.error || typeof result.text !== "string") {
        toast.error(
          generationErrorMessage(result, "Failed to improve content")
        );
        return;
      }
      if (onChange) {
        onChange({ target: { value: result.text } });
      }
      setImprovedSources(result.sources || []);
      toast.success("improved. check it still sounds like you");
    } catch (error) {
      toast.error(error.message || `Failed to improve content`);
    } finally {
      setIsImproving(false);
    }
  };

  const small = "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm text-brand-ink outline-none hover:bg-brand-soft focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {label ? <label className="text-xs font-medium text-muted">{label}</label> : <div />}
        <div className="flex items-center gap-1">
          {isSupported && (
            <button type="button" onClick={handleToggleRecording} aria-pressed={isRecording} className={`${small} ${isRecording ? "!text-danger" : ""}`}>
              <Mic className="size-3.5" aria-hidden="true" />
              <span>{isRecording ? "recording…" : "dictate"}</span>
            </button>
          )}
          <button type="button" onClick={handleImprove} disabled={isImproving || !value} className={small}>
            {isImproving ? <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Sparkles className="size-3.5" aria-hidden="true" />}
            <span>{isImproving ? "improving…" : "improve with ai"}</span>
          </button>
        </div>
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          if (isRecording) {
            typedRef.current = true;
            toggleRecording();
          }
          if (onChange) onChange(e);
        }}
        placeholder={placeholder}
        className="h-36 w-full rounded-lg border border-line bg-bg px-3.5 py-3 text-sm leading-relaxed text-text outline-none placeholder:text-faint focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
        {...props}
      />
      <SourceChips sources={improvedSources} heading="based on" />
    </div>
  );
});

AITextarea.displayName = 'AITextarea';
