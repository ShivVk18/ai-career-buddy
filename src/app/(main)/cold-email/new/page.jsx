"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import ColdEmailGenerator from "../_components/ColdEmailGen"

export default function NewColdEmailPage() {
  return (
    <div className="min-h-screen bg-[#0f0e0a] text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#f59e0b]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#fbbf24]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[#f59e0b]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto py-8 px-4 relative z-10">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/cold-email">
            <Button
              variant="ghost"
              className="gap-2 pl-0 text-[#b0b0b0] hover:text-[#f59e0b] hover:bg-[#f59e0b]/10 transition-all duration-300 group w-fit rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Cold Emails
            </Button>
          </Link>
        </div>

        <ColdEmailGenerator />
      </div>
    </div>
  )
}