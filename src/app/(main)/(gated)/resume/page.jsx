import { getResume } from "@/actions/Resume";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect } from "next/navigation";
import ResumeBuilder from "./_components/ResumeBuilder";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export default async function ResumePage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const resume = await getResume();

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="relative z-10 container mx-auto py-8 px-4 sm:px-6 space-y-6">
        {/* Cozy Pip Switcher Banner */}
        <div className="panel-cozy p-4 bg-white border border-[#ECEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-0.5 rounded-full font-medium">
              preview: pip paper doc view
            </span>
            <span className="text-xs text-muted">
              sample-data preview of tracked bullet edits.
            </span>
          </div>
          <Link
            href="/tools/resume"
            className="btn-pill-primary text-xs py-1.5 px-4 flex items-center gap-1.5 w-fit shadow-xs"
          >
            <span>open cozy paper doc (preview)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ResumeBuilder 
          initialContent={resume?.content} 
          initialResume={resume} 
        />
      </div>
    </div>
  );
}
