"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, UserCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { onboardingSchema } from "@/app/lib/schema";
import { updateUser } from "@/actions/User";

const OnboardingForm = ({ industries }) => {
  const router = useRouter();
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  const {
    loading: updateLoading,
    fn: updateUserFn,
    data: updateResult,
  } = useFetch(updateUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (values) => {
    try {
      const formattedIndustry = `${values.industry}-${values.subIndustry
        .toLowerCase()
        .replace(/ /g, "-")}`;

      await updateUserFn({
        ...values,
        industry: formattedIndustry,
      });
    } catch (error) {
      console.error("Onboarding error:", error);
    }
  };

  useEffect(() => {
    if (updateResult?.success && !updateLoading) {
      toast.success("Profile set up! Welcome aboard 🎉");
      router.push("/dashboard");
      router.refresh();
    }
  }, [updateResult, updateLoading, router]);

  const watchIndustry = watch("industry");

  return (
    <div className="flex items-center justify-center bg-transparent py-12 px-4">
      <Card className="w-full max-w-lg bg-background border-border rounded-sm shadow-xl overflow-hidden">
        <CardHeader className="border-b border-divider pb-8 pt-10 px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[1px] bg-accent"></div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
              Profile Setup
            </span>
          </div>
          <CardTitle className="text-3xl md:text-4xl font-clash font-bold uppercase tracking-tight text-foreground leading-none">
            Tell us about <span className="text-accent">yourself</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground font-light leading-relaxed mt-4 text-sm">
            Help your AI coach understand your career path so we can provide the best guidance possible.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* Industry Selection */}
            <div className="space-y-3">
              <Label htmlFor="industry" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Your Industry
              </Label>
              <Select
                onValueChange={(value) => {
                  setValue("industry", value);
                  setSelectedIndustry(
                    industries.find((ind) => ind.id === value)
                  );
                  setValue("subIndustry", "");
                }}
              >
                <SelectTrigger id="industry" className="h-14 bg-divider/10 border-divider rounded-sm text-foreground focus:ring-accent transition-editorial">
                  <SelectValue placeholder="What's your field?" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border rounded-sm">
                  <SelectGroup>
                    <SelectLabel className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground px-4 py-2">Industries</SelectLabel>
                    {industries.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id} className="hover:bg-divider/30 cursor-pointer">
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-destructive animate-pulse">
                  {errors.industry.message}
                </p>
              )}
            </div>

            {/* Sub-Industry Selection */}
            {watchIndustry && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="subIndustry" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                  Your Specialization
                </Label>
                <Select
                  onValueChange={(value) => setValue("subIndustry", value)}
                >
                  <SelectTrigger id="subIndustry" className="h-14 bg-divider/10 border-divider rounded-sm text-foreground focus:ring-accent transition-editorial">
                    <SelectValue placeholder="What do you specialize in?" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border rounded-sm">
                    <SelectGroup>
                      <SelectLabel className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground px-4 py-2">Specializations</SelectLabel>
                      {selectedIndustry?.subIndustries.map((sub) => (
                        <SelectItem key={sub} value={sub} className="hover:bg-divider/30 cursor-pointer">
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.subIndustry && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-destructive animate-pulse">
                    {errors.subIndustry.message}
                  </p>
                )}
              </div>
            )}

            {/* Experience */}
            <div className="space-y-3">
              <Label htmlFor="experience" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Years of Experience
              </Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                placeholder="How many years have you been working?"
                {...register("experience")}
                className="h-14 bg-divider/10 border-divider rounded-sm text-foreground placeholder:text-muted-foreground/30 font-general"
              />
              {errors.experience && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-destructive animate-pulse">
                  {errors.experience.message}
                </p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-3">
              <Label htmlFor="skills" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Key Skills
              </Label>
              <Input
                id="skills"
                placeholder="e.g., Python, Marketing, Project Management"
                {...register("skills")}
                className="h-14 bg-divider/10 border-divider rounded-sm text-foreground placeholder:text-muted-foreground/30 font-general"
              />
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground/50 uppercase">
                  Separate multiple skills with commas
                </p>
                <p className="text-[9px] font-bold tracking-[0.05em] text-accent uppercase">
                  Please fill in your skills correctly, as they will be used to automatically set up your Cover Letters and Cold Emails.
                </p>
              </div>
              {errors.skills && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-destructive animate-pulse">
                  {errors.skills.message}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-3">
              <Label htmlFor="bio" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Tell us about your background
              </Label>
              <Textarea
                id="bio"
                placeholder="A brief summary of your professional journey..."
                className="h-32 bg-divider/10 border-divider rounded-sm text-foreground placeholder:text-muted-foreground/30 font-general focus:border-accent transition-editorial resize-none"
                {...register("bio")}
              />
              {errors.bio && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-destructive animate-pulse">
                  {errors.bio.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full h-16 rounded-sm text-[10px] font-bold tracking-[0.2em] uppercase transition-editorial shadow-lg" disabled={updateLoading}>
              {updateLoading ? (
                <>
                  <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  Building your profile...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingForm;
