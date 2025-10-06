import Link from "next/link";
import { ArrowLeft, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Quiz from "../_components/Quiz";

export default function MockInterviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        <Link href="/interview">
          <button className="backdrop-blur-xl bg-slate-800/50 border border-orange-500/30 hover:border-orange-500/50 text-white py-2 px-4 rounded-xl transition-all duration-300 font-medium hover:bg-slate-800/70 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Interview Preparation
          </button>
        </Link>

        <div className="text-center">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/20 backdrop-blur-xl mb-6">
            <Sparkles className="h-4 w-4 text-orange-400 mr-2" />
            <span className="text-sm font-medium text-orange-300">AI-Powered Assessment</span>
            <Brain className="h-4 w-4 text-rose-400 ml-2" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
            Mock Interview
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Test your knowledge with industry-specific questions
          </p>
        </div>

        <Quiz />
      </div>
    </div>
  );
}