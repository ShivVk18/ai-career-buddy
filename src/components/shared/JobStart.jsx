"use client";

import { useEffect, useState } from "react";
import { Briefcase, X } from "lucide-react";
import { toast } from "sonner";
import { getApplications } from "@/actions/Applications";
import { getJob } from "@/actions/Jobs";
import { generationErrorMessage } from "@/components/shared/generationError";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * "Start from one of your jobs" for the generator forms (progressive disclosure).
 * - Picking a job fetches it and calls onPick({ jobId, company, title, jdText }) so the form can pre-fill.
 * - The manual fields (children) stay mounted but hidden behind "enter details manually"; they open by themselves when
 *   there are no jobs, the jobs can't be loaded, or `hasErrors` is true. So every tool still works with no job at all.
 */
export default function JobStart({ onPick, onClear, hasErrors = false, children, manualLabel = "enter details manually", disabled = false }) {
  const [jobs, setJobs] = useState(null); // null = loading
  const [picked, setPicked] = useState(null);
  const [loadingJob, setLoadingJob] = useState(false);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    let alive = true;
    getApplications()
      .then((res) => {
        if (alive) setJobs(!res || res.error ? [] : res.applications || []);
      })
      .catch(() => alive && setJobs([]));
    return () => {
      alive = false;
    };
  }, []);

  const choose = async (jobId) => {
    setLoadingJob(true);
    try {
      const job = await getJob(jobId);
      if (!job || job.error) {
        toast.error(generationErrorMessage(job, "We couldn't open that job. You can enter the details by hand."));
        return;
      }
      const company = job.company || "";
      const title = job.title || "";
      setPicked({ jobId, company, title });
      onPick({ jobId, company, title, jdText: job.jdText || "" });
      // A job without a company or title still needs those two filled in.
      if (!company || !title) setManual(true);
    } catch {
      toast.error("We couldn't open that job. You can enter the details by hand.");
    } finally {
      setLoadingJob(false);
    }
  };

  const clear = () => {
    setPicked(null);
    onClear?.();
  };

  const hasJobs = Array.isArray(jobs) && jobs.length > 0;
  const showManual = manual || (jobs !== null && !hasJobs) || hasErrors;

  return (
    <div className="space-y-6">
      {jobs === null && <div className="h-12 w-full animate-pulse rounded-md bg-soft" aria-busy="true" aria-label="Loading your jobs" />}
      {hasJobs && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Start from one of your jobs</p>
          {picked ? (
            <div className="flex items-center gap-3 rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
              <Briefcase className="h-4 w-4 shrink-0 text-primary-ink" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{[picked.company, picked.title].filter(Boolean).join(" - ") || "Untitled job"}</span>
              <button
                type="button"
                onClick={clear}
                aria-label="Use a different job"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Select onValueChange={choose} disabled={disabled || loadingJob}>
              <SelectTrigger className="h-12 w-full" aria-label="Pick one of your jobs">
                <SelectValue placeholder={loadingJob ? "Opening that job…" : "Pick a job to fill this in"} />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((a) => (
                  <SelectItem key={a.job.id} value={a.job.id}>
                    {[a.job.company, a.job.title].filter(Boolean).join(" - ") || "Untitled job"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
      {hasJobs && !showManual && (
        <button
          type="button"
          onClick={() => setManual(true)}
          className="min-h-10 rounded text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-primary"
        >
          {picked ? "edit details" : manualLabel}
        </button>
      )}
      <div className={showManual ? "space-y-8" : "hidden"}>{children}</div>
    </div>
  );
}
