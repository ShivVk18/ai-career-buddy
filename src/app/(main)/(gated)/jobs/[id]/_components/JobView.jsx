"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Download, ExternalLink, FileText, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getJob, updateJobField, deleteJob, restoreJob } from "@/actions/Jobs";
import { getPipeline, runNextStep } from "@/actions/Pipeline";
import { getCoverLetter } from "@/actions/CoverLetter";
import { EditableChip } from "@/components/shared/EditableChips";
import { generationErrorMessage } from "@/components/shared/generationError";
import PipelineProgress from "./PipelineProgress";
import StatusActions from "./StatusActions";

const FIELDS = [
  { key: "company", placeholder: "add company" },
  { key: "title", placeholder: "add job title" },
  { key: "location", placeholder: "add location" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function JobView({ id, notice }) {
  const router = useRouter();
  const [state, setState] = useState({ status: "loading", job: null, error: null, code: null });
  const [pipeline, setPipeline] = useState(null);
  const [driving, setDriving] = useState(false);
  const [callError, setCallError] = useState(null);
  const runningRef = useRef(false);
  const aliveRef = useRef(true);
  const jobRef = useRef(null);

  const setJob = useCallback((fn) => {
    setState((s) => {
      const job = typeof fn === "function" ? fn(s.job) : fn;
      jobRef.current = job;
      return { ...s, job };
    });
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Runs the pipeline one step at a time until complete, a step fails, or the page is left.
  const drive = useCallback(async (applicationId) => {
    if (runningRef.current) return;
    runningRef.current = true;
    setDriving(true);
    setCallError(null);
    try {
      while (aliveRef.current) {
        let res;
        try {
          res = await runNextStep(applicationId);
        } catch {
          setCallError("We lost the connection. Retry to carry on where pip left off.");
          break;
        }
        if (!res) break;
        if (res.steps) setPipeline(res);
        if (res.error && !res.steps) {
          setCallError(generationErrorMessage(res, "We couldn't run the next step."));
          break;
        }
        if (res.error && res.step) break; // a step failed: shown on its row with Retry
        if (res.complete) break;
        if (res.busy && !res.ran) await sleep(2000);
      }
    } finally {
      runningRef.current = false;
      if (aliveRef.current) setDriving(false);
    }
  }, []);

  const load = useCallback(async () => {
    setState({ status: "loading", job: null, error: null, code: null });
    let job;
    try {
      job = await getJob(id);
    } catch {
      setState({ status: "error", job: null, error: "We couldn't load this job.", code: "FAILED" });
      return;
    }
    if (!job || job.error) {
      setState({ status: "error", job: null, error: job?.error || "We couldn't load this job.", code: job?.code || "FAILED" });
      return;
    }
    jobRef.current = job;
    setState({ status: "ready", job, error: null, code: null });
    if (job.application) {
      const p = await getPipeline(job.application.id).catch(() => null);
      if (p && !p.error) {
        setPipeline(p);
        // Resume on load only if it is incomplete and nothing failed before (a failure waits for the user's Retry).
        if (!p.complete && !p.steps.some((s) => s.status === "failed")) drive(job.application.id);
      } else {
        setCallError(generationErrorMessage(p, "We couldn't load pip's progress."));
      }
    }
  }, [id, drive]);

  useEffect(() => {
    load();
  }, [load]);

  const job = state.job;

  const saveField = async (field, value) => {
    const before = jobRef.current;
    const next = value.trim() || null;
    setJob((j) => ({ ...j, [field]: next, sources: { ...j.sources, [field]: [] }, origin: { ...j.origin, [field]: next ? "user" : null } }));
    let res;
    try {
      res = await updateJobField(id, field, next);
    } catch {
      res = { error: "We couldn't reach the server.", code: "FAILED" };
    }
    if (!res || res.error) {
      setJob(before); // rollback
      toast.error(generationErrorMessage(res, "That didn't save. Nothing changed."));
      return;
    }
    setJob((j) => ({ ...j, ...res, jdText: j.jdText, application: j.application }));
  };

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied`);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it by hand.");
    }
  };

  const letterId = pipeline?.steps?.find((s) => s.step === "WRITER" && s.status === "done")?.ids?.coverLetterId;

  const copyLetter = async () => {
    try {
      const l = await getCoverLetter(letterId);
      if (!l?.content) throw new Error("empty");
      await copy(l.content, "Letter");
    } catch {
      toast.error("Couldn't load the letter.");
    }
  };

  const downloadLetterPdf = async () => {
    const t = toast.loading("Preparing your PDF…");
    try {
      const l = await getCoverLetter(letterId);
      if (!l?.content) throw new Error("empty");
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(l.content.replace(/[#*_`>]/g, ""), 170);
      let y = 20;
      for (const line of lines) {
        if (y > 280) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 20, y);
        y += 6;
      }
      const name = [job?.company, "cover_letter"].filter(Boolean).join("_").replace(/\s+/g, "_");
      pdf.save(`${name || "cover_letter"}_AscendAI.pdf`);
      toast.success("PDF downloaded", { id: t });
    } catch {
      toast.error("Couldn't make the PDF. Try again.", { id: t });
    }
  };

  const removeJob = async () => {
    const res = await deleteJob(id).catch(() => null);
    if (!res || res.error) {
      toast.error(generationErrorMessage(res, "Couldn't delete this job."));
      return;
    }
    toast("Job deleted", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: async () => {
          const r = await restoreJob(id).catch(() => null);
          if (!r || r.error) toast.error("Couldn't restore it. It may have expired.");
          else {
            toast.success("Job restored");
            router.push(`/jobs/${id}`);
          }
        },
      },
    });
    router.push("/dashboard");
  };

  if (state.status === "loading") {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-5" aria-busy="true" aria-label="Loading job">
        <div className="h-8 w-2/3 animate-pulse rounded-lg bg-soft" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-soft" />
        <div className="h-64 w-full animate-pulse rounded-lg bg-soft" />
      </div>
    );
  }

  if (state.status === "error") {
    const gone = state.code === "NOT_FOUND";
    return (
      <div className="p-4 sm:p-8 max-w-xl mx-auto">
        <div role="alert" className="panel-cozy border border-line bg-panel p-8 text-center space-y-4">
          <Image src="/pip/pip-coffee.svg" alt="" width={96} height={96} className="mx-auto" style={{ imageRendering: "pixelated" }} unoptimized />
          <h1 className="text-lg font-semibold text-text">{gone ? "We couldn't find that job" : "We couldn't load this job"}</h1>
          <p className="text-sm text-muted">{gone ? "It may have been deleted." : state.error}</p>
          <div className="flex justify-center gap-3">
            {!gone && (
              <button type="button" onClick={load} className="btn-pill-primary min-h-11 px-6 text-sm inline-flex items-center gap-2">
                <RotateCw className="h-4 w-4" aria-hidden="true" /> Retry
              </button>
            )}
            <Link href="/dashboard" className="btn-pill-secondary min-h-11 px-6 text-sm inline-flex items-center">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const missing = FIELDS.some((f) => !job[f.key]);
  const action =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-panel px-4 text-xs font-medium text-text outline-none transition hover:border-pip focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <Link href="/dashboard" className="inline-flex min-h-10 items-center gap-1.5 text-xs text-muted hover:text-text rounded focus-visible:ring-2 focus-visible:ring-pip/50">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> home
      </Link>

      <section aria-label="Job details" className="panel-cozy border border-line bg-panel p-5 sm:p-6 space-y-4">
        <h1 className="text-lg font-semibold text-text">{job.title || job.company ? [job.title, job.company].filter(Boolean).join(" at ") : "New job"}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {FIELDS.map((f) => (
            <EditableChip
              key={f.key}
              label={job[f.key] || ""}
              placeholder={f.placeholder}
              sources={job.sources?.[f.key]}
              maxLength={200}
              onSave={(v) => saveField(f.key, v)}
            />
          ))}
        </div>
        {missing && (notice === "AI_LIMIT" || notice === "AI_UNAVAILABLE" || notice === "EXTRACT_FAILED" ? (
          <p className="text-xs text-muted" role="status">
            {notice === "EXTRACT_FAILED"
              ? "We couldn't read every detail from this job."
              : "Pip couldn't fill in the details this time."}{" "}
            Tap a chip above to fill it in.
          </p>
        ) : (
          <p className="text-xs text-muted">Tap a chip to fill in what's missing. Press Enter to save, Esc to cancel.</p>
        ))}

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button type="button" onClick={() => copy(job.jdText || "", "Job description")} disabled={!job.jdText} className={`${action} disabled:opacity-50`}>
            <Copy className="h-4 w-4" aria-hidden="true" /> Copy job text
          </button>
          {letterId && (
            <>
              <button type="button" onClick={copyLetter} className={action}>
                <FileText className="h-4 w-4" aria-hidden="true" /> Copy letter
              </button>
              <button type="button" onClick={downloadLetterPdf} className={action}>
                <Download className="h-4 w-4" aria-hidden="true" /> Letter PDF
              </button>
            </>
          )}
          <Link href="/resume" className={action}>
            <Download className="h-4 w-4" aria-hidden="true" /> Resume PDF
          </Link>
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className={action}>
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open job page
            </a>
          )}
        </div>
      </section>

      <nav aria-label="Tools for this job" className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-muted">tools for this job</span>
        {[
          ["resume tailor", `/resume?job=${job.id}`],
          ["cover letter", `/cover-letter/new?job=${job.id}`],
          ["cold email", `/cold-email/new?job=${job.id}`],
          ["interview prep", "/interview"],
          ["ats check", `/resume-parser?job=${job.id}`],
        ].map(([label, href]) => (
          <Link key={label} href={href} className="inline-flex min-h-11 items-center rounded-full border border-line bg-panel px-4 text-xs text-text transition hover:border-brand/50 sm:min-h-9">
            {label}
          </Link>
        ))}
      </nav>

      {job.application ? (
        <>
          <PipelineProgress
            pipeline={pipeline}
            driving={driving}
            callError={callError}
            onRetry={() => (pipeline ? drive(job.application.id) : load())}
          />
          <StatusActions
            application={job.application}
            onChange={(app) => setJob((j) => ({ ...j, application: app }))}
          />
        </>
      ) : (
        <p className="text-sm text-muted">This job has no application yet.</p>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={removeJob}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-xs text-muted outline-none transition hover:text-danger focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete this job
        </button>
      </div>
    </div>
  );
}
