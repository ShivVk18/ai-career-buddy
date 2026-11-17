import React, { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Mic } from "lucide-react";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { improveWithAI } from "@/actions/Resume";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

export const AITextarea = React.forwardRef(({ label, type, value, onChange, placeholder, ...props }, ref) => {
  const [initialText, setInitialText] = useState("");
  
  const { isRecording, toggleRecording, isSupported } = useSpeechToText((text) => {
    if (onChange) {
      onChange({ target: { value: initialText + (initialText && text ? " " : "") + text } });
    }
  });

  const handleToggleRecording = () => {
    if (!isRecording) setInitialText(value || "");
    toggleRecording();
  };

  const [isImproving, setIsImproving] = useState(false);

  const handleImprove = async () => {
    if (!value) {
      toast.error(`Please enter some content first`);
      return;
    }

    setIsImproving(true);
    try {
      const improvedContent = await improveWithAI({
        current: value,
        type: type,
      });
      if (onChange) {
        onChange({ target: { value: improvedContent } });
      }
      toast.success(`${label || 'Content'} improved by AI! ✨`);
    } catch (error) {
      toast.error(error.message || `Failed to improve content`);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {label ? (
          <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-3">
            {label}
          </label>
        ) : <div />}
        <div className="flex gap-4 items-center">
          {isSupported && (
            <button
              type="button"
              onClick={handleToggleRecording}
              className={`text-[9px] font-bold tracking-widest transition-editorial uppercase flex items-center gap-2 group ${isRecording ? 'text-destructive animate-pulse' : 'text-accent hover:text-foreground'}`}
            >
              <Mic className={`h-3.5 w-3.5 ${!isRecording && 'group-hover:scale-110 transition-transform'}`} />
              <span>{isRecording ? "Recording..." : "Dictate"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleImprove}
            disabled={isImproving || !value}
            className="text-[9px] font-bold tracking-widest text-accent hover:text-foreground transition-editorial uppercase flex items-center gap-2 disabled:opacity-30 group"
          >
            {isImproving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Improving...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                <span>Improve with AI</span>
              </>
            )}
          </button>
        </div>
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-40 w-full px-4 py-4 bg-divider/5 border border-border rounded-sm focus:outline-none focus:border-accent transition-editorial font-general text-sm leading-relaxed"
        {...props}
      />
    </div>
  );
});

AITextarea.displayName = 'AITextarea';
