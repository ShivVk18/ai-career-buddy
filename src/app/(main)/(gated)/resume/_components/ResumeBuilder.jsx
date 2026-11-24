"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FieldError, FieldLabel, More, fieldClass } from "@/components/shared/ToolBits";
import ToolFrame from "@/components/shared/ToolFrame";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";
import { saveResume, deleteResume, restoreDeletedResume } from "@/actions/Resume";
import { deleteWithUndo } from "@/components/shared/undoDelete";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ensureEntryIds } from "@/lib/entryIds";
import { EntryForm } from "./EntryForm";
import ResumeToolsPanel from "./ResumeToolsPanel";
import { AITextarea } from "./AITextarea";
import useFetch from "@/hooks/use-fetch";
import { useSession } from "next-auth/react";

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
  },
  {
    id: "minimal-classic",
    name: "Minimal Classic",
    description: "Traditional layout focused on content",
    requiresPhoto: false,
    color: "amber",
    component: MinimalClassicTemplate,
  },
  {
    id: "creative-bold",
    name: "Creative Bold",
    description: "Eye-catching design with vibrant colors",
    requiresPhoto: true,
    color: "amber",
    component: CreativeBoldTemplate,
  },
  {
    id: "executive-elite",
    name: "Executive Elite",
    description: "Sophisticated layout for senior roles",
    requiresPhoto: true,
    color: "amber",
    component: ExecutiveEliteTemplate,
  },
  {
    id: "tech-modern",
    name: "Tech Modern",
    description: "Developer-friendly with code-style aesthetics",
    requiresPhoto: false,
    color: "amber",
    component: TechModernTemplate,
  },
  {
    id: "academic-formal",
    name: "Academic Formal",
    description: "Traditional academic CV format",
    requiresPhoto: false,
    color: "amber",
    component: AcademicFormalTemplate,
  },
];

// Legacy entries (saved without ids) get deterministic ids, identical to the server's.
const normalizedInitial = (resume) => ensureEntryIds(resume || {});

export default function ResumeBuilder({ initialContent, initialResume }) {
  const [activeTab, setActiveTab] = useState("template");
  const [selectedTemplate, setSelectedTemplate] = useState(initialResume?.templateId || "");
  const [photoPreview, setPhotoPreview] = useState(initialResume?.photoUrl || "");
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [resumeDeleted, setResumeDeleted] = useState(false);
  const [contactEditing, setContactEditing] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const router = useRouter();
  const user = useSession().data?.user;

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {
        fullName: initialResume?.contactInfo?.fullName || user?.name || "",
        email: initialResume?.contactInfo?.email || user?.email || "",
        mobile: initialResume?.contactInfo?.mobile || "",
        linkedin: initialResume?.contactInfo?.linkedin || "",
        twitter: initialResume?.contactInfo?.twitter || "",
        socialLinks: initialResume?.contactInfo?.socialLinks || [],
      },
      summary: initialResume?.summary || "",
      skills: initialResume?.skills || "",
      experience: normalizedInitial(initialResume).experience || [],
      education: normalizedInitial(initialResume).education || [],
      projects: normalizedInitial(initialResume).projects || [],
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

  // Values last sent through onSubmit; used to clear isDirty once that save succeeds.
  const lastSubmitted = useRef(null);
  const markSaved = (saved) => {
    // Only reset if the user hasn't edited since the save started.
    if (JSON.stringify(getValues()) === JSON.stringify(saved)) reset(saved);
  };

  // Success/Error handling
  useEffect(() => {
    if (saveResult && !isSaving) {
      if (lastSubmitted.current) {
        markSaved(lastSubmitted.current);
        lastSubmitted.current = null;
      }
      toast.success("resume saved", {
        description: "your changes are saved.",
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
    if (!autoSaveEnabled || !isDirty || resumeDeleted) return;

    const timeoutId = setTimeout(() => {
      handleSubmit(onSubmit)();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [formValues, autoSaveEnabled, isDirty, handleSubmit, resumeDeleted]);

  // Delete now, 5 s Undo (no confirm). Autosave is held off while the resume is deleted so it is not re-created.
  const deleteTimer = useRef(null);
  useEffect(() => () => clearTimeout(deleteTimer.current), []);

  // After the Undo window passes, clear the form to a fresh empty resume so a new one can be started and saved.
  const resetToEmpty = () => {
    reset({
      contactInfo: {
        fullName: user?.name || "",
        email: user?.email || "",
        mobile: "",
        linkedin: "",
        twitter: "",
        socialLinks: [],
      },
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
      template: "",
      photo: "",
    });
    setSelectedTemplate("");
    setPhotoPreview("");
    setResumeDeleted(false);
    router.refresh();
  };

  const handleDeleteResume = () => {
    let undoId = null;
    deleteWithUndo({
      name: "Resume",
      hide: () => setResumeDeleted(true),
      show: () => setResumeDeleted(false),
      remove: async () => {
        const res = await deleteResume();
        undoId = res?.undoId ?? null;
        return res;
      },
      restore: () => restoreDeletedResume(undoId),
      done: (phase) => {
        clearTimeout(deleteTimer.current);
        if (phase === "deleted") {
          deleteTimer.current = setTimeout(resetToEmpty, 5000);
        }
        router.refresh();
      },
    });
  };

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
          <p className="text-foreground text-lg font-bold tracking-tight">pick a template</p>
          <p className="text-muted-foreground text-sm mt-2 font-general font-light">six designs on the templates tab</p>
        </div>
      );
    }

    return <TemplateComponent data={templateData} photo={photoPreview} />;
  }, [formValues, currentTemplate, photoPreview]);

  // Versions and tailoring use the SAVED resume, so make sure the form is saved first.
  // Resolves true when saved (or nothing to save), false (with a toast) when it can't be.
  const ensureSaved = async () => {
    if (!isDirty) return true;
    let ok = false;
    await handleSubmit(
      async (data) => {
        try {
          await saveResume({
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
          ok = true;
          markSaved(data);
        } catch (e) {
          toast.error("Save your resume first", { description: e?.message || "Saving failed." });
        }
      },
      () => toast.error("Fix the highlighted resume fields and save, then try again.")
    )();
    return ok;
  };

  // Unsaved form values for the keyword match card (no AI).
  const getResumeLike = () => ({
    summary: formValues.summary || "",
    skills: formValues.skills || "",
    experience: formValues.experience || [],
    education: formValues.education || [],
    projects: formValues.projects || [],
  });

  // Form submission
  const onSubmit = async (data) => {
    lastSubmitted.current = data;
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
      toast.success("resume downloaded");
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
      description: "now fill in your details.",
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

  const PANEL = "rounded-[20px] border border-line bg-panel p-5 shadow-card sm:p-8";
  const H3 = "mb-5 flex flex-wrap items-center justify-between gap-2 font-doc text-xl text-text";
  const pill = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-panel px-5 text-sm text-text outline-none transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
  const count = (n, max, min = 0) => (
    <span className={cn("rounded-[9px] px-2.5 py-1 font-sans text-xs", n < min ? "bg-gap-soft text-gap-ink" : "bg-soft text-muted")}>{n} / {max}</span>
  );
  const tabCls = "min-h-10 flex-1 rounded-full px-4 text-sm text-muted data-[state=active]:bg-ink data-[state=active]:text-ink-foreground data-[state=active]:shadow-none sm:flex-none";
  const cv = formValues.contactInfo || {};
  const contactReady = !!(cv.fullName && cv.email && (cv.mobile || "").length >= 10) && !errors.contactInfo;
  const showContact = contactEditing || !contactReady;
  const errList = [];
  (function walk(o) {
    Object.values(o || {}).forEach((v) => {
      if (v?.message) errList.push(v.message);
      else if (v && typeof v === "object") walk(v);
    });
  })(errors);

  return (
    <>
    <ToolFrame
      title="resume builder"
      line="pip filled in what it knows. check it, pick a look, download."
      outfit="wizard"
      bare
      className="max-w-5xl"
    >
      <div className="space-y-6">
        {/* completion */}
        <div className="flex items-center gap-3" role="status" aria-label={`resume ${formCompletion}% complete`}>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft">
            <div className="h-full rounded-full bg-brand transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${formCompletion}%` }} />
          </div>
          <span className="text-xs text-muted">{formCompletion}% complete</span>
        </div>

        {/* actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving || !isDirty || resumeDeleted}
            className="btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {isSaving ? "saving…" : isDirty ? "save changes" : "saved"}
          </button>
          <button type="button" onClick={generatePDF} disabled={!selectedTemplate} className={pill}>
            <Download className="size-4" aria-hidden="true" /> download pdf
          </button>
          <button type="button" onClick={() => setShowPreview(!showPreview)} className={pill}>
            {showPreview ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            {showPreview ? "hide preview" : "preview"}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="more resume actions" className={cn(pill, "px-3")}>
                <MoreHorizontal className="size-5" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleDeleteResume} disabled={resumeDeleted || !initialResume} className="text-destructive">
                <Trash2 className="mr-2 size-4" aria-hidden="true" /> delete resume
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <label className="ml-auto inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={autoSaveEnabled} onChange={(e) => setAutoSaveEnabled(e.target.checked)} className="size-4 accent-[var(--brand)]" />
            auto-save
          </label>
          {isDirty && autoSaveEnabled && (
            <span className="inline-flex items-center gap-1.5 text-xs text-brand-ink" role="status">
              <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" /> saving soon
            </span>
          )}
        </div>

        {hasErrors && (
          <div role="alert" className="flex items-start gap-3 rounded-[14px] bg-gap-soft p-4 text-gap-ink">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">a few things need a look</p>
              <ul className="mt-1 list-disc pl-4 text-sm">
                {errList.map((m, i) => (
                  <li key={i}>{m.toLowerCase()}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex h-auto w-full gap-1 rounded-full bg-soft p-1 sm:inline-flex sm:w-auto">
            <TabsTrigger value="template" className={tabCls}><Layout className="size-4" aria-hidden="true" /> templates</TabsTrigger>
            <TabsTrigger value="form" className={tabCls}><FileText className="size-4" aria-hidden="true" /> details</TabsTrigger>
            <TabsTrigger value="tailor" className={tabCls}><Sparkles className="size-4" aria-hidden="true" /> tailor &amp; versions</TabsTrigger>
          </TabsList>

          <TabsContent value="tailor" className="fade-up">
            <ResumeToolsPanel ensureSaved={ensureSaved} getResumeLike={getResumeLike} />
          </TabsContent>

          <TabsContent value="template" className="fade-up">
            <div className={PANEL}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-doc text-2xl text-text">pick a look</h2>
                {selectedTemplate && (
                  <button type="button" onClick={() => setActiveTab("form")} className={pill}>
                    next: details <ChevronRight className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {TEMPLATES.map((template) => {
                  const TemplatePreview = template.component;
                  const on = selectedTemplate === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={cn("group overflow-hidden rounded-[20px] border text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", on ? "border-brand ring-1 ring-brand/40" : "border-line hover:border-brand/60")}
                    >
                      <div className="paper-doc relative h-52 overflow-hidden bg-white">
                        <div className="pointer-events-none h-[357%] w-[357%] origin-top-left scale-[0.28]">
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
                        {on && (
                          <div className="absolute inset-0 grid place-items-center bg-brand/15">
                            <span className="rounded-full bg-panel p-2 shadow-card"><CheckCircle className="size-7 text-brand-ink" aria-hidden="true" /></span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 border-t border-line bg-soft p-4">
                        <p className="font-doc text-base text-text">{template.name.toLowerCase()}</p>
                        <p className="text-xs text-muted">{template.description}</p>
                        {template.requiresPhoto && (
                          <span className="inline-flex items-center gap-1.5 rounded-[9px] bg-brand-soft px-2.5 py-1 text-xs text-brand-ink">
                            <ImageIcon className="size-3" aria-hidden="true" /> photo supported
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="form" className="fade-up">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {currentTemplate?.requiresPhoto && (
                <section className={PANEL} aria-label="your photo">
                  <h3 className={H3}>your photo</h3>
                  <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                    <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-full border border-dashed border-line px-5 text-sm text-muted hover:border-brand hover:text-brand-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                      <Upload className="size-4" aria-hidden="true" /> {photoPreview ? "change photo" : "upload photo"}
                      <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handlePhotoUpload} className="sr-only" />
                    </label>
                    {photoPreview && (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoPreview} alt="your photo preview" className="size-28 rounded-[14px] border border-line object-cover" />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          aria-label="remove photo"
                          className="absolute -right-2 -top-2 grid size-9 place-items-center rounded-full bg-ink text-ink-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <X className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* contact: known values collapse to chips */}
              <section className={PANEL} aria-label="contact">
                <h3 className={H3}>contact</h3>
                {!showContact && (
                  <div className="flex flex-wrap items-center gap-2">
                    {[cv.fullName, cv.email, cv.mobile].map((v) => (
                      <span key={v} className="inline-flex min-h-9 items-center rounded-[9px] bg-soft px-3 text-sm text-text">{v}</span>
                    ))}
                    <button type="button" onClick={() => setContactEditing(true)} className="min-h-10 rounded-full px-3 text-sm text-muted underline-offset-4 outline-none hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                      edit
                    </button>
                  </div>
                )}
                <div className={showContact ? "grid gap-4 md:grid-cols-3" : "hidden"}>
                  <div>
                    <FieldLabel htmlFor="rb-name">full name</FieldLabel>
                    <input id="rb-name" {...register("contactInfo.fullName")} placeholder="alex morgan" autoComplete="name" className={cn(fieldClass, "mt-1.5 h-11")} />
                    <FieldError>{errors.contactInfo?.fullName?.message}</FieldError>
                  </div>
                  <div>
                    <FieldLabel htmlFor="rb-email">email</FieldLabel>
                    <input id="rb-email" type="email" {...register("contactInfo.email")} placeholder="alex@example.com" autoComplete="email" className={cn(fieldClass, "mt-1.5 h-11")} />
                    <FieldError>{errors.contactInfo?.email?.message}</FieldError>
                  </div>
                  <div>
                    <FieldLabel htmlFor="rb-phone">phone</FieldLabel>
                    <input id="rb-phone" type="tel" {...register("contactInfo.mobile")} placeholder="+1 234 567 890" autoComplete="tel" className={cn(fieldClass, "mt-1.5 h-11")} />
                    <FieldError>{errors.contactInfo?.mobile?.message}</FieldError>
                  </div>
                </div>

                <div className="mt-5">
                  <More open={linksOpen} onToggle={() => setLinksOpen((v) => !v)} forceOpen={!!(errors.contactInfo?.linkedin || errors.contactInfo?.socialLinks)} label="more: links (optional)">
                    <div>
                      <FieldLabel htmlFor="rb-linkedin">linkedin</FieldLabel>
                      <input id="rb-linkedin" type="url" {...register("contactInfo.linkedin")} placeholder="https://linkedin.com/in/alex" className={cn(fieldClass, "mt-1.5 h-11")} />
                      <FieldError>{errors.contactInfo?.linkedin?.message}</FieldError>
                    </div>
                    <div className="space-y-3">
                      {socialFields.map((field, index) => (
                        <div key={field.id} className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                          <div className="w-full sm:w-1/3">
                            <input aria-label={`link ${index + 1} name`} {...register(`contactInfo.socialLinks.${index}.name`)} placeholder="github, portfolio" className={cn(fieldClass, "h-11")} />
                            <FieldError>{errors.contactInfo?.socialLinks?.[index]?.name?.message}</FieldError>
                          </div>
                          <div className="min-w-0 flex-1">
                            <input aria-label={`link ${index + 1} url`} {...register(`contactInfo.socialLinks.${index}.url`)} placeholder="https://" className={cn(fieldClass, "h-11")} />
                            <FieldError>{errors.contactInfo?.socialLinks?.[index]?.url?.message}</FieldError>
                          </div>
                          <button type="button" onClick={() => removeSocial(index)} aria-label={`remove link ${index + 1}`} className="grid size-11 shrink-0 place-items-center rounded-full text-faint outline-none hover:bg-gap-soft hover:text-gap-ink focus-visible:ring-2 focus-visible:ring-ring">
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="add a link">
                      {["github", "portfolio", "twitter", "other"].map((n) => (
                        <button key={n} type="button" onClick={() => appendSocial({ name: n === "other" ? "" : n, url: "" })} className="inline-flex min-h-10 items-center gap-1.5 rounded-[9px] border border-dashed border-line px-3 text-sm text-muted outline-none hover:border-brand hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-ring">
                          <PlusCircle className="size-3.5" aria-hidden="true" /> {n}
                        </button>
                      ))}
                    </div>
                  </More>
                </div>
              </section>

              <section className={PANEL} aria-label="summary">
                <h3 className={H3}>
                  <span>summary</span>
                  {count(watch("summary")?.length || 0, 500, 50)}
                </h3>
                <Controller
                  name="summary"
                  control={control}
                  render={({ field }) => <AITextarea {...field} type="summary" placeholder="two or three lines on what you do, what you're proud of, and what's next." />}
                />
                <FieldError>{errors.summary?.message}</FieldError>
              </section>

              <section className={PANEL} aria-label="skills">
                <h3 className={H3}>
                  <span>skills</span>
                  {count(watch("skills")?.length || 0, 1000, 10)}
                </h3>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => <AITextarea {...field} type="skills" placeholder="react, typescript, sql. commas or new lines." />}
                />
                <FieldError>{errors.skills?.message}</FieldError>
              </section>

              {[["experience", "Experience", "work experience"], ["education", "Education", "education"], ["projects", "Projects", "projects"]].map(([key, type, title]) => (
                <section key={key} className={PANEL} aria-label={title}>
                  <h3 className={H3}>
                    <span>{title}</span>
                    <span className="rounded-[9px] bg-soft px-2.5 py-1 font-sans text-xs text-muted">{formValues[key]?.length || 0}</span>
                  </h3>
                  <Controller name={key} control={control} render={({ field }) => <EntryForm type={type} entries={field.value} onChange={field.onChange} />} />
                </section>
              ))}
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </ToolFrame>

      {/* Hidden container for PDF generation (used when preview is closed) */}
      {!showPreview && (
        <div className="absolute top-[200vh] left-[-9999px] pointer-events-none">
          <div id="resume-print-container" className="bg-panel w-[210mm] min-h-[297mm] flex flex-col [&>div]:flex-1">
            {renderTemplate()}
          </div>
        </div>
      )}

      {/* Full Screen Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-panel/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-divider bg-panel shadow-card relative z-10">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-3">
              <Eye className="h-6 w-6 text-primary-ink" />
              resume preview
            </h2>
            <div className="flex items-center gap-3">
              <button type="button" onClick={generatePDF} className="btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <Download className="size-4" aria-hidden="true" /> download pdf
              </button>
              <button type="button" onClick={() => setShowPreview(false)} aria-label="close preview" className="grid size-11 place-items-center rounded-full border border-line bg-panel outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-divider/10">
            {/* Wrapper to handle scaling nicely without cutting off content in some browsers */}
            <div className="h-fit w-fit origin-top scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 transition-transform duration-300 shadow-2xl ring-1 ring-black/5 bg-panel">
              <div id="resume-print-container" className="bg-panel w-[210mm] min-h-[297mm] flex flex-col [&>div]:flex-1">
                {renderTemplate()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
