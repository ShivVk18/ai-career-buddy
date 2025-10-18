"use client";

import Sidebar from "@/components/SideBar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0c05] via-[#2a1608] to-[#1a0c05] text-[#fff4ed]">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#ff5e00]/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ff8c42]/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#ffa36c]/6 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto relative z-10">{children}</main>
      </div>
    </div>
  );
}