import Link from "next/link"
import { Plus, Sparkles, FileText, TrendingUp, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"

import ColdEmailList from "./_components/ColdEmailList"
import { getColdEmails } from "@/actions/ColdEmail"

export default async function ColdEmailPage() {
  const coldEmails = await getColdEmails()

  console.log(coldEmails)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20 text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto py-12 px-4 relative z-10">
        {/* Header Section */}
        <div className="relative mb-12">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/20 backdrop-blur-xl mb-4">
                <Brain className="h-4 w-4 text-orange-400 mr-2" />
                <span className="text-sm font-medium text-orange-300">AI-Powered Writing</span>
                <Sparkles className="h-4 w-4 text-rose-400 ml-2" />
              </div>

              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                My Cold Emails
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl">AI-powered cold emails tailored for your success</p>
            </div>

            <Link href="/cold-email/new">
              <Button className="px-8 py-4 text-base font-semibold bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white border-0 rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 group">
                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create New Email
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="backdrop-blur-xl bg-slate-900/50 p-6 rounded-2xl border border-orange-500/10 hover:border-orange-500/20 transition-all duration-300 group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500/20 to-rose-500/20 flex items-center justify-center border border-orange-500/30">
                <Sparkles className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-white font-semibold text-lg">AI-Powered</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Generate personalized cold emails using advanced AI technology
            </p>
          </div>

          <div className="backdrop-blur-xl bg-slate-900/50 p-6 rounded-2xl border border-rose-500/10 hover:border-rose-500/20 transition-all duration-300 group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-500/20 to-pink-500/20 flex items-center justify-center border border-rose-500/30">
                <FileText className="h-6 w-6 text-rose-400" />
              </div>
              <h3 className="text-white font-semibold text-lg">Professional Format</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              ATS-friendly templates designed to pass applicant tracking systems
            </p>
          </div>

          <div className="backdrop-blur-xl bg-slate-900/50 p-6 rounded-2xl border border-amber-500/10 hover:border-amber-500/20 transition-all duration-300 group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/30">
                <TrendingUp className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-white font-semibold text-lg">Instant Results</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">Get professionally written cold emails in seconds</p>
          </div>
        </div>

        {/* Cold Emails List */}
        <ColdEmailList coldEmails={coldEmails} />
      </div>
    </div>
  )
}
