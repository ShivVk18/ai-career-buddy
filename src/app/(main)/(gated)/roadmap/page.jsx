import { getCareerRoadmaps, getGapFrequency } from "@/actions/CareerRoadmap";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect } from "next/navigation";
import RoadmapDashboard from "./_components/RoadmapDashboard";

export default async function RoadmapPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const roadmaps = await getCareerRoadmaps();
  const gapData = await getGapFrequency().catch(() => ({ error: "Failed", code: "FAILED" }));

  return <RoadmapDashboard roadmaps={roadmaps} gapData={gapData} />;
}
