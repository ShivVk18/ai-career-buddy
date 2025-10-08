"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import ColdEmailGenerator from "../_components/ColdEmailGen"

export default function NewColdEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto py-8 px-4 relative z-10">
        {/* Navigation */}
        <div className="mb-8">
          <Link href="/cover-letter">
            <Button
              variant="ghost"
              className="gap-2 pl-0 text-gray-400 hover:text-orange-400 transition-colors duration-300 group w-fit"
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
