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
    <div className="relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/5 left-1/6 w-2 h-2 bg-blue-400/10 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-purple-400/10 rounded-full blur-sm animate-bounce"></div>
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-pink-400/10 rounded-full blur-sm animate-pulse"></div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Header Section */}
        <div className="glass-dark p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Your Cover Letter</h2>
                <p className="text-gray-400 text-sm">AI-generated and ready for customization</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Preview Mode Toggle */}
              <div className="flex items-center space-x-1 p-1 rounded-xl glass-dark border border-white/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewMode("edit")}
                  className={`h-8 px-3 text-xs rounded-lg transition-all duration-300 ${
                    previewMode === "edit" 
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewMode("preview")}
                  className={`h-8 px-3 text-xs rounded-lg transition-all duration-300 ${
                    previewMode === "preview" 
                      ? "bg-purple-600/20 text-purple-400 border border-purple-500/30" 
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-10 px-4 glass-dark border border-white/20 hover:border-blue-400/50 hover:bg-blue-600/20 text-gray-300 hover:text-blue-400 transition-all duration-300 rounded-xl"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-10 px-4 glass-dark border border-white/20 hover:border-green-400/50 hover:bg-green-600/20 text-gray-300 hover:text-green-400 transition-all duration-300 rounded-xl"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* Editor/Preview Section */}
        <div className="glass-dark rounded-2xl border border-white/10 overflow-hidden backdrop-blur-xl">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500/60 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500/60 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500/60 rounded-full"></div>
                </div>
                <span className="text-sm text-gray-400 font-mono">cover-letter.md</span>
              </div>
              
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-8 px-3 text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="h-8 px-3 text-xs bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 rounded-lg"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            {/* Loading overlay for better UX */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/30 pointer-events-none opacity-20"></div>
            
            <div className="relative z-10">
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
        </div>

        {/* Tips Section */}
        <div className="glass-dark p-6 rounded-2xl border border-white/10 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-600/20 to-orange-600/20 mr-3">
              <FileText className="h-4 w-4 text-yellow-400" />
            </div>
            Customization Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">✨ Personalize Your Letter</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Add specific examples from your experience that match the job requirements
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">🎯 Tailor the Content</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Adjust the tone and emphasis based on the company culture and role level
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">📝 Review and Edit</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Check for any placeholder text and ensure all details are accurate
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">🚀 Final Check</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Proofread for grammar and ensure the letter flows naturally
              </p>
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
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
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
        
        .glass-dark {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
      `}</style>
    </div>
  );
};

export default CoverLetterPreview;