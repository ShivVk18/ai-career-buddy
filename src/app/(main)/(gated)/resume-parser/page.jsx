import { redirect } from "next/navigation";
import { getUserOnboardingStatus } from "@/actions/User";
import ResumeParserForm from "./_components/ResumeParserForm";

export default async function ResumeParser() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="w-full">
      <ResumeParserForm />
    </div>
  );
}