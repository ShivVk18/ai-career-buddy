'use client'
import React, { useState } from 'react';
import { Upload, FileText, Loader, AlertCircle, CheckCircle, Target, TrendingUp } from 'lucide-react';
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
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 80) return 'bg-blue-50 border-blue-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume ATS Analyzer</h1>
        <p className="text-gray-600">Get detailed feedback on your resume's ATS compatibility and job match</p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Google, Microsoft"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Senior Frontend Developer"
              />
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description
            </label>
            <textarea
              value={formData.jobDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste the complete job description here..."
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume (PDF only)
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
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
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  {formData.resumePdf ? formData.resumePdf.name : 'Click to upload or drag and drop your resume'}
                </p>
                <p className="text-sm text-gray-500">PDF files only, max 10MB</p>
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Analyzing Resume...</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>Analyze Resume</span>
              </>
            )}
          </button>
        </form>
      ) : (
        // Results Display
        <div className="space-y-6">
          {/* Header with Scores */}
          <div className={`rounded-lg border-2 p-6 ${getScoreBgColor(result.atsScore)}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analysis Complete!</h2>
                <p className="text-gray-600">
                  {formData.jobTitle && formData.companyName 
                    ? `${formData.jobTitle} at ${formData.companyName}`
                    : 'Resume Analysis Results'
                  }
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(result.atsScore)}`}>
                  {result.atsScore}
                </div>
                <p className="text-gray-600 font-medium">ATS Compatibility Score</p>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(result.matchPercentage)}`}>
                  {result.matchPercentage}%
                </div>
                <p className="text-gray-600 font-medium">Job Match Percentage</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
            <p className="text-gray-700 leading-relaxed">{result.finalSummary}</p>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {result.strengths.map((strength, index) => (
                  <li key={index} className="text-green-700 flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {result.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-red-700 flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Actionable Recommendations
            </h3>
            <div className="space-y-4">
              {result.recommendations.map((rec, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-900">{rec.category}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'High' 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rec.priority} Priority
                    </span>
                  </div>
                  <p className="text-blue-800 mb-1">{rec.action}</p>
                  <p className="text-sm text-blue-600">{rec.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skills Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Found</h3>
              <div className="flex flex-wrap gap-2">
                {result.relevantSkills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
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
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors"
            >
              Analyze Another Resume
            </button>
            <button className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition-colors">
              Download Report
            </button>
            <button className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors">
              View All Analyses
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeParserComponent;