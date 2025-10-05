"use client";

import React, { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Copy, 
  Edit3, 
  FileText, 
  CheckCircle2, 
  Eye,
  EyeOff 
} from "lucide-react";
import { toast } from "sonner";

const CoverLetterPreview = ({ content }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [previewMode, setPreviewMode] = useState("preview");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      toast.success("Cover letter copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Changes saved successfully!");
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([editedContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "cover-letter.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Cover letter downloaded!");
  };

  return (
   <div className="space-y-8">
      {/* Header Section */}
      <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500/20 to-rose-500/20 flex items-center justify-center border border-orange-500/30">
              <FileText className="h-8 w-8 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Your Cover Letter</h2>
              <p className="text-gray-400 text-sm">AI-generated and ready for customization</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-800/50 border border-orange-500/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode("edit")}
                className={`h-9 px-4 text-sm rounded-lg transition-all duration-300 ${
                  previewMode === "edit" 
                    ? "bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-400 border border-orange-500/30" 
                    : "text-gray-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode("preview")}
                className={`h-9 px-4 text-sm rounded-lg transition-all duration-300 ${
                  previewMode === "preview" 
                    ? "bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-rose-400 border border-rose-500/30" 
                    : "text-gray-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-10 px-5 bg-slate-800/50 border border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-600/20 text-gray-300 hover:text-orange-400 transition-all duration-300 rounded-xl"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-10 px-5 bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white border-0 transition-all duration-300 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Editor/Preview Section */}
      <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 overflow-hidden shadow-2xl">
        <div className="border-b border-orange-500/10 p-5 bg-slate-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-rose-500/60 rounded-full"></div>
                <div className="w-3 h-3 bg-amber-500/60 rounded-full"></div>
                <div className="w-3 h-3 bg-emerald-500/60 rounded-full"></div>
              </div>
              <span className="text-sm text-gray-400 font-mono">cover-letter.md</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <MDEditor
            value={editedContent || content}
            onChange={setEditedContent}
            preview={previewMode}
            hideToolbar={previewMode === "preview"}
            visibleDragBar={false}
            height={700}
            data-color-mode="dark"
            className="custom-md-editor"
            style={{
              backgroundColor: 'transparent',
            }}
            textareaProps={{
              className: "bg-transparent text-white placeholder:text-gray-500 border-none outline-none resize-none",
              style: {
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: 'Inter, system-ui, sans-serif',
                backgroundColor: 'transparent',
                color: '#ffffff',
              }
            }}
            previewOptions={{
              className: "prose prose-invert max-w-none p-8",
              style: {
                backgroundColor: 'transparent',
                color: '#ffffff',
              }
            }}
          />
        </div>
      </div>

      {/* Tips Section */}
      <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30 mr-4">
            <Sparkles className="h-6 w-6 text-amber-400" />
          </div>
          Customization Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="backdrop-blur-xl bg-slate-800/30 p-5 rounded-2xl border border-orange-500/10 hover:border-orange-500/20 transition-all duration-300">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500/20 to-rose-500/20 flex items-center justify-center border border-orange-500/30 flex-shrink-0 mt-1">
                <Zap className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-orange-300 mb-2">Personalize Your Letter</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Add specific examples from your experience that match the job requirements
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-slate-800/30 p-5 rounded-2xl border border-rose-500/10 hover:border-rose-500/20 transition-all duration-300">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-rose-500/20 to-pink-500/20 flex items-center justify-center border border-rose-500/30 flex-shrink-0 mt-1">
                <FileText className="h-4 w-4 text-rose-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-rose-300 mb-2">Tailor the Content</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Adjust the tone and emphasis based on the company culture and role level
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-slate-800/30 p-5 rounded-2xl border border-amber-500/10 hover:border-amber-500/20 transition-all duration-300">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/30 flex-shrink-0 mt-1">
                <Edit3 className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-300 mb-2">Review and Edit</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Check for any placeholder text and ensure all details are accurate
                </p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-slate-800/30 p-5 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/30 flex-shrink-0 mt-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-emerald-300 mb-2">Final Check</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Proofread for grammar and ensure the letter flows naturally
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-md-editor {
          background: transparent !important;
        }
        
        .custom-md-editor .w-md-editor-text-pre,
        .custom-md-editor .w-md-editor-text-textarea {
          background: transparent !important;
          color: #ffffff !important;
        }
        
        .custom-md-editor .w-md-editor-text {
          background: rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(251, 146, 60, 0.1) !important;
        }
        
        .custom-md-editor .wmde-markdown {
          background: transparent !important;
          color: #ffffff !important;
        }
        
        .custom-md-editor .wmde-markdown h1,
        .custom-md-editor .wmde-markdown h2,
        .custom-md-editor .wmde-markdown h3 {
          color: #ffffff !important;
        }
        
        .custom-md-editor .wmde-markdown p {
          color: #e5e5e5 !important;
          line-height: 1.7;
        }
        
        .custom-md-editor .wmde-markdown strong {
          color: #ffffff !important;
        }
        
        .custom-md-editor .wmde-markdown ul,
        .custom-md-editor .wmde-markdown ol {
          color: #e5e5e5 !important;
        }
        
        .custom-md-editor .w-md-editor-preview {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default CoverLetterPreview;