import { getResume } from "@/actions/Resume";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect } from "next/navigation";
import ResumeBuilder from "./_components/ResumeBuilder";
import EmptyState from "@/components/shared/EmptyState";

export default async function ResumePage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const resume = await getResume();

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="relative z-10 container mx-auto py-8 px-4 sm:px-6 space-y-6">
        {!resume && (
          <EmptyState
            step="coffee"
            text="no resume yet. drop a PDF and i'll fill this in, or start typing below."
            actionLabel="import from a PDF"
            href="/onboarding?edit=1"
          />
        )}
        <ResumeBuilder 
          initialContent={resume?.content} 
          initialResume={resume} 
        />
      </div>
    </div>
  );
}
