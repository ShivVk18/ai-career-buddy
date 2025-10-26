import { getCoverLetters } from "@/actions/CoverLetter";
import Link from "next/link";
import { Plus, Sparkles, FileText, TrendingUp, Brain, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterList from "./_components/CoverLetterList";

export default async function CoverLetterPage() {
  const coverLetters = await getCoverLetters();

  return (
   <div className="min-h-screen bg-[#0f0e0a] text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#f59e0b]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#fbbf24]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto py-12 px-4 relative z-10">
        {/* Header Section */}
        <div className="relative mb-12">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/10 border border-[#f59e0b]/20 backdrop-blur-xl mb-4">
                <Brain className="h-4 w-4 text-[#f59e0b] mr-2" />
                <span className="text-sm font-medium text-[#fbbf24]">AI-Powered Writing</span>
                <Sparkles className="h-4 w-4 text-[#f59e0b] ml-2" />
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
                My Cover Letters
              </h1>
              <p className="text-[#b0b0b0] text-lg max-w-2xl">
                AI-powered cover letters tailored for your success
              </p>
            </div>
            
            <Link href="/cover-letter/new">
              <Button className="px-8 py-4 text-base font-semibold bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white border-0 rounded-2xl shadow-lg shadow-[#f59e0b]/30 hover:shadow-2xl hover:shadow-[#f59e0b]/50 transition-all duration-300 hover:scale-105 group">
                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Create New Letter
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 p-6 rounded-2xl border border-[#f59e0b]/10 hover:border-[#f59e0b]/20 transition-all duration-300 group shadow-xl shadow-[#f59e0b]/5 hover:shadow-[#f59e0b]/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center border border-[#f59e0b]/30">
                <Sparkles className="h-6 w-6 text-[#f59e0b]" />
              </div>
              <h3 className="text-white font-semibold text-lg">AI-Powered</h3>
            </div>
            <p className="text-[#b0b0b0] text-sm leading-relaxed">Generate personalized cover letters using advanced AI technology</p>
          </div>
          
          <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 p-6 rounded-2xl border border-[#f59e0b]/10 hover:border-[#f59e0b]/20 transition-all duration-300 group shadow-xl shadow-[#f59e0b]/5 hover:shadow-[#f59e0b]/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center border border-[#f59e0b]/30">
                <FileText className="h-6 w-6 text-[#f59e0b]" />
              </div>
              <h3 className="text-white font-semibold text-lg">Professional Format</h3>
            </div>
            <p className="text-[#b0b0b0] text-sm leading-relaxed">ATS-friendly templates designed to pass applicant tracking systems</p>
          </div>
          
          <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 p-6 rounded-2xl border border-[#f59e0b]/10 hover:border-[#f59e0b]/20 transition-all duration-300 group shadow-xl shadow-[#f59e0b]/5 hover:shadow-[#f59e0b]/10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center border border-[#f59e0b]/30">
                <TrendingUp className="h-6 w-6 text-[#f59e0b]" />
              </div>
              <h3 className="text-white font-semibold text-lg">Instant Results</h3>
            </div>
            <p className="text-[#b0b0b0] text-sm leading-relaxed">Get professionally written cover letters in seconds</p>
          </div>
        </div>

        {/* Cover Letters List */}
        <CoverLetterList coverLetters={coverLetters} />
      </div>
    </div>
  );
}