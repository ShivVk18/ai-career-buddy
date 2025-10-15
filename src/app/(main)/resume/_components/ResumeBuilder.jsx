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
    color: "blue",
    component: ModernProTemplate,
    icon: "💼",
  },
  {
    id: "minimal-classic",
    name: "Minimal Classic",
    description: "Traditional layout focused on content",
    requiresPhoto: false,
    color: "gray",
    component: MinimalClassicTemplate,
    icon: "📄",
  },
  {
    id: "creative-bold",
    name: "Creative Bold",
    description: "Eye-catching design with vibrant colors",
    requiresPhoto: true,
    color: "purple",
    component: CreativeBoldTemplate,
    icon: "🎨",
  },
  {
    id: "executive-elite",
    name: "Executive Elite",
    description: "Sophisticated layout for senior roles",
    requiresPhoto: true,
    color: "emerald",
    component: ExecutiveEliteTemplate,
    icon: "👔",
  },
  {
    id: "tech-modern",
    name: "Tech Modern",
    description: "Developer-friendly with code-style aesthetics",
    requiresPhoto: false,
    color: "cyan",
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
    mode: "onChange", // Enable real-time validation
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
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [formValues, autoSaveEnabled, isDirty]);

  // Photo upload with validation
  const handlePhotoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload a valid image file");
      return;
    }

    // Validate file size (5MB)
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
        <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg">
          <Layout className="h-16 w-16 text-gray-500 mb-4" />
          <p className="text-gray-400 text-lg font-medium">Select a template to preview</p>
          <p className="text-gray-500 text-sm mt-2">Choose from our professional templates above</p>
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

    // Helper function to add text with word wrapping
    const addText = (text, fontSize, isBold = false, color = [0, 0, 0], indent = 0) => {
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", isBold ? "bold" : "normal");
      pdf.setTextColor(...color);
      
      const lines = pdf.splitTextToSize(text, contentWidth - indent);
      
      // Check if we need a new page
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

    // Header - Name and Contact
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

    // Summary Section
    if (formValues.summary) {
      addText("PROFESSIONAL SUMMARY", 12, true, [0, 0, 0]);
      addSpace(3);
      addText(formValues.summary, 10, false, [40, 40, 40]);
      addSpace(5);
      addLine();
      addSpace(3);
    }

    // Skills Section
    if (formValues.skills) {
      addText("SKILLS", 12, true, [0, 0, 0]);
      addSpace(3);
      addText(formValues.skills, 10, false, [40, 40, 40]);
      addSpace(5);
      addLine();
      addSpace(3);
    }

    // Experience Section
    if (formValues.experience && formValues.experience.length > 0) {
      addText("WORK EXPERIENCE", 12, true, [0, 0, 0]);
      addSpace(3);
      
      formValues.experience.forEach((exp, index) => {
        // Job Title
        addText(exp.title, 11, true, [0, 0, 0]);
        addSpace(2);
        
        // Company and Date
        const dateRange = exp.current 
          ? `${exp.startDate} - Present` 
          : `${exp.startDate} - ${exp.endDate}`;
        addText(`${exp.organization} | ${dateRange}`, 9, false, [80, 80, 80]);
        addSpace(2);
        
        // Description
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

    // Education Section
    if (formValues.education && formValues.education.length > 0) {
      addText("EDUCATION", 12, true, [0, 0, 0]);
      addSpace(3);
      
      formValues.education.forEach((edu, index) => {
        // Degree
        addText(edu.title, 11, true, [0, 0, 0]);
        addSpace(2);
        
        // Institution and Date
        const dateRange = edu.current 
          ? `${edu.startDate} - Present` 
          : `${edu.startDate} - ${edu.endDate}`;
        addText(`${edu.organization} | ${dateRange}`, 9, false, [80, 80, 80]);
        addSpace(2);
        
        // Description
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

    // Projects Section
    if (formValues.projects && formValues.projects.length > 0) {
      addText("PROJECTS", 12, true, [0, 0, 0]);
      addSpace(3);
      
      formValues.projects.forEach((project, index) => {
        // Project Title
        addText(project.title, 11, true, [0, 0, 0]);
        addSpace(2);
        
        // Date
        const dateRange = project.current 
          ? `${project.startDate} - Present` 
          : `${project.startDate} - ${project.endDate}`;
        addText(dateRange, 9, false, [80, 80, 80]);
        addSpace(2);
        
        // Description
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/20 backdrop-blur-xl mb-6">
          <Sparkles className="h-4 w-4 text-orange-400 mr-2" />
          <span className="text-sm font-medium text-orange-300">Professional Resume Builder</span>
          <FileText className="h-4 w-4 text-rose-400 ml-2" />
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
          Resume Builder
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
          Choose a template and create your professional resume in minutes
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving || !isDirty}
          className="bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white py-3 px-8 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 font-semibold shadow-lg shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-105"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>{isDirty ? "Save Changes" : "Saved"}</span>
            </>
          )}
        </button>
        <button
          onClick={generatePDF}
          disabled={!selectedTemplate}
          className="backdrop-blur-xl bg-slate-800/50 border border-orange-500/30 hover:border-orange-500/50 text-white py-3 px-8 rounded-2xl transition-all duration-300 font-semibold hover:bg-slate-800/70 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-5 w-5" />
          <span>Download PDF</span>
        </button>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="backdrop-blur-xl bg-slate-800/50 border border-orange-500/30 hover:border-orange-500/50 text-white py-3 px-8 rounded-2xl transition-all duration-300 font-semibold hover:bg-slate-800/70 flex items-center justify-center space-x-3"
        >
          {showPreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          <span>{showPreview ? "Hide Preview" : "Show Preview"}</span>
        </button>
      </div>

      {/* Auto-save indicator */}
      <div className="flex justify-center items-center gap-3 text-sm">
        <label className="flex items-center gap-2 cursor-pointer text-gray-400">
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={(e) => setAutoSaveEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-orange-500/30 bg-slate-900/50 text-orange-500"
          />
          Auto-save
        </label>
        {isDirty && autoSaveEnabled && (
          <span className="text-orange-400 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Changes pending...
          </span>
        )}
      </div>

      {/* Error Alert */}
      {hasErrors && (
        <div className="backdrop-blur-xl bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-rose-300 font-semibold mb-1">Please fix the following errors:</h3>
            <ul className="text-sm text-rose-400 list-disc list-inside space-y-1">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>{error.message || `Invalid ${key}`}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="backdrop-blur-xl bg-slate-900/50 border border-orange-500/20 p-1 rounded-2xl">
          <TabsTrigger 
            value="template"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-rose-600 data-[state=active]:text-white rounded-xl px-6 py-2 transition-all duration-300"
          >
            <Layout className="h-4 w-4 mr-2" />
            Template
          </TabsTrigger>
          <TabsTrigger 
            value="form"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-rose-600 data-[state=active]:text-white rounded-xl px-6 py-2 transition-all duration-300"
          >
            <FileText className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
        </TabsList>

        {/* Template Selection Tab */}
        <TabsContent value="template" className="mt-8">
          <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <Palette className="h-6 w-6 text-orange-400 mr-3" />
              Choose Your Template
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`cursor-pointer backdrop-blur-xl bg-slate-800/50 rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 ${
                    selectedTemplate === template.id
                      ? "border-orange-500 shadow-lg shadow-orange-500/30 ring-2 ring-orange-500/20"
                      : "border-orange-500/20 hover:border-orange-500/40"
                  }`}
                >
                  <div className="mb-4 h-48 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center overflow-hidden relative group">
                    <div className="text-center p-4 transition-transform duration-300 group-hover:scale-110">
                      <div className="text-6xl mb-3">{template.icon}</div>
                      <p className="text-xs text-gray-400 font-medium">Click to preview</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <div className="absolute inset-0 bg-orange-500/10 backdrop-blur-sm flex items-center justify-center">
                        <CheckCircle className="h-12 w-12 text-orange-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-400">{template.description}</p>
                    </div>
                    {selectedTemplate === template.id && (
                      <CheckCircle className="h-6 w-6 text-orange-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  
                  {template.requiresPhoto && (
                    <div className="flex items-center text-xs text-orange-400 mt-3">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Photo required
                    </div>
                  )}
                </div>
              ))}
            </div>
            {errors.template && (
              <p className="text-rose-400 text-sm mt-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.template.message}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Form Tab */}
        <TabsContent value="form" className="mt-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Photo Upload (conditional) */}
            {currentTemplate?.requiresPhoto && (
              <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
                <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                  <ImageIcon className="h-6 w-6 text-orange-400 mr-3" />
                  Profile Photo
                  <span className="ml-2 text-sm font-normal text-gray-400">(Required for this template)</span>
                </h3>
                <div className="flex items-center gap-6 flex-wrap">
                  <label className="cursor-pointer backdrop-blur-xl bg-orange-500/10 hover:bg-orange-500/20 border-2 border-dashed border-orange-500/30 hover:border-orange-500/50 rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center min-w-[200px]">
                    <Upload className="h-12 w-12 text-orange-400 mb-3" />
                    <span className="text-orange-300 font-medium">Upload Photo</span>
                    <span className="text-xs text-gray-400 mt-1">Max 5MB • JPG, PNG</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photoPreview && (
                    <div className="relative group">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-40 h-40 rounded-2xl object-cover border-4 border-orange-500/30"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-2 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <User className="h-6 w-6 text-orange-400 mr-3" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    {...register("contactInfo.fullName")}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500"
                  />
                  {errors.contactInfo?.fullName && (
                    <p className="text-sm text-rose-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.contactInfo.fullName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    Email <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    {...register("contactInfo.email")}
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500"
                  />
                  {errors.contactInfo?.email && (
                    <p className="text-sm text-rose-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.contactInfo.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    Mobile Number <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    {...register("contactInfo.mobile")}
                    type="tel"
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500"
                  />
                  {errors.contactInfo?.mobile && (
                    <p className="text-sm text-rose-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.contactInfo.mobile.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">LinkedIn URL</label>
                  <Input
                    {...register("contactInfo.linkedin")}
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500"
                  />
                  {errors.contactInfo?.linkedin && (
                    <p className="text-sm text-rose-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.contactInfo.linkedin.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <FileText className="h-6 w-6 text-orange-400 mr-3" />
                Professional Summary
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({watch("summary")?.length || 0}/500 characters)
                </span>
              </h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32 w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500 resize-none"
                    placeholder="Write a compelling professional summary that highlights your expertise, achievements, and career goals..."
                  />
                )}
              />
              {errors.summary && (
                <p className="text-sm text-rose-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.summary.message}
                </p>
              )}
            </div>

            {/* Skills */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <Sparkles className="h-6 w-6 text-orange-400 mr-3" />
                Skills
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({watch("skills")?.length || 0}/1000 characters)
                </span>
              </h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32 w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500 resize-none"
                    placeholder="List your technical skills, soft skills, tools, and technologies (e.g., JavaScript, React, Node.js, Team Leadership, Project Management)"
                  />
                )}
              />
              {errors.skills && (
                <p className="text-sm text-rose-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.skills.message}
                </p>
              )}
            </div>

            {/* Experience */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <Briefcase className="h-6 w-6 text-orange-400 mr-3" />
                Work Experience
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({formValues.experience?.length || 0} entries)
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

            {/* Education */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <FileText className="h-6 w-6 text-orange-400 mr-3" />
                Education
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({formValues.education?.length || 0} entries)
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

            {/* Projects */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <Sparkles className="h-6 w-6 text-orange-400 mr-3" />
                Projects
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({formValues.projects?.length || 0} entries)
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

      {/* Live Preview - Always render for printing, conditionally display */}
      <div 
        className={`mt-12 backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl ${!showPreview ? 'hidden print:block' : ''}`}
      >
        {showPreview && (
          <div className="flex items-center justify-between mb-6 print:hidden">
            <h3 className="text-2xl font-semibold text-white flex items-center">
              <Eye className="h-6 w-6 text-orange-400 mr-3" />
              Live Preview
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden resume-print-container">
          <div className={showPreview ? "transform scale-90 origin-top" : ""}>
            {renderTemplate()}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          /* Hide everything except the resume */
          body > *:not(#__next) {
            display: none !important;
          }
          
          #__next > *:not(main) {
            display: none !important;
          }
          
          main > *:not(.resume-print-container) {
            display: none !important;
          }
          
          /* Show only the resume preview */
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
      `}</style>
    </div>
  );
}