"use client";

import React from "react";
import ChatSlideOver from "@/components/chat/ChatSlideOver";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PixelScene from "@/components/pixel/PixelScene";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-[#FBFAF7] flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-[#ECEAE4] bg-white px-4 sm:px-6 flex items-center justify-between shrink-0">
        <Link
          href="/dashboard"
          className="text-xs font-medium text-muted hover:text-text flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          back to home
        </Link>
        <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-1 rounded-full">
          pip is ready
        </span>
      </header>

      {/* Main chat container with subtle background scene on larger screens */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-6 flex flex-col">
        <div className="relative flex-1 rounded-[18px] overflow-hidden border border-[#ECEAE4] shadow-sm bg-white">
          <ChatSlideOver isOpen={true} onClose={() => {}} embedded={true} />
        </div>
      </main>
    </div>
  );
}
