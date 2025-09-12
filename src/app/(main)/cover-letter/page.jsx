
import { getCoverLetters } from "@/actions/CoverLetter";
import Link from "next/link";
import { Plus, Sparkles, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterList from "./_components/CoverLetterList";

export default async function CoverLetterPage() {
  const coverLetters = await getCoverLetters();

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-blue-400/10 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-purple-400/10 rounded-full blur-sm animate-bounce"></div>
        <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-pink-400/10 rounded-full blur-sm animate-pulse"></div>
      </div>

      <div className="container mx-auto py-8 px-4 relative z-10">
        {/* Header Section */}
        <div className="relative mb-12">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-white/10">
                  <FileText className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-300 bg-clip-text text-transparent">
                    My Cover Letters
                  </h1>
                  <p className="text-gray-400 text-lg mt-2">
                    AI-powered cover letters tailored for your success
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/cover-letter/new">
                <Button className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
                  <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Create New Letter
                  <Sparkles className="h-4 w-4 ml-2 group-hover:animate-spin" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-600/20">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold">AI-Powered</h3>
            </div>
            <p className="text-gray-400 text-sm">Generate personalized cover letters using advanced AI technology</p>
          </div>
          
          <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-600/20">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold">Professional Format</h3>
            </div>
            <p className="text-gray-400 text-sm">ATS-friendly templates designed to pass applicant tracking systems</p>
          </div>
          
          <div className="glass-dark p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 rounded-lg bg-green-600/20">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-white font-semibold">Instant Results</h3>
            </div>
            <p className="text-gray-400 text-sm">Get professionally written cover letters in seconds</p>
          </div>
        </div>

        {/* Cover Letters List */}
        <CoverLetterList coverLetters={coverLetters} />
      </div>
    </div>
  );
}