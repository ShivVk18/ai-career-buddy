import DashboardView from "./_component/DashboardView";
import { getDashboardData } from "@/actions/Dashboard";

export default async function DashboardPage() {
  let data = null;
  let failed = false;
  try {
    data = await getDashboardData();
  } catch (e) {
    failed = true;
  }

  return (
    <div className="w-full min-h-screen">
      {failed && (
        <div className="p-4 sm:px-8 max-w-7xl mx-auto">
          <div className="rounded-xl border border-[#ECEAE4] bg-[#FBFAF7] px-4 py-3 text-xs text-text">
            We couldn't load your dashboard data. Refresh to try again.
          </div>
        </div>
      )}
      <DashboardView data={data} />
    </div>
  );
}
