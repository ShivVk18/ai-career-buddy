import { getResume } from "@/actions/Resume";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect } from "next/navigation";
import ResumeBuilder from "./_components/ResumeBuilder";

export default async function ResumePage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const resume = await getResume();

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="relative z-10 container mx-auto py-12 px-6">
        <ResumeBuilder 
          initialContent={resume?.content} 
          initialResume={resume} 
        />
      </div>
    </div>
  );
}