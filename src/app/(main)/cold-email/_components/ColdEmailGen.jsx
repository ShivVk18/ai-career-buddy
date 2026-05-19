"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Sparkles, Zap, Brain, Target, FileText, Send } from "lucide-react";
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
      toast.success("Cold email generated successfully! ✨");
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
      <div className="space-y-16 relative z-10">
        {/* Header */}
        <div className="text-center space-y-6 mb-20 border-b border-divider pb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-8 h-[1px] bg-accent"></div>
            <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
              AI Outreach Assistant
            </span>
            <div className="w-8 h-[1px] bg-accent"></div>
          </div>

          <h2 className="text-4xl md:text-7xl font-clash font-bold text-foreground uppercase tracking-tight leading-none">
            Cold Email <span className="text-accent">Generator</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 font-light leading-relaxed">
            Write high-converting cold emails that actually get replies. Our AI analyzes the job and your profile to craft the perfect outreach.
          </p>
        </div>

        {/* Form Container */}
        <div className="border border-border bg-background rounded-sm p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-divider/10"></div>
          
          <div className="mb-12">
            <h3 className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase mb-8 flex items-center gap-3">
              <Target className="h-4 w-4 text-accent" />
              Campaign Details
            </h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* Entity and Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="companyName" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Google, Stripe"
                  {...register("companyName")}
                  className="h-14"
                />
                {errors.companyName && (
                  <p className="text-[10px] text-destructive font-bold uppercase tracking-widest mt-2">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="jobTitle" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                  Target Role
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Software Engineer"
                  {...register("jobTitle")}
                  className="h-14"
                />
                {errors.jobTitle && (
                  <p className="text-[10px] text-destructive font-bold uppercase tracking-widest mt-2">{errors.jobTitle.message}</p>
                )}
              </div>
            </div>

            {/* Content Logic */}
            <div className="space-y-3">
              <Label htmlFor="jobDescription" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Job Description
              </Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste the job description or specific requirements here. The more detail you provide, the better the email will be..."
                className="h-48 bg-divider/5 border-border focus:border-accent"
                {...register("jobDescription")}
              />
              {errors.jobDescription && (
                <p className="text-[10px] text-destructive font-bold uppercase tracking-widest mt-2">{errors.jobDescription.message}</p>
              )}
            </div>

            {/* Execution Trigger */}
            <Button
              type="submit"
              disabled={generating}
              className="w-full h-16 text-xs font-bold tracking-[0.3em] uppercase shadow-lg"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-4" />
                  Generating Email...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-4" />
                  Generate Email
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 pb-20">
          <div className="border border-divider bg-divider/10 p-8 rounded-sm transition-editorial hover:border-accent group shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-sm bg-divider/20 border border-divider/30 group-hover:border-accent transition-editorial">
                <Target className="h-4 w-4 text-accent" />
              </div>
              <h3 className="text-[10px] font-bold tracking-widest text-foreground uppercase">Highly Personalized</h3>
            </div>
            <p className="text-muted-foreground text-sm font-general font-light leading-relaxed">Our AI analyzes both the job and your unique background to craft a message that resonates.</p>
          </div>

          <div className="border border-divider bg-divider/10 p-8 rounded-sm transition-editorial hover:border-accent group shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-sm bg-divider/20 border border-divider/30 group-hover:border-accent transition-editorial">
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <h3 className="text-[10px] font-bold tracking-widest text-foreground uppercase">Proven Formats</h3>
            </div>
            <p className="text-muted-foreground text-sm font-general font-light leading-relaxed">Generated emails follow industry-best practices for brevity, clarity, and calls to action.</p>
          </div>

          <div className="border border-divider bg-divider/10 p-8 rounded-sm transition-editorial hover:border-accent group shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-sm bg-divider/20 border border-divider/30 group-hover:border-accent transition-editorial">
                <Zap className="h-4 w-4 text-accent" />
              </div>
              <h3 className="text-[10px] font-bold tracking-widest text-foreground uppercase">Save Hours</h3>
            </div>
            <p className="text-muted-foreground text-sm font-general font-light leading-relaxed">Go from blank page to polished outreach in seconds. Spend your time on interviews instead.</p>
          </div>
        </div>
      </div>
    </div>
  );
}