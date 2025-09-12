"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
  FileText,
  User,
  Sparkles,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveResume } from "@/actions/Resume";
import { EntryForm } from "./EntryForm";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";
import dynamic from 'next/dynamic';

export default function ResumeBuilder({ initialContent }) {
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent);
  const { user } = useUser();
  const [resumeMode, setResumeMode] = useState("preview");
  const [html2pdf, setHtml2pdf] = useState(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  // Watch form fields for preview updates
  const formValues = watch();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
  };

  // Load html2pdf dynamically only on client side
  useEffect(() => {
    const loadHtml2pdf = async () => {
      if (typeof window !== 'undefined') {
        try {
          const html2pdfModule = await import('html2pdf.js');
          setHtml2pdf(() => html2pdfModule.default);
        } catch (error) {
          console.error('Failed to load html2pdf:', error);
          toast.error('PDF generation library failed to load');
        }
      }
    };
    
    loadHtml2pdf();
  }, []);

  useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

  // Update preview content when form values change
  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent ? newContent : initialContent);
    }
  }, [formValues, activeTab]);

  // Handle save result
  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!");
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  const getContactMarkdown = () => {
    const { contactInfo } = formValues;
    const parts = [];
    if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
    if (contactInfo.mobile) parts.push(`📱 ${contactInfo.mobile}`);
    if (contactInfo.linkedin)
      parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo.twitter) parts.push(`🐦 [Twitter](${contactInfo.twitter})`);

    return parts.length > 0
      ? `## <div align="center">${user?.fullName || 'Your Name'}</div>
        \n\n<div align="center">\n\n${parts.join(" | ")}\n\n</div>`
      : "";
  };

  const getCombinedContent = () => {
    const { summary, skills, experience, education, projects } = formValues;
    return [
      getContactMarkdown(),
      summary && `## Professional Summary\n\n${summary}`,
      skills && `## Skills\n\n${skills}`,
      entriesToMarkdown(experience, "Work Experience"),
      entriesToMarkdown(education, "Education"),
      entriesToMarkdown(projects, "Projects"),
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const [isGenerating, setIsGenerating] = useState(false);

  // Helper function to convert markdown to HTML
  const markdownToHtml = (markdown) => {
    if (!markdown) return '';
    
    // Split into lines for better processing
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;
    let listItems = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Handle headers
      if (line.match(/^### /)) {
        if (inList) {
          html += `<ul style="margin: 10px 0; padding-left: 20px;">${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h3 style="color: #1e40af; margin-top: 20px; margin-bottom: 10px;">${line.replace(/^### /, '')}</h3>`;
      } else if (line.match(/^## /)) {
        if (inList) {
          html += `<ul style="margin: 10px 0; padding-left: 20px;">${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h2 style="color: #1e40af; margin-top: 25px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">${line.replace(/^## /, '')}</h2>`;
      } else if (line.match(/^# /)) {
        if (inList) {
          html += `<ul style="margin: 10px 0; padding-left: 20px;">${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += `<h1 style="color: #1e40af; margin-top: 30px; margin-bottom: 20px;">${line.replace(/^# /, '')}</h1>`;
      } else if (line.match(/^- /)) {
        // Handle list items
        let listItem = line.replace(/^- /, '');
        // Process inline formatting
        listItem = listItem
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #2563eb;">$1</a>');
        
        listItems.push(`<li style="margin-bottom: 5px;">${listItem}</li>`);
        inList = true;
      } else if (line.trim() === '') {
        // Handle empty lines
        if (inList) {
          html += `<ul style="margin: 10px 0; padding-left: 20px;">${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        html += '<br>';
      } else {
        // Handle regular paragraphs
        if (inList) {
          html += `<ul style="margin: 10px 0; padding-left: 20px;">${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        
        if (line.trim() !== '') {
          // Process inline formatting
          line = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #2563eb;">$1</a>');
          
          html += `<p style="margin-bottom: 12px; line-height: 1.6;">${line}</p>`;
        }
      }
    }
    
    // Handle any remaining list items
    if (inList) {
      html += `<ul style="margin: 10px 0; padding-left: 20px;">${listItems.join('')}</ul>`;
    }
    
    return html;
  };

  const generatePDF = async () => {
  if (!html2pdf) {
    toast.error("PDF generation library is not loaded yet. Please try again.");
    return;
  }

  setIsGenerating(true);
  try {
    // Sanitize markdown → html
    let sanitizedContent = markdownToHtml(previewContent)
      .replace(/lab\([^)]+\)/g, "#000")   // Replace unsupported colors
      .replace(/color-scheme:\s*light dark;/g, ""); // Remove extra css props

    // Use existing hidden div instead of making a new one
    const tempDiv = document.getElementById("resume-pdf");
    tempDiv.innerHTML = sanitizedContent;

    const opt = {
      margin: [15, 15],
      filename: `${user?.fullName?.replace(/\s+/g, "_") || "resume"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    await html2pdf().set(opt).from(tempDiv).save();

    toast.success("PDF generated successfully!");
  } catch (error) {
    console.error("PDF generation error:", error);
    toast.error("Failed to generate PDF. Please try again.");
  } finally {
    setIsGenerating(false);
  }
};



  const onSubmit = async (data) => {
    try {
      const formattedContent = previewContent
        .replace(/\n/g, "\n") // Normalize newlines
        .replace(/\n\s*\n/g, "\n\n") // Normalize multiple newlines to double newlines
        .trim();

      console.log(previewContent, formattedContent);
      await saveResumeFn(previewContent);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  return (
    <motion.div
      data-color-mode="light"
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-3xl p-8"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <FileText className="h-8 w-8 text-blue-500" />
            </motion.div>
            
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Resume Builder
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg mt-2">
                Craft your professional story with AI-powered assistance
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSaving}
                size="lg"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 rounded-2xl shadow-xl"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Resume
                  </>
                )}
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={generatePDF}
                disabled={isGenerating || !previewContent || !html2pdf}
                size="lg"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-2xl shadow-xl"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : !html2pdf ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Loading PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Tabs Section */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-2">
              <TabsTrigger 
                value="edit" 
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                <Edit className="h-4 w-4 mr-2" />
                Form Editor
              </TabsTrigger>
              <TabsTrigger 
                value="preview"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                <Monitor className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="edit" className="space-y-0">
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Contact Information Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center text-xl font-semibold text-blue-800 dark:text-blue-200">
                    <User className="h-6 w-6 mr-3 text-blue-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                      <Input
                        {...register("contactInfo.email")}
                        type="email"
                        placeholder="your@email.com"
                        className="border-0 bg-white/80 dark:bg-gray-800/80 shadow-sm rounded-xl"
                        error={errors.contactInfo?.email}
                      />
                      {errors.contactInfo?.email && (
                        <p className="text-sm text-red-500">
                          {errors.contactInfo.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                      <Input
                        {...register("contactInfo.mobile")}
                        type="tel"
                        placeholder="+1 234 567 8900"
                        className="border-0 bg-white/80 dark:bg-gray-800/80 shadow-sm rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn Profile</label>
                      <Input
                        {...register("contactInfo.linkedin")}
                        type="url"
                        placeholder="https://linkedin.com/in/your-profile"
                        className="border-0 bg-white/80 dark:bg-gray-800/80 shadow-sm rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Twitter/X Profile</label>
                      <Input
                        {...register("contactInfo.twitter")}
                        type="url"
                        placeholder="https://twitter.com/your-handle"
                        className="border-0 bg-white/80 dark:bg-gray-800/80 shadow-sm rounded-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center text-xl font-semibold text-purple-800 dark:text-purple-200">
                    <Sparkles className="h-6 w-6 mr-3 text-purple-600" />
                    Professional Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Controller
                    name="summary"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        className="h-32 border-0 bg-white/80 dark:bg-gray-800/80 shadow-sm rounded-xl resize-none"
                        placeholder="Write a compelling professional summary that highlights your key achievements and career objectives..."
                        error={errors.summary}
                      />
                    )}
                  />
                  {errors.summary && (
                    <p className="text-sm text-red-500 mt-2">{errors.summary.message}</p>
                  )}
                </CardContent>
              </Card>

              {/* Skills Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-sm rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center text-xl font-semibold text-green-800 dark:text-green-200">
                    <ArrowRight className="h-6 w-6 mr-3 text-green-600" />
                    Skills & Technologies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Controller
                    name="skills"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        className="h-32 border-0 bg-white/80 dark:bg-gray-800/80 shadow-sm rounded-xl resize-none"
                        placeholder="List your technical skills, programming languages, frameworks, and tools..."
                        error={errors.skills}
                      />
                    )}
                  />
                  {errors.skills && (
                    <p className="text-sm text-red-500 mt-2">{errors.skills.message}</p>
                  )}
                </CardContent>
              </Card>

              {/* Experience Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50/80 to-red-50/80 dark:from-orange-900/20 dark:to-red-900/20 backdrop-blur-sm rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center text-xl font-semibold text-orange-800 dark:text-orange-200">
                    <Briefcase className="h-6 w-6 mr-3 text-orange-600" />
                    Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                  {errors.experience && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.experience.message}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Education Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50/80 to-blue-50/80 dark:from-cyan-900/20 dark:to-blue-900/20 backdrop-blur-sm rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center text-xl font-semibold text-cyan-800 dark:text-cyan-200">
                    <User className="h-6 w-6 mr-3 text-cyan-600" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                  {errors.education && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.education.message}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Projects Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50/80 to-purple-50/80 dark:from-violet-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-2xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center text-xl font-semibold text-violet-800 dark:text-violet-200">
                    <Sparkles className="h-6 w-6 mr-3 text-violet-600" />
                    Projects & Portfolio
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                  {errors.projects && (
                    <p className="text-sm text-red-500 mt-2">
                      {errors.projects.message}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.form>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {activeTab === "preview" && (
                <div className="flex justify-center mb-6">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setResumeMode(resumeMode === "preview" ? "edit" : "preview")
                    }
                    className="px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {resumeMode === "preview" ? (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Markdown
                      </>
                    ) : (
                      <>
                        <Monitor className="h-4 w-4 mr-2" />
                        Preview Mode
                      </>
                    )}
                  </Button>
                </div>
              )}

              {activeTab === "preview" && resumeMode !== "preview" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex p-4 gap-3 items-center bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-2xl mb-6 shadow-lg"
                >
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">
                    Manual markdown changes will be lost if you update form data.
                  </span>
                </motion.div>
              )}

              <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                  <MDEditor
                    value={previewContent}
                    onChange={setPreviewContent}
                    height={800}
                    preview={resumeMode}
                    data-color-mode="light"
                    className="rounded-3xl overflow-hidden"
                    style={{
                      backgroundColor: 'transparent'
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      
     <div
  id="resume-pdf"
  style={{
    position: "absolute",
    left: "-9999px",
    top: "0",
    width: "800px",
    background: "white",
    padding: "40px",
    fontFamily: "Arial, sans-serif",
    color: "#333",
    lineHeight: "1.6",
  }}
/>
    </motion.div>
  );
}