'use client'
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parse, format } from "date-fns";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Plus, Loader2, Calendar, Check, Trash2 } from "lucide-react";
import { FieldError, FieldLabel, More, fieldClass } from "@/components/shared/ToolBits";
import { cn } from "@/lib/utils";
import { improveWithAI } from "@/actions/Resume";
import { toast } from "sonner";
import { generationErrorMessage } from "@/components/shared/generationError";
import useFetch from "@/hooks/use-fetch";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { Mic } from "lucide-react";
import SourceChips from "@/components/shared/SourceChips";

// Dates are optional (kept under "more: dates"); the server never required them.
const entrySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "add a title"),
  organization: z.string().min(1, "add the organization"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().min(1, "add a line about your impact"),
  current: z.boolean().default(false),
});

const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = parse(dateString, "yyyy-MM", new Date());
    return format(date, "MMM yyyy");
  } catch (e) {
    return dateString;
  }
};

export function EntryForm({ type, entries, onChange }) {
  const [isAdding, setIsAdding] = useState(false);
  const [initialDescription, setInitialDescription] = useState("");
  const [datesOpen, setDatesOpen] = useState(false);

  const {
    register,
    handleSubmit: handleValidation,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      title: "",
      organization: "",
      startDate: "",
      endDate: "",
      description: "",
      current: false,
    },
  });

  const current = watch("current");

  const typedRef = useRef(false);
  const { isRecording, toggleRecording, isSupported } = useSpeechToText((text) => {
    if (typedRef.current) return; // user typed after stopping: late results must not overwrite
    setValue("description", initialDescription + (initialDescription && text ? " " : "") + text);
  });

  const handleToggleRecording = () => {
    if (!isRecording) {
      setInitialDescription(watch("description") || "");
      typedRef.current = false;
    }
    toggleRecording();
  };

  const handleAdd = handleValidation((data) => {
    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `e_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    const formattedEntry = {
      ...data,
      id: newId,
      startDate: formatDisplayDate(data.startDate),
      endDate: data.current ? "" : formatDisplayDate(data.endDate),
    };

    onChange([...entries, formattedEntry]);

    reset();
    setImprovedSources([]);
    setIsAdding(false);
    setDatesOpen(false);
  });

  const handleDelete = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    onChange(newEntries);
  };

  const [isImproving, setIsImproving] = useState(false);
  const [improvedSources, setImprovedSources] = useState([]);

  const handleImproveDescription = async () => {
    const description = watch("description");
    if (!description) {
      toast.error("write a line first, then improve it");
      return;
    }

    setIsImproving(true);
    try {
      const result = await improveWithAI({
        current: description,
        type: type.toLowerCase(),
      });
      if (!result || result.error || typeof result.text !== "string") {
        toast.error(generationErrorMessage(result, "Failed to improve description"));
        return;
      }
      setValue("description", result.text);
      setImprovedSources(result.sources || []);
      toast.success("improved. check it still sounds like you");
    } catch (error) {
      toast.error(error.message || "Failed to improve description");
    } finally {
      setIsImproving(false);
    }
  };

  const org = type === "Education" ? "school / university" : "company / organization";
  const role = type === "Education" ? "degree / certificate" : "job title / role";
  const small = "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

  return (
    <div className="space-y-4">
      {entries.length === 0 && !isAdding && <p className="text-sm text-muted">nothing here yet. add one below, or import from a pdf on the resume tab.</p>}
      <ul className="space-y-3">
        {entries.map((item, index) => (
          <li key={item.id ?? index} className="fade-up relative rounded-[14px] border border-line bg-soft p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-doc text-lg leading-snug text-text">{item.title}</h4>
                <p className="text-sm text-brand-ink">{item.organization}</p>
                {(item.startDate || item.endDate || item.current) && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                    <Calendar className="size-3.5" aria-hidden="true" />
                    {[item.startDate, item.current ? "present" : item.endDate].filter(Boolean).join(" to ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                aria-label={`delete ${item.title || "entry"}`}
                className="grid size-11 shrink-0 place-items-center rounded-full text-faint outline-none hover:bg-gap-soft hover:text-gap-ink focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
            {item.description && <p className="mt-3 whitespace-pre-wrap border-t border-dashed border-line pt-3 text-sm leading-relaxed text-muted">{item.description}</p>}
          </li>
        ))}
      </ul>

      {isAdding && (
        <div className="fade-up space-y-5 rounded-[20px] border border-brand/50 bg-panel p-4 sm:p-6">
          <h4 className="font-doc text-lg text-text">add {type.toLowerCase() === "projects" ? "a project" : type === "Education" ? "education" : "an experience"}</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${type}-title`}>{role}</FieldLabel>
              <input id={`${type}-title`} placeholder={type === "Education" ? "bachelor of science" : "software engineer"} {...register("title")} className={cn(fieldClass, "mt-1.5 h-11")} />
              <FieldError>{errors.title?.message}</FieldError>
            </div>
            <div>
              <FieldLabel htmlFor={`${type}-org`}>{org}</FieldLabel>
              <input id={`${type}-org`} placeholder={type === "Education" ? "state university" : "acme"} {...register("organization")} className={cn(fieldClass, "mt-1.5 h-11")} />
              <FieldError>{errors.organization?.message}</FieldError>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FieldLabel htmlFor={`${type}-desc`}>what you did and what changed</FieldLabel>
              <div className="flex items-center gap-1">
                {isSupported && (
                  <button type="button" onClick={handleToggleRecording} aria-pressed={isRecording} className={cn(small, isRecording ? "text-danger" : "text-brand-ink hover:bg-brand-soft")}>
                    <Mic className="size-3.5" aria-hidden="true" /> {isRecording ? "recording…" : "dictate"}
                  </button>
                )}
                <button type="button" onClick={handleImproveDescription} disabled={isImproving || !watch("description")} className={cn(small, "text-brand-ink hover:bg-brand-soft")}>
                  {isImproving ? <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Sparkles className="size-3.5" aria-hidden="true" />}
                  {isImproving ? "improving…" : "improve with ai"}
                </button>
              </div>
            </div>
            <Textarea
              id={`${type}-desc`}
              placeholder="cut load time from 3.8s to 1.1s by code-splitting routes"
              className={cn(fieldClass, "h-32 py-3")}
              {...register("description", {
                onChange: () => {
                  if (isRecording) {
                    typedRef.current = true;
                    toggleRecording();
                  }
                },
              })}
            />
            <SourceChips sources={improvedSources} heading="based on" />
            <FieldError>{errors.description?.message}</FieldError>
          </div>

          <More open={datesOpen} onToggle={() => setDatesOpen((v) => !v)} label="more: dates (optional)">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor={`${type}-start`}>start</FieldLabel>
                <input id={`${type}-start`} type="month" {...register("startDate")} className={cn(fieldClass, "mt-1.5 h-11")} />
              </div>
              <div>
                <FieldLabel htmlFor={`${type}-end`}>end</FieldLabel>
                <input id={`${type}-end`} type="month" {...register("endDate")} disabled={current} className={cn(fieldClass, "mt-1.5 h-11", current && "opacity-40")} />
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!current}
              onClick={() => {
                setValue("current", !current);
                if (!current) setValue("endDate", "");
              }}
              className={cn("inline-flex min-h-10 items-center gap-2 rounded-[9px] px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", current ? "bg-brand-soft text-brand-ink ring-1 ring-brand/50" : "bg-soft text-muted hover:text-text")}
            >
              {current && <Check className="size-4" aria-hidden="true" />} i currently {type === "Education" ? "study" : "work"} here
            </button>
          </More>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                reset();
                setImprovedSources([]);
                setIsAdding(false);
                setDatesOpen(false);
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-6 text-sm text-text outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring"
            >
              cancel
            </button>
            <button type="button" onClick={handleAdd} className="btn-ink inline-flex min-h-11 items-center justify-center gap-2 px-6 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Check className="size-4" aria-hidden="true" /> add to resume
            </button>
          </div>
        </div>
      )}

      {!isAdding && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-line text-sm text-muted outline-none transition-colors hover:border-brand hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-4" aria-hidden="true" /> add {type === "Education" ? "education" : type === "Projects" ? "a project" : "an experience"}
        </button>
      )}
    </div>
  );
}
