import DashboardView from "./_component/DashboardView";

// Data loads in the client view so it can show a skeleton, and an error with Retry (never an empty state on failure).
export default function DashboardPage() {
  return (
    <div className="w-full min-h-screen">
      <DashboardView />
    </div>
  );
}
