'use client'

import React, { useState } from 'react';
import { Upload, FileText, Loader, AlertCircle, CheckCircle, Target, TrendingUp, Sparkles, Zap, Brain, Search } from 'lucide-react';
import { createATSAnalysis } from '@/actions/ResumeParser';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generationErrorMessage } from "@/components/shared/generationError";
import { getATSScoreById } from "@/actions/ResumeParser";
import JobStart from "@/components/shared/JobStart";
import AtsResult from "./AtsResult";
import AtsHistory from "./AtsHistory";

const MAX_PDF_BYTES = 5 * 1024 * 1024;

const ResumeParserComponent = () => {

  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    resumePdf: null
  });

  const [jobId, setJobId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState('');
  const [historyKey, setHistoryKey] = useState(0);

  // Convert PDF → base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.resumePdf) {
      setError("Please upload your resume in PDF format");
      return;
    }

    if (!formData.jobDescription) {
      setError("Please provide a job description for better matching");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const base64Resume = await fileToBase64(formData.resumePdf);

      const response = await createATSAnalysis({
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        resumeBase64: base64Resume,
        resumeType: formData.resumePdf.type,
        ...(jobId ? { jobId } : {}),
      });

      if (!response || !response.success) {
        setError(generationErrorMessage(response, "Something went wrong while scanning. Please try again."));
        setLoading(false);
        return;
      }

      setResult(response.data);
      setNotice('');
      setHistoryKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error("ATS ERROR:", err);
      setError("We couldn't process your resume. Please check the file and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelection(file);
  };

  const handleFileSelection = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('That file is not a PDF. Please upload your resume as a PDF.');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError('That file is larger than 5 MB. Please upload a smaller PDF.');
      return;
    }
    setFormData(prev => ({ ...prev, resumePdf: file }));
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

    const file = e.dataTransfer.files[0];
    handleFileSelection(file);
  };

  const resetAll = () => {
    setResult(null);
    setFormData({ companyName: "", jobTitle: "", jobDescription: "", resumePdf: null });
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pre-fill company, title and job description; the user only re-uploads the PDF.
  const handleRerun = (row) => {
    setResult(null);
    setFormData({
      companyName: row.companyName || '',
      jobTitle: row.jobTitle || '',
      jobDescription: row.jobDescription || '',
      resumePdf: null,
    });
    setError('');
    setNotice('Job details are filled in from your earlier scan. Upload your resume PDF to run it again.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openScore = async (id) => {
    setError('');
    try {
      const data = await getATSScoreById(id);
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError("We couldn't open that result. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-14 px-6 md:px-12 relative overflow-hidden">
      {/* Header */}
      <div className="mb-16 border-b border-divider pb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-[1px] bg-accent"></div>
          <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
            Resume Insights
          </span>
        </div>
        
        <h1 className="text-4xl md:text-7xl font-clash font-bold text-foreground uppercase tracking-tight leading-none mb-6">
          Resume <span className="text-accent">Scanner</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl font-light leading-relaxed">
          Scan your resume against any job description and see how you rank. Get actionable tips to improve your ATS score and land the interview.
        </p>
      </div>

      {/* If no result → show form */}
      {!result ? (
        <>
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="border border-border bg-background p-10 rounded-sm shadow-xl">
            <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-10 flex items-center gap-3">
              <span className="w-4 h-[1px] bg-divider"></span>
              Analysis Setup
            </h3>

            {/* FORM FIELDS: pick a job, or enter the details by hand */}
            <div className="mb-8">
            <JobStart
              hasErrors={(!!error && !formData.jobDescription.trim()) || !!notice}
              onPick={({ jobId: id, company, title, jdText }) => {
                setJobId(id);
                setFormData((prev) => ({ ...prev, companyName: company, jobTitle: title, jobDescription: jdText }));
              }}
              onClear={() => setJobId(null)}
            >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Company Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Google, Stripe"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="h-14"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Target Role</label>
                <Input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                  className="h-14"
                />
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Job Description</label>
              <textarea
                placeholder="Paste the job description here to see how your resume matches..."
                rows={6}
                value={formData.jobDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                className="bg-divider/10 border border-divider rounded-sm p-4 w-full outline-none focus:border-accent transition-editorial font-general text-sm text-foreground placeholder:text-muted-foreground/30"
              />
            </div>

            </JobStart>
            </div>

            {/* FILE UPLOAD */}
            <div
              className={`border-dashed border-2 rounded-sm p-12 text-center transition-editorial mb-10 group ${
                dragActive ? 'border-accent bg-accent/5' : 'border-divider hover:border-accent bg-divider/5'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="resume-upload" />
              <label htmlFor="resume-upload" className="cursor-pointer block">
                <Upload className={`mx-auto w-10 h-10 transition-editorial ${formData.resumePdf ? 'text-accent' : 'text-muted-foreground group-hover:text-accent'}`} />
                <p className="mt-6 font-clash font-bold uppercase tracking-widest text-sm text-foreground">
                  {formData.resumePdf ? (
                    <span className="text-accent flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-3" /> {formData.resumePdf.name}
                    </span>
                  ) : (
                    "Upload Your Resume (PDF)"
                  )}
                </p>
                {!formData.resumePdf && <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">Drag and drop or click to select</p>}
              </label>
            </div>

            {notice && (
              <div className="mb-8 p-4 border border-accent/30 bg-accent/5 text-foreground rounded-sm text-xs">
                {notice}
              </div>
            )}

            {error && (
              <div className="mb-8 p-4 border border-destructive/30 bg-destructive/5 text-destructive flex items-center rounded-sm text-xs font-bold uppercase tracking-widest animate-pulse">
                <AlertCircle className="w-4 h-4 mr-3" /> {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-16 shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-4 tracking-[0.2em]">
                  <Loader className="animate-spin w-5 h-5" /> Analyzing your resume...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-4 tracking-[0.2em]">
                  <Search className="w-5 h-5" /> Scan Resume
                </span>
              )}
            </Button>
          </div>
        </div>
        <AtsHistory onOpen={openScore} onRerun={handleRerun} refreshKey={historyKey} />
        </>
      ) : (
        <>
        {error && (
          <div className="max-w-5xl mx-auto mb-8 p-4 border border-destructive/30 bg-destructive/5 text-destructive rounded-sm text-xs font-bold uppercase tracking-widest">
            {error}
          </div>
        )}
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
        </>
      )}
    </div>
  );
};

export default ResumeParserComponent;
