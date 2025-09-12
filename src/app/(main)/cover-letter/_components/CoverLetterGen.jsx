"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, FileText, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateCoverLetter } from "@/actions/CoverLetter";
import useFetch from "@/hooks/use-fetch";
import { coverLetterSchema } from "@/app/lib/schema";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CoverLetterGenerator() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(coverLetterSchema),
  });

  const {
    loading: generating,
    fn: generateLetterFn,
    data: generatedLetter,
  } = useFetch(generateCoverLetter);

  // Update content when letter is generated
  useEffect(() => {
    if (generatedLetter) {
      toast.success("Cover letter generated successfully!");
      router.push(`/cover-letter/${generatedLetter.id}`);
      reset();
    }
  }, [generatedLetter]);

  const onSubmit = async (data) => {
    try {
      await generateLetterFn(data);
    } catch (error) {
      toast.error(error.message || "Failed to generate cover letter");
    }
  };

  return (
    <div className="relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-blue-400/10 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-purple-400/10 rounded-full blur-sm animate-bounce"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-pink-400/10 rounded-full blur-sm animate-pulse"></div>
      </div>

      <div className="space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10">
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            AI-Powered Cover Letter Generator
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Create compelling, personalized cover letters that stand out to employers
          </p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full glass-dark border border-blue-500/30">
            <Target className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">Step 1: Job Details</span>
          </div>
          <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50"></div>
          <div className="flex items-center space-x-2 px-4 py-2 rounded-full glass-dark border border-white/10">
            <Sparkles className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500 font-medium">Step 2: AI Generation</span>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="glass-dark border-white/10 hover:border-white/20 transition-all duration-500 backdrop-blur-xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                <Target className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Job Application Details</CardTitle>
                <CardDescription className="text-gray-400">
                  Provide information about the position you're applying for
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Company and Job Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="companyName" className="text-white font-medium flex items-center space-x-2">
                    <span>Company Name</span>
                    <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="companyName"
                      placeholder="e.g., Google, Microsoft, Apple"
                      className="glass-dark border-white/20 bg-black/20 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300 h-12"
                      {...register("companyName")}
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-600/5 to-purple-600/5 pointer-events-none"></div>
                  </div>
                  {errors.companyName && (
                    <p className="text-sm text-red-400 flex items-center space-x-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                      <span>{errors.companyName.message}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="jobTitle" className="text-white font-medium flex items-center space-x-2">
                    <span>Job Title</span>
                    <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="jobTitle"
                      placeholder="e.g., Software Engineer, Product Manager"
                      className="glass-dark border-white/20 bg-black/20 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300 h-12"
                      {...register("jobTitle")}
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-600/5 to-purple-600/5 pointer-events-none"></div>
                  </div>
                  {errors.jobTitle && (
                    <p className="text-sm text-red-400 flex items-center space-x-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                      <span>{errors.jobTitle.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div className="space-y-3">
                <Label htmlFor="jobDescription" className="text-white font-medium flex items-center space-x-2">
                  <span>Job Description</span>
                  <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Textarea
                    id="jobDescription"
                    placeholder="Paste the complete job description here. Include requirements, responsibilities, and any specific skills mentioned..."
                    className="glass-dark border-white/20 bg-black/20 text-white placeholder:text-gray-500 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300 min-h-[150px] resize-none"
                    {...register("jobDescription")}
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-600/5 to-purple-600/5 pointer-events-none"></div>
                </div>
                {errors.jobDescription && (
                  <p className="text-sm text-red-400 flex items-center space-x-1">
                    <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                    <span>{errors.jobDescription.message}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  💡 Tip: The more detailed the job description, the better your cover letter will be tailored
                </p>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={generating}
                  className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 group"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      <span>Crafting Your Letter</span>
                      <div className="ml-2 flex space-x-1">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                      Generate Cover Letter
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-600/20">
                <Target className="h-4 w-4 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold">Tailored Content</h3>
            </div>
            <p className="text-gray-400 text-sm">AI analyzes the job description to create personalized content</p>
          </div>
          
          <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-600/20">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold">Professional Format</h3>
            </div>
            <p className="text-gray-400 text-sm">Clean, ATS-friendly format that recruiters love</p>
          </div>
          
          <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-green-600/20">
                <FileText className="h-4 w-4 text-green-400" />
              </div>
              <h3 className="text-white font-semibold">Instant Results</h3>
            </div>
            <p className="text-gray-400 text-sm">Get your cover letter in seconds, ready to customize</p>
          </div>
        </div>
      </div>
    </div>
  );
}