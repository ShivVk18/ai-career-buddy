"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download,
  Loader2,
  Save,
  FileText,
  User,
  Sparkles,
  Briefcase,
  Upload,
  X,
  CheckCircle,
  Layout,
  Palette,
  Image as ImageIcon,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { saveResume } from "@/actions/Resume";
import { EntryForm } from "./EntryForm";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";

import {
  ModernProTemplate,
  MinimalClassicTemplate,
  CreativeBoldTemplate,
  ExecutiveEliteTemplate,
  TechModernTemplate,
  AcademicFormalTemplate,
} from "./ResumeTemplates";
import jsPDF from "jspdf";
import html2canvas from 'html2canvas-pro';

// Enhanced Schema with better validation
const resumeSchema = z.object({
  contactInfo: z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
    linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
    twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
  }),
  summary: z.string()
    .min(50, "Summary must be at least 50 characters")
    .max(500, "Summary should not exceed 500 characters"),
  skills: z.string()
    .min(10, "Add at least some skills")
    .max(1000, "Skills section too long"),
  experience: z.array(z.any()).min(0),
  education: z.array(z.any()).min(0),
  projects: z.array(z.any()).min(0),
  template: z.string().min(1, "Please select a template"),
  photo: z.string().optional(),
});

const TEMPLATES = [
  {
    id: "modern-pro",
    name: "Modern Professional",
    description: "Clean and contemporary design with subtle accents",
    requiresPhoto: true,
    color: "amber",
    component: ModernProTemplate,
    icon: "💼",
  },
  {
    id: "minimal-classic",
    name: "Minimal Classic",
    description: "Traditional layout focused on content",
    requiresPhoto: false,
    color: "amber",
    component: MinimalClassicTemplate,
    icon: "📄",
  },
  {
    id: "creative-bold",
    name: "Creative Bold",
    description: "Eye-catching design with vibrant colors",
    requiresPhoto: true,
    color: "amber",
    component: CreativeBoldTemplate,
    icon: "🎨",
  },
  {
    id: "executive-elite",
    name: "Executive Elite",
    description: "Sophisticated layout for senior roles",
    requiresPhoto: true,
    color: "amber",
    component: ExecutiveEliteTemplate,
    icon: "👔",
  },
  {
    id: "tech-modern",
    name: "Tech Modern",
    description: "Developer-friendly with code-style aesthetics",
    requiresPhoto: false,
    color: "amber",
    component: TechModernTemplate,
    icon: "💻",
  },
  {
    id: "academic-formal",
    name: "Academic Formal",
    description: "Traditional academic CV format",
    requiresPhoto: false,
    color: "amber",
    component: AcademicFormalTemplate,
    icon: "🎓",
  },
];

export default function ResumeBuilder({ initialContent, initialResume }) {
  const [activeTab, setActiveTab] = useState("template");
  const [selectedTemplate, setSelectedTemplate] = useState(initialResume?.templateId || "");
  const [photoPreview, setPhotoPreview] = useState(initialResume?.photoUrl || "");
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const { user } = useUser();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {
        fullName: initialResume?.contactInfo?.fullName || user?.fullName || "",
        email: initialResume?.contactInfo?.email || user?.emailAddresses?.[0]?.emailAddress || "",
        mobile: initialResume?.contactInfo?.mobile || "",
        linkedin: initialResume?.contactInfo?.linkedin || "",
        twitter: initialResume?.contactInfo?.twitter || "",
      },
      summary: initialResume?.summary || "",
      skills: initialResume?.skills || "",
      experience: initialResume?.experience || [],
      education: initialResume?.education || [],
      projects: initialResume?.projects || [],
      template: initialResume?.templateId || "",
      photo: initialResume?.photoUrl || "",
    },
    mode: "onChange",
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  const formValues = watch();
  const currentTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplate),
    [selectedTemplate]
  );

  // Success/Error handling
  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!", {
        description: "Your changes have been saved.",
      });
    }
    if (saveError) {
      toast.error("Failed to save resume", {
        description: saveError.message || "Please try again.",
      });
    }
  }, [saveResult, saveError, isSaving]);

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty) return;

    const timeoutId = setTimeout(() => {
      handleSubmit(onSubmit)();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [formValues, autoSaveEnabled, isDirty]);

  // Photo upload with validation
  const handlePhotoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      setValue("photo", reader.result, { shouldDirty: true });
      toast.success("Photo uploaded successfully");
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsDataURL(file);
  }, [setValue]);

  // Remove photo
  const handleRemovePhoto = useCallback(() => {
    setPhotoPreview("");
    setValue("photo", "", { shouldDirty: true });
    toast.info("Photo removed");
  }, [setValue]);

  // Render template with memoization
  const renderTemplate = useCallback(() => {
    const templateData = { ...formValues };
    const TemplateComponent = currentTemplate?.component;
    
    if (!TemplateComponent) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
          <Layout className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-600 text-lg font-medium">Select a template to preview</p>
          <p className="text-gray-400 text-sm mt-2">Choose from our professional templates</p>
        </div>
      );
    }

    return <TemplateComponent data={templateData} photo={photoPreview} />;
  }, [formValues, currentTemplate, photoPreview]);

  // Form submission
  const onSubmit = async (data) => {
    try {
      await saveResumeFn({
        content: JSON.stringify(data),
        templateId: selectedTemplate,
        photoUrl: photoPreview,
        contactInfo: data.contactInfo,
        summary: data.summary,
        skills: data.skills,
        experience: data.experience,
        education: data.education,
        projects: data.projects,
      });
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const generatePDF = async () => {
    if (!selectedTemplate) return toast.error("Select a template first");

    const loadingToast = toast.loading("Generating PDF...");

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);
      let yPos = margin;

      const addText = (text, fontSize, isBold = false, color = [0, 0, 0], indent = 0) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", isBold ? "bold" : "normal");
        pdf.setTextColor(...color);
        
        const lines = pdf.splitTextToSize(text, contentWidth - indent);
        
        if (yPos + (lines.length * fontSize * 0.35) > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }
        
        lines.forEach(line => {
          pdf.text(line, margin + indent, yPos);
          yPos += fontSize * 0.35;
        });
      };

      const addSpace = (space = 5) => {
        yPos += space;
      };

      const addLine = () => {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 3;
      };

      addText(formValues.contactInfo.fullName.toUpperCase(), 24, true, [0, 0, 0]);
      addSpace(3);
      
      const contactInfo = [
        formValues.contactInfo.email,
        formValues.contactInfo.mobile,
        formValues.contactInfo.linkedin,
      ].filter(Boolean).join(" | ");
      
      addText(contactInfo, 9, false, [60, 60, 60]);
      addSpace(5);
      addLine();
      addSpace(3);

      if (formValues.summary) {
        addText("PROFESSIONAL SUMMARY", 12, true, [0, 0, 0]);
        addSpace(3);
        addText(formValues.summary, 10, false, [40, 40, 40]);
        addSpace(5);
        addLine();
        addSpace(3);
      }

      if (formValues.skills) {
        addText("SKILLS", 12, true, [0, 0, 0]);
        addSpace(3);
        addText(formValues.skills, 10, false, [40, 40, 40]);
        addSpace(5);
        addLine();
        addSpace(3);
      }

      if (formValues.experience && formValues.experience.length > 0) {
        addText("WORK EXPERIENCE", 12, true, [0, 0, 0]);
        addSpace(3);
        
        formValues.experience.forEach((exp, index) => {
          addText(exp.title, 11, true, [0, 0, 0]);
          addSpace(2);
          
          const dateRange = exp.current 
            ? `${exp.startDate} - Present` 
            : `${exp.startDate} - ${exp.endDate}`;
          addText(`${exp.organization} | ${dateRange}`, 9, false, [80, 80, 80]);
          addSpace(2);
          
          if (exp.description) {
            const descLines = exp.description.split('\n').filter(Boolean);
            descLines.forEach(line => {
              if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                addText(line.trim(), 10, false, [40, 40, 40], 5);
              } else {
                addText(`• ${line.trim()}`, 10, false, [40, 40, 40], 5);
              }
              addSpace(1);
            });
          }
          
          if (index < formValues.experience.length - 1) {
            addSpace(3);
          }
        });
        
        addSpace(5);
        addLine();
        addSpace(3);
      }

      if (formValues.education && formValues.education.length > 0) {
        addText("EDUCATION", 12, true, [0, 0, 0]);
        addSpace(3);
        
        formValues.education.forEach((edu, index) => {
          addText(edu.title, 11, true, [0, 0, 0]);
          addSpace(2);
          
          const dateRange = edu.current 
            ? `${edu.startDate} - Present` 
            : `${edu.startDate} - ${edu.endDate}`;
          addText(`${edu.organization} | ${dateRange}`, 9, false, [80, 80, 80]);
          addSpace(2);
          
          if (edu.description) {
            addText(edu.description, 10, false, [40, 40, 40], 5);
          }
          
          if (index < formValues.education.length - 1) {
            addSpace(3);
          }
        });
        
        addSpace(5);
        addLine();
        addSpace(3);
      }

      if (formValues.projects && formValues.projects.length > 0) {
        addText("PROJECTS", 12, true, [0, 0, 0]);
        addSpace(3);
        
        formValues.projects.forEach((project, index) => {
          addText(project.title, 11, true, [0, 0, 0]);
          addSpace(2);
          
          const dateRange = project.current 
            ? `${project.startDate} - Present` 
            : `${project.startDate} - ${project.endDate}`;
          addText(dateRange, 9, false, [80, 80, 80]);
          addSpace(2);
          
          if (project.description) {
            const descLines = project.description.split('\n').filter(Boolean);
            descLines.forEach(line => {
              if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                addText(line.trim(), 10, false, [40, 40, 40], 5);
              } else {
                addText(`• ${line.trim()}`, 10, false, [40, 40, 40], 5);
              }
              addSpace(1);
            });
          }
          
          if (index < formValues.projects.length - 1) {
            addSpace(3);
          }
        });
      }

      const fileName = `${formValues.contactInfo?.fullName?.replace(/\s+/g, '_') || 'resume'}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
      toast.dismiss(loadingToast);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  // Template selection
  const handleTemplateSelect = useCallback((templateId) => {
    setSelectedTemplate(templateId);
    setValue("template", templateId, { shouldDirty: true });
    setActiveTab("form");
    toast.success("Template selected", {
      description: "Fill in your information to complete your resume",
    });
  }, [setValue]);

  // Form validation errors display
  const hasErrors = Object.keys(errors).length > 0;

  // Calculate form completion percentage
  const formCompletion = useMemo(() => {
    const fields = [
      formValues.contactInfo?.fullName,
      formValues.contactInfo?.email,
      formValues.contactInfo?.mobile,
      formValues.summary,
      formValues.skills,
      selectedTemplate,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [formValues, selectedTemplate]);

  return (
    <div className="min-h-screen  py-8 md:py-12">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 px-4 md:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8 md:mb-12 animate-fadeIn">
          <div className="inline-flex items-center px-6 py-2.5 rounded-full bg-gradient-to-r from-[#f59e0b]/10 via-[#fbbf24]/10 to-[#f59e0b]/10 border border-[#f59e0b]/20 backdrop-blur-xl mb-6 shadow-lg">
            <Sparkles className="h-4 w-4 text-[#f59e0b] mr-2 animate-pulse" />
            <span className="text-sm font-semibold bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
              Professional Resume Builder
            </span>
            <FileText className="h-4 w-4 text-[#f59e0b] ml-2" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-[#fbbf24] via-[#f59e0b] to-[#fbbf24] bg-clip-text text-transparent animate-gradient">
            Create Your Perfect Resume
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-[#b0b0b0] max-w-3xl mx-auto px-4 leading-relaxed">
            Choose from professional templates and build your resume in minutes
          </p>
          
          {/* Progress Indicator */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#b0b0b0]">Profile Completion</span>
              <span className="text-[#f59e0b] font-semibold">{formCompletion}%</span>
            </div>
            <div className="h-2 bg-[#1a1815] rounded-full overflow-hidden border border-[#f59e0b]/10">
              <div 
                className="h-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] transition-all duration-500 ease-out"
                style={{ width: `${formCompletion}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons - Enhanced */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8">
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving || !isDirty}
            className="group relative bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] hover:from-[#fbbf24] hover:via-[#f59e0b] hover:to-[#fbbf24] text-[#0f0e0a] py-3 px-8 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 font-bold shadow-lg shadow-[#f59e0b]/30 hover:shadow-2xl hover:shadow-[#f59e0b]/50 transition-all duration-300 transform hover:scale-105 active:scale-95 min-w-[160px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                <span>{isDirty ? "Save Changes" : "Saved"}</span>
                {!isDirty && <CheckCircle2 className="h-4 w-4" />}
              </>
            )}
          </button>
          
          <button
            onClick={generatePDF}
            disabled={!selectedTemplate}
            className="backdrop-blur-xl bg-[#1a1815]/80 border-2 border-[#f59e0b]/30 hover:border-[#f59e0b]/60 text-[#fff4ed] py-3 px-8 rounded-2xl transition-all duration-300 font-bold hover:bg-[#252218] flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg min-w-[160px]"
          >
            <Download className="h-5 w-5" />
            <span>Export PDF</span>
          </button>
          
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="backdrop-blur-xl bg-[#1a1815]/80 border-2 border-[#f59e0b]/30 hover:border-[#f59e0b]/60 text-[#fff4ed] py-3 px-8 rounded-2xl transition-all duration-300 font-bold hover:bg-[#252218] flex items-center justify-center space-x-3 hover:scale-105 active:scale-95 shadow-lg"
          >
            {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            <span className="hidden sm:inline">{showPreview ? "Hide" : "Show"} Preview</span>
            <span className="sm:hidden">{showPreview ? "Hide" : "Show"}</span>
          </button>
        </div>

        {/* Auto-save and Status */}
        <div className="flex justify-center items-center gap-4 text-sm flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-[#b0b0b0] hover:text-[#fff4ed] transition-colors backdrop-blur-sm bg-[#1a1815]/40 px-4 py-2 rounded-full border border-[#f59e0b]/10">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-[#f59e0b]/30 bg-[#1a1815]/50 text-[#f59e0b] focus:ring-[#f59e0b] focus:ring-offset-0"
            />
            <span className="font-medium">Auto-save enabled</span>
          </label>
          {isDirty && autoSaveEnabled && (
            <span className="text-[#f59e0b] flex items-center gap-2 backdrop-blur-sm bg-[#f59e0b]/10 px-4 py-2 rounded-full border border-[#f59e0b]/20 animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="font-medium">Saving changes...</span>
            </span>
          )}
        </div>

        {/* Error Alert - Enhanced */}
        {hasErrors && (
          <div className="backdrop-blur-xl bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 flex items-start gap-3 animate-shake shadow-lg">
            <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-300 font-bold mb-2 text-lg">Validation Errors</h3>
              <ul className="text-sm text-red-400 space-y-1.5">
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {error.message || `Invalid ${key}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="backdrop-blur-xl bg-[#1a1815]/90 border-2 border-[#f59e0b]/20 p-1.5 rounded-2xl shadow-2xl">
              <TabsTrigger 
                value="template"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f59e0b] data-[state=active]:to-[#fbbf24] data-[state=active]:text-[#0f0e0a] data-[state=active]:shadow-lg rounded-xl px-8 py-3 transition-all duration-300 font-bold text-[#b0b0b0] hover:text-[#fff4ed] flex items-center gap-2"
              >
                <Layout className="h-5 w-5" />
                <span>Templates</span>
                {selectedTemplate && <CheckCircle2 className="h-4 w-4" />}
              </TabsTrigger>
              <TabsTrigger 
                value="form"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f59e0b] data-[state=active]:to-[#fbbf24] data-[state=active]:text-[#0f0e0a] data-[state=active]:shadow-lg rounded-xl px-8 py-3 transition-all duration-300 font-bold text-[#b0b0b0] hover:text-[#fff4ed] flex items-center gap-2"
              >
                <FileText className="h-5 w-5" />
                <span>Content</span>
                {formCompletion > 50 && <CheckCircle2 className="h-4 w-4" />}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Template Selection - Enhanced */}
          <TabsContent value="template" className="animate-fadeIn">
            <div className="backdrop-blur-xl bg-[#1a1815]/90 rounded-3xl border-2 border-[#f59e0b]/20 p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-[#fff4ed] flex items-center gap-3">
                  <Palette className="h-8 w-8 text-[#f59e0b]" />
                  Choose Your Template
                </h2>
                {selectedTemplate && (
                  <button
                    onClick={() => setActiveTab("form")}
                    className="flex items-center gap-2 text-[#f59e0b] hover:text-[#fbbf24] transition-colors font-semibold"
                  >
                    <span>Continue to Content</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`group cursor-pointer backdrop-blur-xl bg-[#252218]/60 rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${
                      selectedTemplate === template.id
                        ? "border-[#f59e0b] shadow-2xl shadow-[#f59e0b]/30 ring-4 ring-[#f59e0b]/20"
                        : "border-[#f59e0b]/20 hover:border-[#f59e0b]/50 hover:shadow-xl"
                    }`}
                  >
                    <div className="mb-6 h-48 bg-gradient-to-br from-[#252218] to-[#1a1815] rounded-xl flex items-center justify-center overflow-hidden relative">
                      <div className="text-center p-4 transition-transform duration-300 group-hover:scale-110">
                        <div className="text-6xl mb-3 animate-bounce-slow">{template.icon}</div>
                        <p className="text-xs text-[#b0b0b0] font-medium">Click to select</p>
                      </div>
                      {selectedTemplate === template.id && (
                        <div className="absolute inset-0 bg-[#f59e0b]/20 backdrop-blur-sm flex items-center justify-center">
                          <div className="bg-[#0f0e0a] rounded-full p-3">
                            <CheckCircle className="h-12 w-12 text-[#f59e0b] animate-pulse" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-[#fff4ed] mb-2 group-hover:text-[#fbbf24] transition-colors">
                            {template.name}
                          </h3>
                          <p className="text-sm text-[#b0b0b0] leading-relaxed">
                            {template.description}
                          </p>
                        </div>
                        {selectedTemplate === template.id && (
                          <CheckCircle className="h-6 w-6 text-[#f59e0b] flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      
                      {template.requiresPhoto && (
                        <div className="flex items-center gap-2 text-xs text-[#f59e0b] bg-[#f59e0b]/10 px-3 py-2 rounded-lg border border-[#f59e0b]/20">
                          <ImageIcon className="h-4 w-4" />
                          <span className="font-medium">Photo required</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {errors.template && (
                <div className="mt-6 flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{errors.template.message}</span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Form Tab - Enhanced */}
          <TabsContent value="form" className="animate-fadeIn">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Photo Upload - Enhanced */}
              {currentTemplate?.requiresPhoto && (
                <div className="backdrop-blur-xl bg-[#1a1815]/90 rounded-3xl border-2 border-[#f59e0b]/20 p-8 shadow-2xl">
                  <h3 className="text-2xl font-bold text-[#fff4ed] mb-6 flex items-center gap-3">
                    <ImageIcon className="h-7 w-7 text-[#f59e0b]" />
                    <span>Profile Photo</span>
                    <span className="text-sm font-normal text-[#f59e0b] bg-[#f59e0b]/10 px-3 py-1 rounded-full">
                      Required
                    </span>
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <label className="cursor-pointer backdrop-blur-xl bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 border-2 border-dashed border-[#f59e0b]/40 hover:border-[#f59e0b]/60 rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center w-full sm:w-auto min-w-[200px] hover:scale-105 active:scale-95 group">
                      <Upload className="h-12 w-12 text-[#f59e0b] mb-3 group-hover:scale-110 transition-transform" />
                      <span className="text-[#fbbf24] font-bold text-base">Upload Photo</span>
                      <span className="text-xs text-[#b0b0b0] mt-2">Max 5MB • JPG, PNG</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {photoPreview && (
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#f59e0b]/20 to-[#fbbf24]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="relative w-40 h-40 rounded-2xl object-cover border-4 border-[#f59e0b]/50 shadow-2xl"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Information - Enhanced */}
              <div className="backdrop-blur-xl bg-[#1a1815]/90 rounded-3xl border-2 border-[#f59e0b]/20 p-8 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center text-[#fff4ed] gap-3">
                  <User className="h-7 w-7 text-[#f59e0b]" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#b0b0b0] flex items-center gap-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <Input
                      {...register("contactInfo.fullName")}
                      placeholder="John Doe"
                      className="w-full px-4 py-3.5 bg-[#252218]/60 border-2 border-[#f59e0b]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b] transition-all duration-300 text-[#fff4ed] placeholder-[#6b6b6b] font-medium hover:border-[#f59e0b]/40"
                    />
                    {errors.contactInfo?.fullName && (
                      <p className="text-sm text-red-400 flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        {errors.contactInfo.fullName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#b0b0b0] flex items-center gap-2">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <Input
                      {...register("contactInfo.email")}
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-3.5 bg-[#252218]/60 border-2 border-[#f59e0b]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b] transition-all duration-300 text-[#fff4ed] placeholder-[#6b6b6b] font-medium hover:border-[#f59e0b]/40"
                    />
                    {errors.contactInfo?.email && (
                      <p className="text-sm text-red-400 flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        {errors.contactInfo.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#b0b0b0] flex items-center gap-2">
                      Mobile Number <span className="text-red-400">*</span>
                    </label>
                    <Input
                      {...register("contactInfo.mobile")}
                      type="tel"
                      placeholder="+1 234 567 8900"
                      className="w-full px-4 py-3.5 bg-[#252218]/60 border-2 border-[#f59e0b]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b] transition-all duration-300 text-[#fff4ed] placeholder-[#6b6b6b] font-medium hover:border-[#f59e0b]/40"
                    />
                    {errors.contactInfo?.mobile && (
                      <p className="text-sm text-red-400 flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        {errors.contactInfo.mobile.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#b0b0b0]">LinkedIn URL</label>
                    <Input
                      {...register("contactInfo.linkedin")}
                      type="url"
                      placeholder="https://linkedin.com/in/your-profile"
                      className="w-full px-4 py-3.5 bg-[#252218]/60 border-2 border-[#f59e0b]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b] transition-all duration-300 text-[#fff4ed] placeholder-[#6b6b6b] font-medium hover:border-[#f59e0b]/40"
                    />
                    {errors.contactInfo?.linkedin && (
                      <p className="text-sm text-red-400 flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        {errors.contactInfo.linkedin.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary - Enhanced */}
              <div className="backdrop-blur-xl bg-[#1a1815]/90 rounded-3xl border-2 border-[#f59e0b]/20 p-8 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center justify-between text-[#fff4ed]">
                  <span className="flex items-center gap-3">
                    <FileText className="h-7 w-7 text-[#f59e0b]" />
                    Professional Summary
                  </span>
                  <span className={`text-sm font-bold px-4 py-2 rounded-full ${
                    (watch("summary")?.length || 0) < 50 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    (watch("summary")?.length || 0) > 450 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20'
                  }`}>
                    {watch("summary")?.length || 0}/500
                  </span>
                </h3>
                <Controller
                  name="summary"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      className="h-40 w-full px-4 py-4 bg-[#252218]/60 border-2 border-[#f59e0b]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b] transition-all duration-300 text-[#fff4ed] placeholder-[#6b6b6b] resize-none font-medium leading-relaxed hover:border-[#f59e0b]/40"
                      placeholder="Write a compelling professional summary that highlights your expertise, achievements, and career goals..."
                    />
                  )}
                />
                {errors.summary && (
                  <p className="text-sm text-red-400 mt-3 flex items-center gap-2 font-medium bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    {errors.summary.message}
                  </p>
                )}
              </div>

              {/* Skills - Enhanced */}
              <div className="backdrop-blur-xl bg-[#1a1815]/90 rounded-3xl border-2 border-[#f59e0b]/20 p-8 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center justify-between text-[#fff4ed]">
                  <span className="flex items-center gap-3">
                    <Sparkles className="h-7 w-7 text-[#f59e0b]" />
                    Skills
                  </span>
                  <span className={`text-sm font-bold px-4 py-2 rounded-full ${
                    (watch("skills")?.length || 0) < 10 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    (watch("skills")?.length || 0) > 900 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20'
                  }`}>
                    {watch("skills")?.length || 0}/1000
                  </span>
                </h3>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      className="h-40 w-full px-4 py-4 bg-[#252218]/60 border-2 border-[#f59e0b]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b] transition-all duration-300 text-[#fff4ed] placeholder-[#6b6b6b] resize-none font-medium leading-relaxed hover:border-[#f59e0b]/40"
                      placeholder="List your technical skills, soft skills, tools, and technologies (e.g., JavaScript, React, Node.js, Team Leadership, Project Management)"
                    />
                  )}
                />
                {errors.skills && (
                  <p className="text-sm text-red-400 mt-3 flex items-center gap-2 font-medium bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    {errors.skills.message}
                  </p>
                )}
              </div>

              {/* Experience - Enhanced */}
              <div className="backdrop-blur-xl bg-[#1a1815]/90 rounded-3xl border-2 border-[#f59e0b]/20 p-8 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center justify-between text-[#fff4ed]">
                  <span className="flex items-center gap-3">
                    <Briefcase className="h-7 w-7 text-[#f59e0b]" />
                    Work Experience
                  </span>
                  <span className="text-sm font-bold px-4 py-2 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
                    {formValues.experience?.length || 0} {formValues.experience?.length === 1 ? 'entry' : 'entries'}
                  </span>
                </h3>
                <Controller
                  name="experience"
                  control={control}
                  render={({ field }) => (
                    <EntryForm
                      type="Experience"
                      entries={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Education - Enhanced */}
              <div className="backdrop-blur-xl bg-[#1a1815]/90 rounded-3xl border-2 border-[#f59e0b]/20 p-8 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center justify-between text-[#fff4ed]">
                  <span className="flex items-center gap-3">
                    <FileText className="h-7 w-7 text-[#f59e0b]" />
                    Education
                  </span>
                  <span className="text-sm font-bold px-4 py-2 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
                    {formValues.education?.length || 0} {formValues.education?.length === 1 ? 'entry' : 'entries'}
                  </span>
                </h3>
                <Controller
                  name="education"
                  control={control}
                  render={({ field }) => (
                    <EntryForm
                      type="Education"
                      entries={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Projects - Enhanced */}
              <div className="backdrop-blur-xl bg-[#1a1815]/90 rounded-3xl border-2 border-[#f59e0b]/20 p-8 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center justify-between text-[#fff4ed]">
                  <span className="flex items-center gap-3">
                    <Sparkles className="h-7 w-7 text-[#f59e0b]" />
                    Projects
                  </span>
                  <span className="text-sm font-bold px-4 py-2 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
                    {formValues.projects?.length || 0} {formValues.projects?.length === 1 ? 'entry' : 'entries'}
                  </span>
                </h3>
                <Controller
                  name="projects"
                  control={control}
                  render={({ field }) => (
                    <EntryForm
                      type="Project"
                      entries={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {/* Live Preview - Enhanced */}
        <div 
          className={`backdrop-blur-xl bg-[#1a1815]/90 rounded-3xl border-2 border-[#f59e0b]/20 p-8 shadow-2xl ${!showPreview ? 'hidden print:block' : 'animate-fadeIn'}`}
        >
          {showPreview && (
            <div className="flex items-center justify-between mb-6 print:hidden">
              <h3 className="text-2xl font-bold text-[#fff4ed] flex items-center gap-3">
                <Eye className="h-7 w-7 text-[#f59e0b]" />
                Live Preview
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-[#b0b0b0] hover:text-[#fff4ed] transition-colors hover:scale-110 active:scale-95 p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden resume-print-container">
            <div className={showPreview ? "transform origin-top transition-transform duration-300" : ""} style={{ transform: showPreview ? 'scale(0.85)' : 'scale(1)' }}>
              {renderTemplate()}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        @media print {
          body > *:not(#__next) {
            display: none !important;
          }
          
          #__next > *:not(main) {
            display: none !important;
          }
          
          main > *:not(.resume-print-container) {
            display: none !important;
          }
          
          .resume-print-container {
            display: block !important;
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .resume-print-container * {
            visibility: visible !important;
          }
          
          .resume-print-container > div {
            transform: none !important;
            scale: 1 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }
          
          @page {
            margin: 0;
            size: A4 portrait;
          }
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #1a1815;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #f59e0b, #fbbf24);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #fbbf24, #f59e0b);
        }
      `}</style>
    </div>
  );
}