import { redirect } from "next/navigation";
import { getUserOnboardingStatus } from "@/actions/User";
import DashboardView from "./_component/DashboardView";

export default async function DashboardPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  return (
    <div className="w-full h-screen">
      <DashboardView />
    </div>
  );
}
