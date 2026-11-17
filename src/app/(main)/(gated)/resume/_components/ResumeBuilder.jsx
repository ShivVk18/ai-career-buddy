"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
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
  GraduationCap,
  CheckCircle2,
  Layers,
  PlusCircle,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { saveResume } from "@/actions/Resume";
import { EntryForm } from "./EntryForm";
import { AITextarea } from "./AITextarea";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

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


const resumeSchema = z.object({
  contactInfo: z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
    email: z.string().email("Invalid email address"),
    mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
    linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
    twitter: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
    socialLinks: z.array(z.object({
      name: z.string().min(1, "Name is required"),
      url: z.string().url("Invalid URL")
    })).optional().default([]),
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
        socialLinks: initialResume?.contactInfo?.socialLinks || [],
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

  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
    control,
    name: "contactInfo.socialLinks",
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
        description: "Your changes are now safe and sound.",
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
  }, [formValues, autoSaveEnabled, isDirty, handleSubmit]);

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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "480px", background: "var(--divider)", border: "1px dashed var(--border)", opacity: 0.5 }}>
          <Layout className="h-16 w-16 text-muted-foreground mb-6" />
          <p className="text-foreground text-lg font-clash font-bold uppercase tracking-tight">Select a Template</p>
          <p className="text-muted-foreground text-sm mt-2 font-general font-light">Choose from 6 professional designs above</p>
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

    const loadingToast = toast.loading("Preparing your download...");

    try {
      // Find the element to capture
      const element = document.getElementById("resume-print-container");
      if (!element) {
        throw new Error("Preview container not found");
      }

      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      
      const fileName = `${formValues.contactInfo?.fullName?.replace(/\s+/g, "_") || "resume"}_AscendAI.pdf`;
      pdf.save(fileName);
      
      toast.dismiss(loadingToast);
      toast.success("Resume downloaded! 📄");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.dismiss(loadingToast);
      toast.error("Download failed", {
        description: "Something went wrong while generating the PDF.",
      });
    }
  };

  // Template selection
  const handleTemplateSelect = useCallback((templateId) => {
    setSelectedTemplate(templateId);
    setValue("template", templateId, { shouldDirty: true });
    setActiveTab("form");
    toast.success("Template selected", {
      description: "Now let's fill in your details!",
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
    <div className="min-h-screen py-8 md:py-12 bg-transparent">
      <div className="max-w-7xl mx-auto space-y-12 px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 border-b border-divider pb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-8 h-[1px] bg-accent"></div>
            <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
              Resume Builder
            </span>
            <div className="w-8 h-[1px] bg-accent"></div>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-clash font-bold text-foreground uppercase tracking-tight leading-none mb-6">
            Your Professional <span className="text-accent">Story</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 font-light leading-relaxed">
            Choose a premium template and let AI help you craft a resume that gets you hired.
          </p>
          
          {/* Progress Indicator */}
          <div className="mt-12 max-w-md mx-auto">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-widest uppercase mb-3">
              <span className="text-muted-foreground">Resume Completion</span>
              <span className="text-accent">{formCompletion}%</span>
            </div>
            <div className="h-1 bg-divider rounded-full overflow-hidden border border-divider/20">
              <div 
                className="h-full bg-accent transition-all duration-700 ease-editorial"
                style={{ width: `${formCompletion}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving || !isDirty}
            className="min-w-[200px] shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-3" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-3" />
                {isDirty ? "Save Changes" : "Resume Saved"}
              </>
            )}
          </Button>
          
          <Button
            onClick={generatePDF}
            disabled={!selectedTemplate}
            variant="outline"
            className="min-w-[200px] border-divider hover:border-accent"
          >
            <Download className="h-5 w-5 mr-3" />
            Download PDF
          </Button>
          
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="ghost"
            className="border border-divider min-w-[200px]"
          >
            {showPreview ? <EyeOff className="h-5 w-5 mr-3" /> : <Eye className="h-5 w-5 mr-3" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>

        {/* Auto-save and Status */}
        <div className="flex justify-center items-center gap-6 text-[10px] font-bold tracking-widest uppercase flex-wrap">
          <label className="flex items-center gap-3 cursor-pointer text-muted-foreground hover:text-foreground transition-editorial bg-divider/10 px-6 py-2 rounded-sm border border-divider/20">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="w-4 h-4 rounded-sm border-divider bg-background text-accent focus:ring-accent focus:ring-offset-0"
            />
            <span>Auto-save Changes</span>
          </label>
          {isDirty && autoSaveEnabled && (
            <span className="text-accent flex items-center gap-3 bg-accent/5 px-6 py-2 rounded-sm border border-accent/20 animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
        </div>

        {/* Error Alert */}
        {hasErrors && (
          <div className="border border-destructive/30 bg-destructive/5 rounded-sm p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-destructive font-clash font-bold uppercase tracking-tight mb-2">Oops! Check these fields</h3>
              <ul className="text-[10px] font-bold uppercase tracking-widest text-destructive/80 space-y-1">
                {Object.entries(errors).map(([key, error]) => (
                  <li key={key} className="flex items-center gap-2">
                    {error.message || `Invalid input: ${key}`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-background border border-border p-1 rounded-sm gap-1">
              <TabsTrigger 
                value="template"
                className="data-[state=active]:bg-divider data-[state=active]:text-foreground rounded-sm px-10 py-3 transition-editorial font-clash font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-3"
              >
                <Layout className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger 
                value="form"
                className="data-[state=active]:bg-divider data-[state=active]:text-foreground rounded-sm px-10 py-3 transition-editorial font-clash font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-3"
              >
                <FileText className="h-4 w-4" />
                Edit Details
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Template Selection */}
          <TabsContent value="template" className="animate-in fade-in duration-500">
            <div className="border border-border bg-background rounded-sm p-8 shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-divider pb-8">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">Step 1</span>
                  <h2 className="text-2xl md:text-3xl font-clash font-bold text-foreground flex items-center gap-3 uppercase tracking-tight">
                    <Palette className="h-6 w-6 text-accent" />
                    Select a Template
                  </h2>
                </div>
                {selectedTemplate && (
                  <Button
                    onClick={() => setActiveTab("form")}
                    variant="outline"
                    className="h-12 px-8 border-divider"
                  >
                    <span>Next: Edit Details</span>
                    <ChevronRight className="h-4 w-4 ml-3" />
                  </Button>
                )}
              </div>

              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {TEMPLATES.map((template) => {
                  const TemplatePreview = template.component;
                  return (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`group cursor-pointer rounded-sm border transition-editorial overflow-hidden shadow-sm hover:shadow-md ${
                        selectedTemplate === template.id
                          ? "border-accent ring-1 ring-accent/20"
                          : "border-divider/50 hover:border-accent"
                      }`}
                    >
                      {/* Live Template Thumbnail */}
                      <div className="relative h-52 bg-white overflow-hidden">
                        <div
                          className="scale-[0.28] origin-top-left w-[357%] h-[357%] pointer-events-none"
                        >
                          <TemplatePreview
                            data={{
                              contactInfo: { fullName: "Alex Morgan", email: "alex@example.com", mobile: "+1 555 0100" },
                              summary: "Strategic professional with a track record of delivering exceptional results across complex initiatives.",
                              skills: "Leadership · Strategy · Communication · Analytics · Innovation",
                              experience: [{ title: "Senior Manager", organization: "Acme Corp", startDate: "2022", endDate: "2024", current: false, description: "Led cross-functional teams." }],
                              education: [{ title: "MBA", organization: "State University", startDate: "2018", endDate: "2020", current: false }],
                              projects: [],
                            }}
                            photo={null}
                          />
                        </div>
                        {selectedTemplate === template.id && (
                          <div className="absolute inset-0 bg-accent/20 flex items-center justify-center animate-in fade-in">
                            <div className="bg-background rounded-full p-2 shadow-lg">
                              <CheckCircle className="h-8 w-8 text-accent" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="p-5 bg-divider/5 border-t border-divider/30 space-y-3">
                        <div>
                          <h3 className="text-sm font-clash font-bold text-foreground group-hover:text-accent transition-editorial uppercase tracking-tight">
                            {template.name}
                          </h3>
                          <p className="text-[11px] text-muted-foreground leading-relaxed font-general font-light mt-1">
                            {template.description}
                          </p>
                        </div>
                        {template.requiresPhoto && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-accent bg-accent/5 px-3 py-1 rounded-sm border border-accent/20 uppercase tracking-widest w-fit">
                            <ImageIcon className="h-3 w-3" />
                            <span>Photo Supported</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </TabsContent>

          {/* Form Tab */}
          <TabsContent value="form" className="animate-in fade-in duration-500">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Photo Upload */}
              {currentTemplate?.requiresPhoto && (
                <div className="border border-border bg-background rounded-sm p-8 shadow-lg">
                  <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center gap-3">
                    <ImageIcon className="h-4 w-4 text-accent" />
                    Your Photo
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <label className="cursor-pointer border-2 border-dashed border-divider hover:border-accent bg-divider/5 rounded-sm p-10 transition-editorial flex flex-col items-center justify-center min-w-[200px] group">
                      <Upload className="h-10 w-10 text-muted-foreground group-hover:text-accent transition-editorial mb-4" />
                      <span className="text-foreground font-clash font-bold uppercase tracking-widest text-xs">Upload Photo</span>
                      <span className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Drag or select</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {photoPreview && (
                      <div className="relative group">
                        <div className="absolute inset-0 bg-accent/20 rounded-sm blur-xl group-hover:blur-2xl transition-editorial"></div>
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="relative w-40 h-40 rounded-sm object-cover border border-accent/50 shadow-2xl"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-2 transition-editorial opacity-0 group-hover:opacity-100 hover:scale-110 shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="border border-border bg-background rounded-sm p-8 shadow-lg">
                <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center gap-3">
                  <User className="h-4 w-4 text-accent" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                      Full Name <span className="text-destructive/50">*</span>
                    </label>
                    <Input
                      {...register("contactInfo.fullName")}
                      placeholder="e.g. John Doe"
                    />
                    {errors.contactInfo?.fullName && (
                      <p className="text-[10px] text-destructive font-bold uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        {errors.contactInfo.fullName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                      Email Address <span className="text-destructive/50">*</span>
                    </label>
                    <Input
                      {...register("contactInfo.email")}
                      type="email"
                      placeholder="hello@example.com"
                    />
                    {errors.contactInfo?.email && (
                      <p className="text-[10px] text-destructive font-bold uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        {errors.contactInfo.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                      Phone Number <span className="text-destructive/50">*</span>
                    </label>
                    <Input
                      {...register("contactInfo.mobile")}
                      type="tel"
                      placeholder="+1 234 567 890"
                    />
                    {errors.contactInfo?.mobile && (
                      <p className="text-[10px] text-destructive font-bold uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        {errors.contactInfo.mobile.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">LinkedIn Profile</label>
                    <Input
                      {...register("contactInfo.linkedin")}
                      type="url"
                      placeholder="https://linkedin.com/in/johndoe"
                    />
                    {errors.contactInfo?.linkedin && (
                      <p className="text-[10px] text-destructive font-bold uppercase tracking-widest flex items-center gap-2">
                        <AlertCircle className="h-3 w-3" />
                        {errors.contactInfo.linkedin.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Social Links */}
                <div className="mt-8 pt-8 border-t border-divider border-dashed">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Additional Social Links</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => appendSocial({ name: "", url: "" })}
                      className="text-accent hover:text-foreground h-auto p-0 hover:bg-transparent"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Add Link</span>
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {socialFields.map((field, index) => (
                      <div key={field.id} className="flex gap-4 items-start">
                        <div className="flex-1 space-y-3">
                          <Input
                            {...register(`contactInfo.socialLinks.${index}.name`)}
                            placeholder="Platform (e.g. GitHub, Portfolio)"
                            className="h-10"
                          />
                          {errors.contactInfo?.socialLinks?.[index]?.name && (
                            <p className="text-[10px] text-destructive font-bold uppercase tracking-widest">
                              {errors.contactInfo.socialLinks[index].name.message}
                            </p>
                          )}
                        </div>
                        <div className="flex-[2] space-y-3">
                          <Input
                            {...register(`contactInfo.socialLinks.${index}.url`)}
                            placeholder="URL"
                            className="h-10"
                          />
                          {errors.contactInfo?.socialLinks?.[index]?.url && (
                            <p className="text-[10px] text-destructive font-bold uppercase tracking-widest">
                              {errors.contactInfo.socialLinks[index].url.message}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeSocial(index)}
                          className="h-10 px-3 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="border border-border bg-background rounded-sm p-8 shadow-lg">
                <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-accent" />
                    Professional Summary
                  </span>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-sm border ${
                    (watch("summary")?.length || 0) < 50 ? 'bg-destructive/5 text-destructive border-destructive/20' :
                    (watch("summary")?.length || 0) > 450 ? 'bg-accent/10 text-accent border-accent/20' :
                    'bg-divider/10 text-muted-foreground border-divider/20'
                  }`}>
                    {watch("summary")?.length || 0} / 500
                  </span>
                </h3>
                <Controller
                  name="summary"
                  control={control}
                  render={({ field }) => (
                    <AITextarea
                      {...field}
                      type="summary"
                      placeholder="Write a brief overview of your career, key achievements, and what you're looking for next..."
                    />
                  )}
                />
                {errors.summary && (
                  <p className="text-[10px] text-destructive mt-4 font-bold uppercase tracking-widest flex items-center gap-3 bg-destructive/5 p-3 border border-destructive/10 rounded-sm">
                    <AlertCircle className="h-3 w-3" />
                    {errors.summary.message}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div className="border border-border bg-background rounded-sm p-8 shadow-lg">
                <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-accent" />
                    Your Skills
                  </span>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-sm border ${
                    (watch("skills")?.length || 0) < 10 ? 'bg-destructive/5 text-destructive border-destructive/20' :
                    (watch("skills")?.length || 0) > 900 ? 'bg-accent/10 text-accent border-accent/20' :
                    'bg-divider/10 text-muted-foreground border-divider/20'
                  }`}>
                    {watch("skills")?.length || 0} / 1000
                  </span>
                </h3>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <AITextarea
                      {...field}
                      type="skills"
                      placeholder="List your key skills, tools, and expertise (separated by commas or on new lines)..."
                    />
                  )}
                />
                {errors.skills && (
                  <p className="text-[10px] text-destructive mt-4 font-bold uppercase tracking-widest flex items-center gap-3 bg-destructive/5 p-3 border border-destructive/10 rounded-sm">
                    <AlertCircle className="h-3 w-3" />
                    {errors.skills.message}
                  </p>
                )}
              </div>

              {/* Experience */}
              <div className="border border-border bg-background rounded-sm p-8 shadow-lg">
                <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-accent" />
                    Work Experience
                  </span>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-sm bg-divider/10 text-muted-foreground border border-divider/20 uppercase tracking-widest">
                    {formValues.experience?.length || 0} Entries
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
              <div className="border border-border bg-background rounded-sm p-8 shadow-lg">
                <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-accent" />
                    Education
                  </span>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-sm bg-divider/10 text-muted-foreground border border-divider/20 uppercase tracking-widest">
                    {formValues.education?.length || 0} Entries
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
              <div className="border border-border bg-background rounded-sm p-8 shadow-lg">
                <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-accent" />
                    Personal Projects
                  </span>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-sm bg-divider/10 text-muted-foreground border border-divider/20 uppercase tracking-widest">
                    {formValues.projects?.length || 0} Entries
                  </span>
                </h3>
                <Controller
                  name="projects"
                  control={control}
                  render={({ field }) => (
                    <EntryForm
                      type="Projects"
                      entries={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden container for PDF generation (used when preview is closed) */}
      {!showPreview && (
        <div className="absolute top-[200vh] left-[-9999px] pointer-events-none">
          <div id="resume-print-container" className="bg-white w-[210mm] min-h-[297mm] flex flex-col [&>div]:flex-1">
            {renderTemplate()}
          </div>
        </div>
      )}

      {/* Full Screen Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-divider bg-background shadow-sm relative z-10">
            <h2 className="text-xl md:text-2xl font-clash font-bold uppercase tracking-tight flex items-center gap-3">
              <Eye className="h-6 w-6 text-accent" />
              Resume Preview
            </h2>
            <div className="flex items-center gap-3">
              <Button onClick={generatePDF} className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={() => setShowPreview(false)} variant="ghost" className="text-muted-foreground hover:text-foreground h-10 w-10 p-0 rounded-full bg-divider/10 hover:bg-divider/20">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-divider/10">
            {/* Wrapper to handle scaling nicely without cutting off content in some browsers */}
            <div className="h-fit w-fit origin-top scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 transition-transform duration-300 shadow-2xl ring-1 ring-black/5 bg-white">
              <div id="resume-print-container" className="bg-white w-[210mm] min-h-[297mm] flex flex-col [&>div]:flex-1">
                {renderTemplate()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}