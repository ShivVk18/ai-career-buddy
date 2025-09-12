import { getCareerRoadmaps } from "@/actions/CareerRoadmap";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect } from "next/navigation";
import RoadmapDashboard from "./_components/RoadmapDashboard";

export default async function RoadmapPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const roadmaps = await getCareerRoadmaps();

  return (
    <div className="container mx-auto">
      <RoadmapDashboard roadmaps={roadmaps} />
    </div>
  );
}