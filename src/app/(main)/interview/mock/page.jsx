import Link from "next/link";
import { ArrowLeft, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Quiz from "../_components/Quiz";

export default function MockInterviewPage() {
  return (
    <div className="min-h-screen bg-[#0f0e0a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#f59e0b]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#fbbf24]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        <Link href="/interview">
          <button className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 border border-[#f59e0b]/30 hover:border-[#f59e0b]/50 text-white py-2 px-4 rounded-xl transition-all duration-300 font-medium hover:bg-[#1a1815]/90 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Interview Preparation
          </button>
        </Link>

        <div className="text-center">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/10 border border-[#f59e0b]/20 backdrop-blur-xl mb-6">
            <Sparkles className="h-4 w-4 text-[#f59e0b] mr-2" />
            <span className="text-sm font-medium text-[#fbbf24]">AI-Powered Assessment</span>
            <Brain className="h-4 w-4 text-[#f59e0b] ml-2" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
            Mock Interview
          </h1>
          <p className="text-lg md:text-xl text-[#b0b0b0] max-w-2xl mx-auto">
            Test your knowledge with industry-specific questions
          </p>
        </div>

        <Quiz />
      </div>
    </div>
  );
}