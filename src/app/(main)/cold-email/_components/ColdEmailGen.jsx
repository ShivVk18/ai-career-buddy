"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader, Sparkles, Zap, Brain, Target, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea" 
import useFetch from "@/hooks/use-fetch";
import { coldEmailSchema } from "@/app/lib/schema";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateColdEmail } from "@/actions/ColdEmail";

export default function ColdEmailGenerator() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(coldEmailSchema),
  });

  const {
    loading: generating,
    fn: generateLetterFn,
    data: generatedLetter,
  } = useFetch(generateColdEmail);

  
  useEffect(() => {
    if (generatedLetter) {
      toast.success("Cold email generated successfully!");
      router.push(`/cold-email/${generatedLetter.id}`);
      reset();
    }
  }, [generatedLetter]);

  const onSubmit = async (data) => {
    try {
      await generateLetterFn(data);
    } catch (error) {
      toast.error(error.message || "Failed to generate cold email");
    }
  };

  return (
    <div className="relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#f59e0b]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#fbbf24]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/10 border border-[#f59e0b]/20 backdrop-blur-xl mb-6">
            <Sparkles className="h-4 w-4 text-[#f59e0b] mr-2" />
            <span className="text-sm font-medium text-[#fbbf24]">AI-Powered Generation</span>
            <Brain className="h-4 w-4 text-[#f59e0b] ml-2" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
            Cold Email Generator
          </h2>
          <p className="text-[#b0b0b0] text-lg max-w-2xl mx-auto">
            Create compelling, personalized cold emails that stand out to employers
          </p>
        </div>

        {/* Main Form Card */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 rounded-3xl border border-[#f59e0b]/10 p-8 shadow-2xl shadow-[#f59e0b]/5">
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-6 flex items-center text-white">
              <Target className="h-6 w-6 text-[#f59e0b] mr-3" />
              Job Application Details
            </h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Company and Job Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="companyName" className="text-gray-300 font-medium flex items-center space-x-2">
                  <span>Company Name</span>
                  <span className="text-[#f59e0b]">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Google, Microsoft, Apple"
                  className="w-full px-4 py-3 bg-[#1a1815]/50 border border-[#f59e0b]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b]/50 transition-all duration-300 text-white placeholder-gray-500 h-12"
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="text-sm text-[#f59e0b] flex items-center space-x-1">
                    <span className="w-1 h-1 bg-[#f59e0b] rounded-full"></span>
                    <span>{errors.companyName.message}</span>
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="jobTitle" className="text-gray-300 font-medium flex items-center space-x-2">
                  <span>Job Title</span>
                  <span className="text-[#f59e0b]">*</span>
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Software Engineer, Product Manager"
                  className="w-full px-4 py-3 bg-[#1a1815]/50 border border-[#f59e0b]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b]/50 transition-all duration-300 text-white placeholder-gray-500 h-12"
                  {...register("jobTitle")}
                />
                {errors.jobTitle && (
                  <p className="text-sm text-[#f59e0b] flex items-center space-x-1">
                    <span className="w-1 h-1 bg-[#f59e0b] rounded-full"></span>
                    <span>{errors.jobTitle.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-3">
              <Label htmlFor="jobDescription" className="text-gray-300 font-medium flex items-center space-x-2">
                <span>Job Description</span>
                <span className="text-[#f59e0b]">*</span>
              </Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the complete job description here. Include requirements, responsibilities, and any specific skills mentioned..."
                className="w-full px-4 py-3 bg-[#1a1815]/50 border border-[#f59e0b]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/50 focus:border-[#f59e0b]/50 transition-all duration-300 text-white placeholder-gray-500 resize-none min-h-[150px]"
                {...register("jobDescription")}
              />
              {errors.jobDescription && (
                <p className="text-sm text-[#f59e0b] flex items-center space-x-1">
                  <span className="w-1 h-1 bg-[#f59e0b] rounded-full"></span>
                  <span>{errors.jobDescription.message}</span>
                </p>
              )}
              <p className="text-xs text-gray-500">
                💡 Tip: The more detailed the job description, the better your cold email will be tailored
              </p>
            </div>

            {/* Generate Button */}
            <Button
              type="submit"
              disabled={generating}
              className="w-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white py-4 px-8 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 text-lg font-semibold shadow-lg shadow-[#f59e0b]/30 hover:shadow-2xl hover:shadow-[#f59e0b]/50 transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 border-0"
            >
              {generating ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  <span>Crafting Your Email...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  <span>Generate Cold Email</span>
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 p-6 rounded-2xl border border-[#f59e0b]/10 hover:border-[#f59e0b]/20 transition-all duration-300 shadow-xl shadow-[#f59e0b]/5 hover:shadow-[#f59e0b]/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-[#f59e0b]/20 border border-[#f59e0b]/30">
                <Target className="h-5 w-5 text-[#f59e0b]" />
              </div>
              <h3 className="text-white font-semibold">Tailored Content</h3>
            </div>
            <p className="text-[#b0b0b0] text-sm">AI analyzes the job description to create personalized content</p>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 p-6 rounded-2xl border border-[#f59e0b]/10 hover:border-[#f59e0b]/20 transition-all duration-300 shadow-xl shadow-[#f59e0b]/5 hover:shadow-[#f59e0b]/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-[#f59e0b]/20 border border-[#f59e0b]/30">
                <Sparkles className="h-5 w-5 text-[#f59e0b]" />
              </div>
              <h3 className="text-white font-semibold">Professional Format</h3>
            </div>
            <p className="text-[#b0b0b0] text-sm">Clean, effective format that captures attention</p>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 p-6 rounded-2xl border border-[#f59e0b]/10 hover:border-[#f59e0b]/20 transition-all duration-300 shadow-xl shadow-[#f59e0b]/5 hover:shadow-[#f59e0b]/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-[#fbbf24]/20 border border-[#fbbf24]/30">
                <FileText className="h-5 w-5 text-[#fbbf24]" />
              </div>
              <h3 className="text-white font-semibold">Instant Results</h3>
            </div>
            <p className="text-[#b0b0b0] text-sm">Get your cold email in seconds, ready to customize</p>
          </div>
        </div>
      </div>
    </div>
  );
}