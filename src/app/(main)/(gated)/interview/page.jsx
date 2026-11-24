import { getAssessments } from "@/actions/Interview";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect } from "next/navigation";
import { getPracticeHistory, getWeakAreas } from "@/actions/Practice";
import InterviewHub from "./_components/InterviewHub";

export default async function InterviewPrepPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const assessments = await getAssessments();
  const [practiceHistory, weakAreas] = await Promise.all([
    getPracticeHistory().catch(() => ({ error: "Failed", code: "FAILED" })),
    getWeakAreas().catch(() => ({ error: "Failed", code: "FAILED" })),
  ]);

  return <InterviewHub assessments={assessments} practiceHistory={practiceHistory} weakAreas={weakAreas} />;
}
