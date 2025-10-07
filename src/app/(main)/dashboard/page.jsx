import { getIndustryInsights } from "@/actions/Dashboard";
import DashboardView from "./_component/DashboardView";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  return (
    <div className="w-full h-screen">
      <DashboardView  />
    </div>
  );
}
