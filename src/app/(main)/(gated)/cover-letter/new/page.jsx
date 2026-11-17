'use client'

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterGenerator from "../_components/CoverLetterGen";

export default function NewCoverLetterPage() {
  return (
    <div className="min-h-screen bg-transparent text-foreground relative py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation */}
        <div className="mb-16 border-b border-divider pb-8">
          <Link href="/cover-letter">
            <Button 
              variant="ghost" 
              className="gap-3 pl-0 text-muted hover:text-foreground transition-editorial group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">BACK TO REPOSITORY</span>
            </Button>
          </Link>
        </div>

        <CoverLetterGenerator />
      </div>
    </div>
  );
}