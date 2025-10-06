"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { saveResume } from "@/actions/Resume";
import { EntryForm } from "./EntryForm";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";


export default function ResumeBuilder({ initialContent }) {
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent);
  const { user } = useUser();
  const [resumeMode, setResumeMode] = useState("preview");

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

  const formValues = watch();

  useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent ? newContent : initialContent);
    }
  }, [formValues, activeTab]);

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
      ? `## <div align="center">${user.fullName}</div>
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

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("resume-pdf");
      const opt = {
        margin: [15, 15],
        filename: "resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formattedContent = previewContent
        .replace(/\n/g, "\n")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();

      console.log(previewContent, formattedContent);
      await saveResumeFn(previewContent);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  return (
    <div data-color-mode="light" className="space-y-8">
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
          Create a professional resume with our intuitive builder
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSaving}
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
              <span>Save Resume</span>
            </>
          )}
        </button>
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          className="backdrop-blur-xl bg-slate-800/50 border border-orange-500/30 hover:border-orange-500/50 text-white py-3 px-8 rounded-2xl transition-all duration-300 font-semibold hover:bg-slate-800/70 flex items-center justify-center space-x-3 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="backdrop-blur-xl bg-slate-900/50 border border-orange-500/20 p-1 rounded-2xl">
          <TabsTrigger 
            value="edit"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-rose-600 data-[state=active]:text-white rounded-xl px-6 py-2 transition-all duration-300"
          >
            Form
          </TabsTrigger>
          <TabsTrigger 
            value="preview"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-rose-600 data-[state=active]:text-white rounded-xl px-6 py-2 transition-all duration-300"
          >
            Markdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Contact Information */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <User className="h-6 w-6 text-orange-400 mr-3" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Email</label>
                  <Input
                    {...register("contactInfo.email")}
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500"
                  />
                  {errors.contactInfo?.email && (
                    <p className="text-sm text-rose-400">{errors.contactInfo.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Mobile Number</label>
                  <Input
                    {...register("contactInfo.mobile")}
                    type="tel"
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500"
                  />
                  {errors.contactInfo?.mobile && (
                    <p className="text-sm text-rose-400">{errors.contactInfo.mobile.message}</p>
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
                    <p className="text-sm text-rose-400">{errors.contactInfo.linkedin.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Twitter/X Profile</label>
                  <Input
                    {...register("contactInfo.twitter")}
                    type="url"
                    placeholder="https://twitter.com/your-handle"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500"
                  />
                  {errors.contactInfo?.twitter && (
                    <p className="text-sm text-rose-400">{errors.contactInfo.twitter.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <FileText className="h-6 w-6 text-orange-400 mr-3" />
                Professional Summary
              </h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32 w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500 resize-none"
                    placeholder="Write a compelling professional summary..."
                  />
                )}
              />
              {errors.summary && (
                <p className="text-sm text-rose-400 mt-2">{errors.summary.message}</p>
              )}
            </div>

            {/* Skills */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <Sparkles className="h-6 w-6 text-orange-400 mr-3" />
                Skills
              </h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32 w-full px-4 py-3 bg-slate-800/50 border border-orange-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300 text-white placeholder-gray-500 resize-none"
                    placeholder="List your key skills..."
                  />
                )}
              />
              {errors.skills && (
                <p className="text-sm text-rose-400 mt-2">{errors.skills.message}</p>
              )}
            </div>

            {/* Experience */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <Briefcase className="h-6 w-6 text-orange-400 mr-3" />
                Work Experience
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
              {errors.experience && (
                <p className="text-sm text-rose-400 mt-2">{errors.experience.message}</p>
              )}
            </div>

            {/* Education */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <FileText className="h-6 w-6 text-orange-400 mr-3" />
                Education
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
              {errors.education && (
                <p className="text-sm text-rose-400 mt-2">{errors.education.message}</p>
              )}
            </div>

            {/* Projects */}
            <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
              <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
                <Sparkles className="h-6 w-6 text-orange-400 mr-3" />
                Projects
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
              {errors.projects && (
                <p className="text-sm text-rose-400 mt-2">{errors.projects.message}</p>
              )}
            </div>
          </form>
        </TabsContent>

        <TabsContent value="preview" className="mt-8">
          {activeTab === "preview" && (
            <button
              type="button"
              className="mb-4 backdrop-blur-xl bg-slate-800/50 border border-orange-500/30 hover:border-orange-500/50 text-white py-2 px-6 rounded-xl transition-all duration-300 font-medium hover:bg-slate-800/70 flex items-center space-x-2"
              onClick={() =>
                setResumeMode(resumeMode === "preview" ? "edit" : "preview")
              }
            >
              {resumeMode === "preview" ? (
                <>
                  <Edit className="h-4 w-4" />
                  <span>Edit Resume</span>
                </>
              ) : (
                <>
                  <Monitor className="h-4 w-4" />
                  <span>Show Preview</span>
                </>
              )}
            </button>
          )}

          {activeTab === "preview" && resumeMode !== "preview" && (
            <div className="flex p-4 gap-3 items-center backdrop-blur-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 text-amber-300 rounded-2xl mb-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">
                You will lose edited markdown if you update the form data.
              </span>
            </div>
          )}
          <div className="backdrop-blur-xl bg-slate-900/50 border border-orange-500/10 rounded-3xl overflow-hidden shadow-2xl">
            <MDEditor
              value={previewContent}
              onChange={setPreviewContent}
              height={800}
              preview={resumeMode}
            />
          </div>
          <div className="hidden">
            <div id="resume-pdf">
              <MDEditor.Markdown
                source={previewContent}
                style={{
                  background: "white",
                  color: "black",
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}