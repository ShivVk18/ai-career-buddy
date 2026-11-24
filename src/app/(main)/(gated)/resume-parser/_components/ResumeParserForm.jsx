'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, CheckCircle, Search } from 'lucide-react';
import { createATSAnalysis, getATSScoreById } from '@/actions/ResumeParser';
import { getResume } from '@/actions/Resume';
import { generationErrorMessage } from "@/components/shared/generationError";
import JobStart from "@/components/shared/JobStart";
import JobDetailsFields from "@/components/shared/JobDetailsFields";
import ToolFrame from "@/components/shared/ToolFrame";
import { ChoiceChips, FieldLabel, InkButton, Note } from "@/components/shared/ToolBits";
import PipStatus from "@/components/ui/PipStatus";
import { cn } from "@/lib/utils";
import AtsResult from "./AtsResult";
import AtsHistory from "./AtsHistory";

const MAX_PDF_BYTES = 5 * 1024 * 1024;

const ResumeParserComponent = ({ source, scan = createATSAnalysis, openById = getATSScoreById, loadResume = getResume, initialResult = null, skipHistory = false }) => {
  const [formData, setFormData] = useState({ companyName: '', jobTitle: '', jobDescription: '', resumePdf: null });
  const [jobId, setJobId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(initialResult);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState('');
  const [historyKey, setHistoryKey] = useState(0);
  const [hasSaved, setHasSaved] = useState(false);
  const [source_, setSource] = useState('saved'); // 'saved' | 'pdf'
  const [noResume, setNoResume] = useState(false);
  const useSaved = hasSaved && source_ === 'saved';

  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(() => loadResume())
      .then((r) => { if (alive) setHasSaved(!!r); })
      .catch(() => {});
    return () => { alive = false; };
  }, [loadResume]);

  const setField = (k, v) => setFormData((prev) => ({ ...prev, [k]: v }));

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNoResume(false);
    if (!formData.jobDescription.trim()) {
      setError("paste the job description, or pick one of your jobs.");
      return;
    }
    if (!useSaved && !formData.resumePdf) {
      setError("add your resume as a pdf, or build one first.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const base64Resume = useSaved ? null : await fileToBase64(formData.resumePdf);
      const response = await scan({
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        ...(useSaved ? { useSavedResume: true } : { resumeBase64: base64Resume, resumeType: formData.resumePdf.type }),
        ...(jobId ? { jobId } : {}),
      });
      if (response?.code === 'NO_RESUME') {
        setNoResume(true);
        setSource('pdf');
        setError("you don't have a saved resume yet.");
        return;
      }
      if (!response || !response.success) {
        setError(generationErrorMessage(response, "something went wrong while scanning. try again."));
        return;
      }
      setResult(response.data);
      setNotice('');
      setHistoryKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("ATS ERROR:", err);
      setError("we couldn't process your resume. check the file and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelection = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('that file is not a pdf. upload your resume as a pdf.');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError('that file is larger than 5 mb. upload a smaller pdf.');
      return;
    }
    setField('resumePdf', file);
    setError('');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelection(e.dataTransfer.files[0]);
  };

  const resetAll = () => {
    setResult(null);
    // Keep the chosen PDF so the next scan can reuse it without another upload.
    setFormData((prev) => ({ companyName: "", jobTitle: "", jobDescription: "", resumePdf: prev.resumePdf }));
    setJobId(null);
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pre-fill company, title and job description; the user only re-uploads the PDF (or uses the saved resume).
  const handleRerun = (row) => {
    setResult(null);
    setFormData({ companyName: row.companyName || '', jobTitle: row.jobTitle || '', jobDescription: row.jobDescription || '', resumePdf: null });
    setError('');
    setNotice(hasSaved ? 'job details are filled in from your earlier scan.' : 'job details are filled in from your earlier scan. upload your resume pdf to run it again.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openScore = async (id) => {
    setError('');
    try {
      const data = await openById(id);
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError("we couldn't open that result. try again.");
    }
  };

  if (result) {
    return (
      <ToolFrame title="resume scan" line="what the job wants, what you have, and what to fix." outfit="detective" bare className="max-w-5xl">
        {error && <Note tone="error" className="mb-5">{error}</Note>}
        <AtsResult
          key={result.id}
          result={result}
          onScanAnother={resetAll}
          onRerun={handleRerun}
          onOpenScore={openScore}
          onDeleted={() => {
            resetAll();
            setHistoryKey((k) => k + 1);
          }}
          onRestored={() => setHistoryKey((k) => k + 1)}
        />
      </ToolFrame>
    );
  }

  return (
    <>
      <ToolFrame title="resume scan" line="check your resume against a job. nothing is changed unless you accept a fix." outfit="detective" windowTitle="ascendai · resume scan">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <JobStart
            source={source}
            disabled={loading}
            hasErrors={(!!error && !formData.jobDescription.trim()) || !!notice}
            onPick={({ jobId: id, company, title, jdText }) => {
              setJobId(id);
              setFormData((prev) => ({ ...prev, companyName: company, jobTitle: title, jobDescription: jdText }));
            }}
            onClear={() => {
              setJobId(null);
              setFormData((prev) => ({ ...prev, companyName: '', jobTitle: '', jobDescription: '' }));
            }}
          >
            <JobDetailsFields idPrefix="ats" values={formData} onChange={setField} errors={{}} placeholder="paste the job description to see how your resume matches." />
          </JobStart>

          {/* which resume: chips when a saved one exists, a drop zone otherwise */}
          <div className="space-y-2.5">
            <FieldLabel>resume to scan</FieldLabel>
            {hasSaved && (
              <ChoiceChips label="resume to scan" value={source_} onChange={setSource} options={[['saved', 'my saved resume'], ['pdf', 'upload a pdf instead']]} />
            )}
            {!useSaved && (
              <div
                className={cn("rounded-[20px] border-2 border-dashed p-8 text-center transition-colors", dragActive ? "border-brand bg-brand-soft" : "border-line bg-bg hover:border-brand")}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input type="file" accept=".pdf" onChange={(e) => handleFileSelection(e.target.files[0])} className="sr-only" id="resume-upload" />
                <label htmlFor="resume-upload" className="block cursor-pointer rounded-[14px] outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                  {formData.resumePdf ? (
                    <span className="flex items-center justify-center gap-2 text-sm text-brand-ink">
                      <CheckCircle className="size-5" aria-hidden="true" /> {formData.resumePdf.name}
                    </span>
                  ) : (
                    <>
                      <Upload className="mx-auto size-8 text-faint" aria-hidden="true" />
                      <p className="mt-3 text-sm text-text">drop your resume pdf, or tap to choose</p>
                      <p className="mt-1 text-xs text-muted">pdf, up to 5 mb</p>
                    </>
                  )}
                </label>
              </div>
            )}
            {useSaved && <p className="text-xs text-muted" role="status">pip reads the resume you saved in the builder.</p>}
          </div>

          {notice && <Note>{notice}</Note>}
          {error && (
            <Note tone="error">
              {error}
              {noResume && <Link href="/resume" className="ml-2 underline">build your resume</Link>}
            </Note>
          )}

          {loading ? (
            <PipStatus outfit="detective" text="reading your resume against the job…" />
          ) : (
            <InkButton type="submit" busy={loading} busyText="scanning…">
              <Search className="size-4" aria-hidden="true" /> scan my resume
            </InkButton>
          )}
        </form>
      </ToolFrame>
      {!skipHistory && <AtsHistory onOpen={openScore} onRerun={handleRerun} refreshKey={historyKey} />}
    </>
  );
};

export default ResumeParserComponent;
