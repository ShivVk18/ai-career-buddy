"use client";

import AppSidebar from "@/components/shared/AppSidebar";

const NOW = Date.now();
const iso = (mins) => new Date(NOW - mins * 60000).toISOString();

const DEMO = {
  name: "asha rao",
  needsCount: 3,
  notifications: {
    unreadCount: 2,
    items: [
      { id: "1", type: "bot", title: "razorpay packet is ready", body: "resume, letter and outreach are drafted. look them over.", href: "/jobs/1", read: false, createdAt: iso(12) },
      { id: "2", type: "nudge", title: "meesho has been quiet for 5 days", body: "a short follow-up is drafted.", href: "/needs-you", read: false, createdAt: iso(190) },
      { id: "3", type: "info", title: "cred moved to interviewing", body: null, href: "/applications", read: true, createdAt: iso(3000) },
    ],
  },
};

export default function ShellDemo() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text md:h-screen md:flex-row md:overflow-hidden">
      <AppSidebar demo={DEMO} />
      <main className="min-w-0 flex-1 overflow-y-auto p-6 pb-24">
        <h1 className="font-doc text-3xl">good morning, asha</h1>
        <p className="mt-2 text-sm text-muted">shell preview with mock data.</p>
      </main>
    </div>
  );
}
