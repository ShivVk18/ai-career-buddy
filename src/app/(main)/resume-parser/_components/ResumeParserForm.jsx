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

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(",")[1]; 
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.resumePdf) {
      setError("Please upload a PDF resume");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const resumeBase64 = await fileToBase64(formData.resumePdf);
    
      const response = await createATSAnalysis({
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        resumeBase64
      });

      setResult(response.data);

    } catch (err) {
      console.error("Resume analysis error:", err);
      setError("Failed to analyze resume. Please try again.");
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
      setError('Please select a PDF file');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30';
    if (score >= 80) return 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30';
    if (score >= 70) return 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30';
    return 'bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20 text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/20 backdrop-blur-xl mb-6">
            <Sparkles className="h-4 w-4 text-orange-400 mr-2" />
            <span className="text-sm font-medium text-orange-300">AI-Powered Analysis</span>
            <Brain className="h-4 w-4 text-rose-400 ml-2" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
            Resume ATS Analyzer
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Get detailed AI-powered feedback on your resume's ATS compatibility and job match score
          </p>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Main Form Card */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              {/* Job Information Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <Target className="h-6 w-6 text-orange-400 mr-3" />
                  Job Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500"
                      placeholder="e.g., Google, Microsoft"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500"
                      placeholder="e.g., Senior Frontend Developer"
                    />
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Description
                </label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                  rows={8}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500 resize-none"
                  placeholder="Paste the complete job description here..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Resume Upload
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                    dragActive 
                      ? 'border-orange-500 bg-orange-500/10 scale-105' 
                      : 'border-orange-500/30 hover:border-orange-500/50 bg-slate-800/30'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500/20 to-rose-500/20 flex items-center justify-center mb-4 border border-orange-500/30">
                        <Upload className="w-10 h-10 text-orange-400" />
                      </div>
                      <p className="text-lg text-gray-300 mb-2 font-medium">
                        {formData.resumePdf ? (
                          <span className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                            {formData.resumePdf.name}
                          </span>
                        ) : (
                          'Click to upload or drag and drop your resume'
                        )}
                      </p>
                      <p className="text-sm text-gray-500">PDF files only, max 10MB</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-3 backdrop-blur-xl bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                <span className="text-rose-300">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white py-4 px-8 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg font-semibold shadow-lg shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  <span>Analyzing Resume...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  <span>Analyze Resume</span>
                </>
              )}
            </button>
          </form>
        ) : (
          // Results Display
          <div className="space-y-8">
            {/* Header with Scores */}
            <div className={`backdrop-blur-xl rounded-3xl border-2 p-8 ${getScoreBgColor(result.atsScore)} shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Analysis Complete!</h2>
                  <p className="text-gray-300 text-lg">
                    {formData.jobTitle && formData.companyName 
                      ? `${formData.jobTitle} at ${formData.companyName}`
                      : 'Resume Analysis Results'
                    }
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="backdrop-blur-xl bg-slate-900/30 rounded-2xl p-6 border border-orange-500/20 text-center">
                  <div className={`text-5xl font-bold mb-2 ${getScoreColor(result.atsScore)}`}>
                    {result.atsScore}
                  </div>
                  <p className="text-gray-300 font-medium text-lg">ATS Compatibility Score</p>
                  <Award className="w-8 h-8 mx-auto mt-3 text-orange-400" />
                </div>
                <div className="backdrop-blur-xl bg-slate-900/30 rounded-2xl p-6 border border-rose-500/20 text-center">
                  <div className={`text-5xl font-bold mb-2 ${getScoreColor(result.matchPercentage)}`}>
                    {result.matchPercentage}%
                  </div>
                  <p className="text-gray-300 font-medium text-lg">Job Match Percentage</p>
                  <Target className="w-8 h-8 mx-auto mt-3 text-rose-400" />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8">
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <FileText className="w-6 h-6 text-orange-400 mr-3" />
                Summary
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">{result.finalSummary}</p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-3xl p-8">
                <h3 className="text-2xl font-semibold text-green-300 mb-6 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-3" />
                  Strengths
                </h3>
                <ul className="space-y-4">
                  {result.strengths.map((strength, index) => (
                    <li key={index} className="text-green-200 flex items-start group">
                      <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-150 transition-transform duration-300"></span>
                      <span className="leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="backdrop-blur-xl bg-gradient-to-br from-rose-500/10 to-red-500/10 border border-rose-500/30 rounded-3xl p-8">
                <h3 className="text-2xl font-semibold text-rose-300 mb-6 flex items-center">
                  <AlertCircle className="w-6 h-6 mr-3" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-4">
                  {result.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-rose-200 flex items-start group">
                      <span className="w-2 h-2 bg-rose-400 rounded-full mt-2 mr-4 flex-shrink-0 group-hover:scale-150 transition-transform duration-300"></span>
                      <span className="leading-relaxed">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-blue-500/20 p-8">
              <h3 className="text-2xl font-semibold text-blue-300 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3" />
                Actionable Recommendations
              </h3>
              <div className="space-y-4">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="backdrop-blur-xl bg-slate-800/50 rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-blue-300 text-lg">{rec.category}</span>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        rec.priority === 'High' 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <p className="text-blue-200 mb-2 leading-relaxed">{rec.action}</p>
                    <p className="text-sm text-blue-400 leading-relaxed">{rec.impact}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="backdrop-blur-xl bg-slate-900/50 border border-green-500/20 rounded-3xl p-8">
                <h3 className="text-2xl font-semibold text-white mb-6">Skills Found</h3>
                <div className="flex flex-wrap gap-3">
                  {result.relevantSkills.map((skill, index) => (
                    <span key={index} className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 rounded-full text-sm border border-green-500/30 hover:scale-110 transition-transform duration-300 cursor-default">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="backdrop-blur-xl bg-slate-900/50 border border-rose-500/20 rounded-3xl p-8">
                <h3 className="text-2xl font-semibold text-white mb-6">Missing Skills</h3>
                <div className="flex flex-wrap gap-3">
                  {result.missingSkills.map((skill, index) => (
                    <span key={index} className="px-4 py-2 bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-300 rounded-full text-sm border border-rose-500/30 hover:scale-110 transition-transform duration-300 cursor-default">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setFormData({ companyName: '', jobTitle: '', jobDescription: '', resumePdf: null });
                }}
                className="flex-1 bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white py-4 px-6 rounded-2xl transition-all duration-300 font-semibold shadow-lg shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105"
              >
                Analyze Another Resume
              </button>
              <button className="flex-1 backdrop-blur-xl bg-slate-800/50 border border-orange-500/30 hover:border-orange-500/50 text-white py-4 px-6 rounded-2xl transition-all duration-300 font-semibold hover:bg-slate-800/70">
                Download Report
              </button>
              <button className="flex-1 backdrop-blur-xl bg-slate-800/50 border border-green-500/30 hover:border-green-500/50 text-white py-4 px-6 rounded-2xl transition-all duration-300 font-semibold hover:bg-slate-800/70">
                View All Analyses
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeParserComponent;