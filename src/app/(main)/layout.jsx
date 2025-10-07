"use client";

import Sidebar from "@/components/SideBar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto relative z-10">{children}</main>
      </div>
    </div>
  );
}
