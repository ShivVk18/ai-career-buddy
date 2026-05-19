import SideNavbar from "@/components/SideBar";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function MainLayout({ children }) {
  const { isOnboarded } = await getUserOnboardingStatus();
  
  // Get the current path to avoid infinite redirect
  const headerList = await headers();
  const fullPath = headerList.get("x-invoke-path") || "";
  
  // If not onboarded and not already on the onboarding page, redirect
  // Note: x-invoke-path might not be reliable in all environments, 
  // but for local dev and most Vercel deploys it works.
  // A safer way is to check the children or move the file.
  
  // Since we want to be robust, let's just add the check to the pages 
  // that definitely need it, or move onboarding out of (main).

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Global Noise Overlay */}
      <div className="noise-overlay" />
      
      {/* Subtle Structural Grid for Inner App */}
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-5" />

      <div className="flex h-screen relative z-10">
        <SideNavbar />
        {/* Main content container with consistent spacing */}
        <main className="flex-1 overflow-auto pt-20 md:pt-0 bg-background/50 backdrop-blur-[2px]">
          <div className="max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}