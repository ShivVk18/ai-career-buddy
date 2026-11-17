import { getCoverLetters } from "@/actions/CoverLetter";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Sparkles, FileText, TrendingUp, Brain, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterList from "./_components/CoverLetterList";

export default async function CoverLetterPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const coverLetters = await getCoverLetters();

  return (
    <div className="min-h-screen bg-transparent py-12 px-6 md:px-12">
      <div className="container mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-16 border-b border-divider pb-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-[1px] bg-accent"></div>
                <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
                  Application Library
                </span>
              </div>
              
              <h1 className="text-4xl md:text-7xl font-clash font-bold text-foreground uppercase tracking-tight leading-none mb-6">
                Cover <span className="text-accent">Letters</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl font-light leading-relaxed">
                Land your dream job with a tailored cover letter. Our AI highlights your best skills to make sure you stand out to recruiters.
              </p>
            </div>
            
            <Link href="/cover-letter/new">
              <Button size="lg" className="h-14 px-10 group shadow-lg">
                <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-editorial" />
                New Cover Letter
                <Sparkles className="h-4 w-4 ml-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="border border-border bg-background p-8 rounded-sm hover:border-accent transition-editorial shadow-sm group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-sm border border-divider flex items-center justify-center bg-divider/10 group-hover:border-accent transition-editorial shadow-sm">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-foreground font-clash font-bold uppercase tracking-tight text-lg">AI-Optimized</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-general font-light">
              Craft professional narratives that perfectly match the job requirements. Engineered for impact and clarity.
            </p>
          </div>
          
          <div className="border border-border bg-background p-8 rounded-sm hover:border-accent transition-editorial shadow-sm group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-sm border border-divider flex items-center justify-center bg-divider/10 group-hover:border-accent transition-editorial shadow-sm">
                <FileCheck className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-foreground font-clash font-bold uppercase tracking-tight text-lg">ATS Friendly</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-general font-light">
              Structure your letter to pass through Applicant Tracking Systems. Compliant with modern hiring standards.
            </p>
          </div>
          
          <div className="border border-border bg-background p-8 rounded-sm hover:border-accent transition-editorial shadow-sm group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-sm border border-divider flex items-center justify-center bg-divider/10 group-hover:border-accent transition-editorial shadow-sm">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-foreground font-clash font-bold uppercase tracking-tight text-lg">Better Results</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-general font-light">
              Increase your chances of getting an interview by sending a highly tailored letter every time you apply.
            </p>
          </div>
        </div>

        {/* Cover Letters List */}
        <div className="border border-border p-8 rounded-sm bg-background shadow-lg">
          <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center gap-3">
            <span className="w-4 h-[1px] bg-divider"></span>
            Saved Letters
          </h3>
          <CoverLetterList coverLetters={coverLetters} />
        </div>
      </div>
    </div>
  );
}