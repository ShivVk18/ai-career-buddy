import DashboardView from "./_component/DashboardView";
import { getUserOnboardingStatus } from "@/actions/User";

export default async function DashboardPage() {
  let isOnboarded = true;
  try {
    const status = await getUserOnboardingStatus();
    isOnboarded = status?.isOnboarded ?? true;
  } catch (e) {
    // Graceful fallback for mock viewing in preview
    isOnboarded = true;
  }

  return (
    <div className="w-full min-h-screen">
      <DashboardView />
    </div>
  );
}
