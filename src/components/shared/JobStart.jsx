"use client";

import { useEffect, useState } from "react";
import { Briefcase, X } from "lucide-react";
import { toast } from "sonner";
import { getApplications } from "@/actions/Applications";
import { getJob } from "@/actions/Jobs";
import { generationErrorMessage } from "@/components/shared/generationError";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Skeleton from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const SHOWN = 4;
const label = (j) => [j.company, j.title].filter(Boolean).join(" · ") || "untitled job";

/**
 * "start from one of your jobs" for the generator forms. Jobs are tap chips.
 * - Picking a job fetches it and calls onPick({ jobId, company, title, jdText }) so the form can pre-fill.
 * - The manual fields (children) stay mounted but hidden behind "enter details by hand"; they open by themselves when
 *   there are no jobs, the jobs can't be loaded, or `hasErrors` is true. So every tool still works with no job at all.
 * - `source` ({ listJobs, getJob }) lets dev pages mock the data.
 */
export default function JobStart({ onPick, onClear, hasErrors = false, children, manualLabel = "enter details by hand", disabled = false, source }) {
  const [jobs, setJobs] = useState(null); // null = loading
  const [picked, setPicked] = useState(null);
  const [loadingJob, setLoadingJob] = useState(false);
  const [manual, setManual] = useState(false);
  const list = source?.listJobs;
  const fetchJob = source?.getJob || getJob;

  useEffect(() => {
    let alive = true;
    const load = list ? list() : getApplications().then((res) => (!res || res.error ? [] : res.applications || []));
    Promise.resolve(load)
      .then((rows) => alive && setJobs(rows || []))
      .catch(() => alive && setJobs([]));
    return () => {
      alive = false;
    };
  }, [list]);

  const choose = async (jobId) => {
    setLoadingJob(true);
    try {
      const job = await fetchJob(jobId);
      if (!job || job.error) {
        toast.error(generationErrorMessage(job, "we couldn't open that job. you can enter the details by hand."));
        return;
      }
      const company = job.company || "";
      const title = job.title || "";
      setPicked({ jobId, company, title });
      onPick({ jobId, company, title, jdText: job.jdText || "" });
      // A job with no description still needs one typed in.
      if (!job.jdText) setManual(true);
    } catch {
      toast.error("we couldn't open that job. you can enter the details by hand.");
    } finally {
      setLoadingJob(false);
    }
  };

  // Contextual links from a job page (?job=<id>) start the tool with that job already picked.
  const [autoDone, setAutoDone] = useState(false);
  useEffect(() => {
    if (autoDone || jobs === null) return;
    setAutoDone(true);
    const id = new URLSearchParams(window.location.search).get("job");
    if (id && jobs.some((a) => a.job?.id === id)) choose(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, autoDone]);

  const clear = () => {
    setPicked(null);
    onClear?.();
  };

  const hasJobs = Array.isArray(jobs) && jobs.length > 0;
  const showManual = manual || (jobs !== null && !hasJobs) || hasErrors;
  const first = hasJobs ? jobs.slice(0, SHOWN) : [];
  const rest = hasJobs ? jobs.slice(SHOWN) : [];

  return (
    <div className="space-y-5">
      {jobs === null && (
        <div aria-busy="true" aria-label="loading your jobs" className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-44" />
        </div>
      )}
      {hasJobs && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted">start from one of your jobs</p>
          {picked ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="fade-up inline-flex min-h-10 max-w-full items-center gap-2 rounded-[9px] bg-brand-soft py-1 pl-3 pr-1 text-sm text-brand-ink">
                <Briefcase className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{label(picked)}</span>
                <button
                  type="button"
                  onClick={clear}
                  aria-label="use a different job"
                  className="grid size-8 shrink-0 place-items-center rounded-[7px] outline-none hover:bg-brand/20 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="your jobs">
              {first.map((a) => (
                <button
                  key={a.job.id}
                  type="button"
                  disabled={disabled || loadingJob}
                  onClick={() => choose(a.job.id)}
                  className={cn(
                    "inline-flex min-h-10 max-w-full items-center gap-2 rounded-[9px] bg-soft px-3.5 text-sm text-text outline-none transition-colors hover:bg-brand-soft hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                  )}
                >
                  <Briefcase className="size-4 shrink-0 text-faint" aria-hidden="true" />
                  <span className="truncate">{label(a.job)}</span>
                </button>
              ))}
              {rest.length > 0 && (
                <Select onValueChange={choose} disabled={disabled || loadingJob}>
                  <SelectTrigger className="h-10 w-auto min-w-32 rounded-[9px] border-dashed" aria-label="more of your jobs">
                    <SelectValue placeholder={`${rest.length} more`} />
                  </SelectTrigger>
                  <SelectContent>
                    {rest.map((a) => (
                      <SelectItem key={a.job.id} value={a.job.id}>
                        {label(a.job)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {loadingJob && <span className="text-xs text-muted" role="status">opening that job…</span>}
            </div>
          )}
        </div>
      )}
      {hasJobs && !showManual && (
        <button
          type="button"
          onClick={() => setManual(true)}
          className="min-h-10 rounded-full text-sm text-muted underline-offset-4 outline-none hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {picked ? "edit details" : manualLabel}
        </button>
      )}
      <div className={showManual ? "space-y-5" : "hidden"}>{children}</div>
    </div>
  );
}
