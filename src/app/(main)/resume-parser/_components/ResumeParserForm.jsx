'use client'

import React, { useState } from 'react';
import { Upload, FileText, Loader, AlertCircle, CheckCircle, Target, TrendingUp, Sparkles, Zap, Brain, Award } from 'lucide-react';
import { createATSAnalysis } from '@/actions/ResumeParser';


const ResumeParserComponent = () => {

  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    resumePdf: null
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Convert PDF → base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
    });
  };

  // FIXED — REAL SERVER CALL
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.resumePdf) {
      setError("Please upload a PDF resume");
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
        resumeBase64: base64Resume
      });

      if (!response || !response.success) {
        setError("Failed to analyze resume. Try again.");
        setLoading(false);
        return;
      }

      setResult(response.data); // ✅ REAL AI RESULT

    } catch (err) {
      console.error("ATS ERROR:", err);
      setError("Failed to analyze resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelection(file);
  };

  const handleFileSelection = (file) => {
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, resumePdf: file }));
      setError('');
    } else {
      setError('Please select a valid PDF file');
    }
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

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-[#fbbf24]';
    if (score >= 70) return 'text-[#f59e0b]';
    return 'text-rose-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20';
    if (score >= 80) return 'bg-gradient-to-br from-[#fbbf24]/10 to-[#f59e0b]/10 border-[#fbbf24]/20';
    if (score >= 70) return 'bg-gradient-to-br from-[#f59e0b]/10 to-amber-500/10 border-[#f59e0b]/20';
    return 'bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/20';
  };

  return (
    <div className="min-h-screen bg-[#0f0e0a] text-white py-12 px-4 sm:px-6 lg:px-8 relative">

      {/* UI Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/10 border border-[#f59e0b]/20 backdrop-blur-xl mb-6">
          <Sparkles className="h-4 w-4 text-[#f59e0b] mr-2" />
          <span className="text-sm font-medium text-[#fbbf24]">AI-Powered Analysis</span>
          <Brain className="h-4 w-4 text-[#f59e0b] ml-2" />
        </div>

        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
          Resume ATS Analyzer
        </h1>
      </div>

      {/* If no result → show form */}
      {!result ? (
        <>
          <div className="backdrop-blur-xl bg-[#1a1815]/70 p-8 rounded-2xl border border-[#f59e0b]/20">

            {/* FORM FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <input
                type="text"
                placeholder="Company Name"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                className="bg-black/20 border border-[#f59e0b]/20 rounded-xl p-3"
              />

              <input
                type="text"
                placeholder="Job Title"
                value={formData.jobTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                className="bg-black/20 border border-[#f59e0b]/20 rounded-xl p-3"
              />
            </div>

            <textarea
              placeholder="Paste Job Description"
              rows={6}
              value={formData.jobDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
              className="bg-black/20 border border-[#f59e0b]/20 rounded-xl p-3 w-full mb-6"
            />

            {/* FILE UPLOAD */}
            <div
              className="border-dashed border-2 border-[#f59e0b]/30 rounded-xl p-10 text-center hover:border-[#f59e0b]"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="resume-upload" />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <Upload className="mx-auto w-12 h-12 text-[#f59e0b]" />
                <p className="mt-4">
                  {formData.resumePdf ? (
                    <span className="text-green-400 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2" /> {formData.resumePdf.name}
                    </span>
                  ) : (
                    "Click or drag your resume PDF"
                  )}
                </p>
              </label>
            </div>

            {error && (
              <div className="mt-4 text-red-400 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" /> {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] py-4 rounded-xl font-bold text-black"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader className="animate-spin" /> Analyzing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <Zap /> Analyze Resume
                </span>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* RESULT UI */}
          <div className={`p-8 rounded-2xl border ${getScoreBgColor(result.atsScore)} mb-6`}>
            <h2 className="text-3xl mb-3 font-bold">Analysis Complete</h2>

            <div className="text-center grid grid-cols-2 gap-6">
              <div>
                <p className={`text-5xl font-bold ${getScoreColor(result.atsScore)}`}>{result.atsScore}</p>
                <p className="text-lg">ATS Score</p>
              </div>

              <div>
                <p className={`text-5xl font-bold ${getScoreColor(result.matchPercentage)}`}>
                  {result.matchPercentage}%
                </p>
                <p className="text-lg">Job Match</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#1a1815]/70 p-6 rounded-xl border border-[#f59e0b]/20 mb-6">
            <h3 className="text-2xl mb-3">Summary</h3>
            <p className="text-gray-300">{result.finalSummary}</p>
          </div>

          {/* Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-900/10 p-6 rounded-xl border border-green-500/20">
              <h3 className="text-2xl mb-4">Strengths</h3>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => <li key={i} className="text-green-300">• {s}</li>)}
              </ul>
            </div>

            <div className="bg-red-900/10 p-6 rounded-xl border border-red-500/20">
              <h3 className="text-2xl mb-4">Weaknesses</h3>
              <ul className="space-y-2">
                {result.weaknesses.map((w, i) => <li key={i} className="text-red-300">• {w}</li>)}
              </ul>
            </div>
          </div>

          {/* Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-[#1a1815]/70 p-6 rounded-xl border border-green-500/30">
              <h3 className="text-2xl mb-4">Skills Found</h3>
              <div className="flex flex-wrap gap-3">
                {result.relevantSkills.map((skill, i) => (
                  <span key={i} className="px-4 py-2 bg-green-700/20 text-green-300 rounded-full">{skill}</span>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1815]/70 p-6 rounded-xl border border-rose-500/30">
              <h3 className="text-2xl mb-4">Missing Skills</h3>
              <div className="flex flex-wrap gap-3">
                {result.missingSkills.map((skill, i) => (
                  <span key={i} className="px-4 py-2 bg-rose-700/20 text-rose-300 rounded-full">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Back Button */}      
          <button
            onClick={() => {
              setResult(null);
              setFormData({ companyName: "", jobTitle: "", jobDescription: "", resumePdf: null });
            }}
            className="w-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] py-4 rounded-xl font-bold text-black"
          >
            Analyze Another Resume
          </button>
        </>
      )}

    </div>
  );
};

export default ResumeParserComponent;
