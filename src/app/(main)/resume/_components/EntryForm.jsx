'use client'
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parse, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { entrySchema } from "@/app/lib/schema";
import { Sparkles, PlusCircle, X, Loader2, Calendar, CheckCircle2, Trash2 } from "lucide-react";
import { improveWithAI } from "@/actions/Resume";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { Mic } from "lucide-react";

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

  const { isRecording, toggleRecording, isSupported } = useSpeechToText((text) => {
    setValue("description", initialDescription + (initialDescription && text ? " " : "") + text);
  });

  const handleToggleRecording = () => {
    if (!isRecording) setInitialDescription(watch("description") || "");
    toggleRecording();
  };

  const handleAdd = handleValidation((data) => {
    const formattedEntry = {
      ...data,
      startDate: formatDisplayDate(data.startDate),
      endDate: data.current ? "" : formatDisplayDate(data.endDate),
    };

    onChange([...entries, formattedEntry]);

    reset();
    setIsAdding(false);
  });

  const handleDelete = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    onChange(newEntries);
  };

  const [isImproving, setIsImproving] = useState(false);

  const handleImproveDescription = async () => {
    const description = watch("description");
    if (!description) {
      toast.error("Please enter a description first");
      return;
    }

    setIsImproving(true);
    try {
      const improvedContent = await improveWithAI({
        current: description,
        type: type.toLowerCase(),
      });
      setValue("description", improvedContent);
      toast.success("Description improved by AI! ✨");
    } catch (error) {
      toast.error(error.message || "Failed to improve description");
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* List of existing entries */}
      <div className="space-y-6">
        {entries.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-border bg-divider/10 rounded-sm p-6 relative group hover:border-accent transition-editorial shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-clash font-bold text-foreground uppercase tracking-tight mb-1">
                  {item.title}
                </h4>
                <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">
                  {item.organization}
                </p>
                <div className="flex items-center text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em]">
                  <Calendar className="h-3.5 w-3.5 mr-3 text-accent" />
                  {item.current
                    ? `${item.startDate} - Present`
                    : `${item.startDate} - ${item.endDate}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="opacity-0 group-hover:opacity-100 transition-editorial text-muted-foreground hover:text-destructive p-2"
                title="Delete Entry"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {item.description && (
              <div className="mt-6 pt-6 border-t border-divider text-sm text-muted-foreground font-general font-light leading-relaxed whitespace-pre-wrap">
                {item.description}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-accent/50 bg-background rounded-sm overflow-hidden shadow-xl"
          >
            <div className="p-8">
              <h4 className="text-xs font-bold tracking-[0.3em] text-accent uppercase mb-10 flex items-center gap-3">
                <PlusCircle className="h-4 w-4" />
                Add New {type}
              </h4>
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                      {type === "Education" ? "Degree / Certificate" : "Job Title / Role"}
                    </label>
                    <Input
                      placeholder={type === "Education" ? "e.g. Bachelor of Science" : "e.g. Software Engineer"}
                      {...register("title")}
                      className="h-12"
                    />
                    {errors.title && (
                      <p className="text-[10px] text-destructive font-bold uppercase tracking-widest animate-pulse">{errors.title.message}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                      {type === "Education" ? "School / University" : "Company / Organization"}
                    </label>
                    <Input
                      placeholder={type === "Education" ? "e.g. Harvard University" : "e.g. Google"}
                      {...register("organization")}
                      className="h-12"
                    />
                    {errors.organization && (
                      <p className="text-[10px] text-destructive font-bold uppercase tracking-widest animate-pulse">
                        {errors.organization.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                      Start Date
                    </label>
                    <Input
                      type="month"
                      {...register("startDate")}
                      className="h-12"
                    />
                    {errors.startDate && (
                      <p className="text-[10px] text-destructive font-bold uppercase tracking-widest animate-pulse">
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                      End Date
                    </label>
                    <Input
                      type="month"
                      {...register("endDate")}
                      disabled={current}
                      className={`h-12 ${current ? "opacity-30" : ""}`}
                    />
                    {errors.endDate && (
                      <p className="text-[10px] text-destructive font-bold uppercase tracking-widest animate-pulse">
                        {errors.endDate.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 group cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    id="current"
                    {...register("current")}
                    onChange={(e) => {
                      setValue("current", e.target.checked);
                      if (e.target.checked) {
                        setValue("endDate", "");
                      }
                    }}
                    className="w-4 h-4 rounded-sm border-divider bg-background text-accent focus:ring-accent focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="current" className="text-[10px] font-bold tracking-widest text-muted-foreground group-hover:text-foreground transition-colors uppercase cursor-pointer">
                    I currently {type === "Education" ? "study" : "work"} here
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                      Description & Achievements
                    </label>
                    <div className="flex gap-4">
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
                        onClick={handleImproveDescription}
                        disabled={isImproving || !watch("description")}
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
                    placeholder={`Tell us about your impact and key wins in this role...`}
                    className="h-40 w-full px-4 py-4 bg-divider/5 border border-divider/40 rounded-sm focus:outline-none focus:border-accent transition-editorial font-general text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-[10px] text-destructive font-bold uppercase tracking-widest animate-pulse">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-6 mt-12 pt-8 border-t border-divider/30">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    reset();
                    setIsAdding(false);
                  }}
                  className="h-12 px-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  className="h-12 px-10 shadow-lg"
                >
                  <CheckCircle2 className="h-4 w-4 mr-3" />
                  Add to Resume
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full border border-divider border-dashed bg-divider/5 hover:border-accent hover:bg-accent/5 py-10 rounded-sm transition-editorial flex items-center justify-center gap-4 group shadow-sm"
        >
          <PlusCircle className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-editorial" />
          <span className="text-xs font-bold tracking-[0.3em] text-muted-foreground group-hover:text-foreground uppercase transition-editorial">
            Add {type}
          </span>
        </button>
      )}
    </div>
  );
}