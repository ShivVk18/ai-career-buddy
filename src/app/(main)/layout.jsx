"use client";

import SideNavbar from "@/components/SideBar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0f0e0a] text-[#fff4ed]">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#f59e0b]/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#fbbf24]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#f59e0b]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="flex h-screen relative">
        <SideNavbar />
        {/* Added pt-20 for mobile to account for fixed mobile header, md:pt-0 removes it on desktop */}
        <main className="flex-1 overflow-auto pt-20 md:pt-0">{children}</main>
      </div>
    </div>
  );
}