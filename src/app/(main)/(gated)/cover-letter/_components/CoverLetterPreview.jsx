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
  Sparkles,
  Zap,
  Save,
  FileDown
} from "lucide-react";
import { toast } from "sonner";

const CoverLetterPreview = ({ content }) => {
  const [editedContent, setEditedContent] = useState(content);
  const [previewMode, setPreviewMode] = useState("preview");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      toast.success("Cover letter copied to clipboard! ✨");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([editedContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "cover-letter.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Cover letter downloaded! 📄");
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Action Bar */}
      <div className="border border-border bg-background rounded-sm p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-divider/10"></div>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-sm border border-divider bg-divider/10 flex items-center justify-center transition-editorial shadow-sm">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-clash font-bold text-foreground uppercase tracking-tight">Preview & Edit</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Ready to download</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-1 p-1 border border-divider bg-divider/5 rounded-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode("edit")}
                className={`h-10 px-6 text-[10px] font-bold tracking-widest uppercase transition-editorial rounded-sm ${
                  previewMode === "edit" 
                    ? "bg-accent text-accent-foreground border border-accent hover:bg-accent/90" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode("preview")}
                className={`h-10 px-6 text-[10px] font-bold tracking-widest uppercase transition-editorial rounded-sm ${
                  previewMode === "preview" 
                    ? "bg-accent text-accent-foreground border border-accent hover:bg-accent/90" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-12 px-6 border-divider hover:border-accent text-[10px] font-bold tracking-widest uppercase transition-editorial"
            >
              <Copy className="h-4 w-4 mr-3" />
              Copy Text
            </Button>

            <Button
              onClick={handleDownload}
              className="h-12 px-8 text-[10px] font-bold tracking-widest uppercase shadow-lg"
            >
              <FileDown className="h-4 w-4 mr-3" />
              Download TXT
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Container */}
      <div className="border border-border bg-background rounded-sm overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-divider/10"></div>
        <div className="border-b border-divider p-6 bg-divider/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent/60 rounded-full"></div>
              <div className="w-2 h-2 bg-accent/40 rounded-full"></div>
              <div className="w-2 h-2 bg-accent/20 rounded-full"></div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">cover-letter.md</span>
          </div>
        </div>

        <div className="relative">
          <MDEditor
            value={editedContent || content}
            onChange={setEditedContent}
            preview={previewMode}
            hideToolbar={previewMode === "preview"}
            visibleDragbar={false}
            height={600}
            data-color-mode="dark"
            className="custom-md-editor"
            style={{
              backgroundColor: 'transparent',
            }}
            textareaProps={{
              className: "bg-transparent text-foreground placeholder:text-muted border-none outline-none resize-none font-general text-sm leading-relaxed p-10",
              style: {
                backgroundColor: 'transparent',
                color: 'var(--foreground)',
              }
            }}
            previewOptions={{
              className: "prose prose-invert max-w-none p-12",
              style: {
                backgroundColor: 'transparent',
                color: 'var(--foreground)',
              }
            }}
          />
        </div>
      </div>

      {/* Optimization Tips */}
      <div className="border border-border bg-background rounded-sm p-8 md:p-12 shadow-2xl">
        <h3 className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase mb-10 flex items-center gap-4">
          <Sparkles className="h-4 w-4 text-accent" />
          Pro Tips from your Buddy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-divider bg-divider/10 p-6 rounded-sm transition-editorial hover:border-accent group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-sm bg-divider/20 border border-divider/30 group-hover:border-accent transition-editorial flex items-center justify-center flex-shrink-0 mt-1">
                <Zap className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-accent mb-3 tracking-widest uppercase">Personalize It</h4>
                <p className="text-muted-foreground text-xs leading-relaxed font-general font-light">
                  Add a specific project or achievement that directly addresses the company&apos;s pain points.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-divider bg-divider/10 p-6 rounded-sm transition-editorial hover:border-accent group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-sm bg-divider/20 border border-divider/30 group-hover:border-accent transition-editorial flex items-center justify-center flex-shrink-0 mt-1">
                <FileText className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-accent mb-3 tracking-widest uppercase">Check the Tone</h4>
                <p className="text-muted-foreground text-xs leading-relaxed font-general font-light">
                  Match the company&apos;s culture. Use a more formal tone for finance/law, and a friendlier tone for startups.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-divider bg-divider/10 p-6 rounded-sm transition-editorial hover:border-accent group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-sm bg-divider/20 border border-divider/30 group-hover:border-accent transition-editorial flex items-center justify-center flex-shrink-0 mt-1">
                <Edit3 className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-accent mb-3 tracking-widest uppercase">Final Proofread</h4>
                <p className="text-muted-foreground text-xs leading-relaxed font-general font-light">
                  Make sure all placeholders (like [Company Name]) are filled in correctly.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-divider bg-divider/10 p-6 rounded-sm transition-editorial hover:border-accent group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-sm bg-divider/20 border border-divider/30 group-hover:border-accent transition-editorial flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle2 className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-accent mb-3 tracking-widest uppercase">Ready to Go</h4>
                <p className="text-muted-foreground text-xs leading-relaxed font-general font-light">
                  Once you&apos;re happy, copy the text or download it and attach it to your application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-md-editor {
          background: transparent !important;
          border: none !important;
        }
        
        .custom-md-editor .w-md-editor-text-pre,
        .custom-md-editor .w-md-editor-text-textarea {
          background: transparent !important;
          color: var(--foreground) !important;
        }
        
        .custom-md-editor .w-md-editor-text {
          background: rgba(var(--accent-rgb), 0.05) !important;
        }
        
        .custom-md-editor .wmde-markdown {
          background: transparent !important;
          color: var(--foreground) !important;
          font-family: 'General Sans', sans-serif !important;
        }
        
        .custom-md-editor .w-md-editor-preview {
          background: transparent !important;
          border-left: 1px solid var(--divider) !important;
        }

        .custom-md-editor .w-md-editor-toolbar {
          background: var(--background) !important;
          border-bottom: 1px solid var(--divider) !important;
          color: var(--foreground) !important;
        }

        .custom-md-editor .w-md-editor-toolbar button {
          color: var(--foreground) !important;
        }

        .custom-md-editor .w-md-editor-content {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default CoverLetterPreview;