"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

const REAL_ROUTES = {
  resume: "/resume",
  ats: "/resume-parser",
  interview: "/interview",
  "cover-letter": "/cover-letter",
  "cold-email": "/cold-email",
  roadmap: "/roadmap",
};

export default function ToolsLayout({ children }) {
  const pathname = usePathname() || "";
  const slug = pathname.split("/")[2];
  const realHref = REAL_ROUTES[slug];

  return (
    <>
      <div
        role="status"
        className="w-full bg-[#FFE48A]/40 border-b border-[#FFE48A] px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#6B5320]"
      >
        <span className="font-semibold">Preview: sample data, not yours.</span>
        {realHref && (
          <Link
            href={realHref}
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-text"
          >
            Open the real version <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      {children}
    </>
  );
}
