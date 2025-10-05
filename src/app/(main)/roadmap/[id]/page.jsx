import { getCareerRoadmap } from "@/actions/CareerRoadmap";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect, notFound } from "next/navigation";
import RoadmapDetailView from "./_components/RoadmapDetailView";

export default async function RoadmapDetailPage({ params }) {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const roadmap = await getCareerRoadmap(params.id);

  if (!roadmap) {
    notFound();
  }

  return <RoadmapDetailView roadmap={roadmap} />;
}