import AppSidebar from "@/components/shared/AppSidebar";

export default async function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col md:flex-row antialiased">
      {/* App Sidebar + Mobile Tab Bar */}
      <AppSidebar />

      {/* Main App Content Area */}
      <main className="flex-1 min-w-0 pb-20 md:pb-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
