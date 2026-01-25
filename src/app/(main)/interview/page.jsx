import { getAssessments } from "@/actions/Interview";
import StatsCards from "./_components/StatsCard";
import PerformanceChart from "./_components/PerformanceChart";
import QuizList from "./_components/QuizList";
import { Sparkles, Brain, TrendingUp, Target, Award, Zap } from "lucide-react";
import Link from "next/link";

export default async function InterviewPrepPage() {
  const assessments = await getAssessments();
  
  // Calculate stats
  const totalQuizzes = assessments?.length || 0;
  const hasQuizzes = totalQuizzes > 0;
  const latestScore = hasQuizzes ? assessments[0]?.quizScore : 0;
  const avgScore = hasQuizzes 
    ? assessments.reduce((sum, a) => sum + a.quizScore, 0) / totalQuizzes 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0908] via-[#0f0e0a] to-[#1a1815] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#f59e0b]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#fbbf24]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f59e0b]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/10 border border-[#f59e0b]/20 backdrop-blur-xl mb-6 shadow-lg shadow-[#f59e0b]/10">
            <Sparkles className="h-4 w-4 text-[#f59e0b] mr-2 animate-pulse" />
            <span className="text-sm font-medium text-[#fbbf24]">AI-Powered Skill Assessment</span>
            <Brain className="h-4 w-4 text-[#f59e0b] ml-2" />
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700">
            Interview Preparation Hub
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[#b0b0b0] max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
            Master your technical interviews with personalized quizzes, real-time feedback, and detailed performance analytics
          </p>
        </div>

        {/* Quick Action Banner */}
        {!hasQuizzes ? (
          <div className="mb-8 backdrop-blur-xl bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/10 rounded-3xl border border-[#f59e0b]/20 p-8 shadow-2xl shadow-[#f59e0b]/10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    Ready to Start?
                  </h2>
                </div>
                <p className="text-[#b0b0b0] text-sm md:text-base">
                  Take your first AI-generated quiz and begin tracking your interview preparation journey
                </p>
              </div>
              <Link
                href="/interview/mock"
                className="group bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white py-4 px-8 rounded-2xl transition-all duration-300 font-semibold shadow-lg shadow-[#f59e0b]/30 hover:shadow-2xl hover:shadow-[#f59e0b]/50 transform hover:scale-105 flex items-center gap-3 whitespace-nowrap"
              >
                <Target className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Start First Quiz
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-8 backdrop-blur-xl bg-gradient-to-r from-[#1a1815]/80 to-[#252218]/60 rounded-3xl border border-[#f59e0b]/20 p-6 shadow-xl shadow-[#f59e0b]/5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center border border-[#f59e0b]/30">
                  <Award className="w-8 h-8 text-[#f59e0b]" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    Keep Going!
                    <TrendingUp className="w-5 h-5 text-[#fbbf24]" />
                  </h3>
                  <p className="text-[#b0b0b0] text-sm">
                    Latest: <span className="text-[#fbbf24] font-semibold">{latestScore.toFixed(1)}%</span>
                    {" • "}
                    Average: <span className="text-[#f59e0b] font-semibold">{avgScore.toFixed(1)}%</span>
                  </p>
                </div>
              </div>
              <Link
                href="/interview/mock"
                className="group bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white py-3 px-6 rounded-2xl transition-all duration-300 font-semibold shadow-lg shadow-[#f59e0b]/30 hover:shadow-2xl hover:shadow-[#f59e0b]/50 transform hover:scale-105 flex items-center gap-2 whitespace-nowrap"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Take Another Quiz
              </Link>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500">
          {/* Stats Cards */}
          <div className="animate-in fade-in slide-in-from-left duration-700 delay-600">
            <StatsCards assessments={assessments} />
          </div>

          {/* Performance Chart */}
          <div className="animate-in fade-in slide-in-from-right duration-700 delay-700">
            <PerformanceChart assessments={assessments} />
          </div>

          {/* Quiz List */}
          <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-800">
            <QuizList assessments={assessments} />
          </div>
        </div>

        {/* Footer CTA */}
        {hasQuizzes && (
          <div className="mt-12 text-center animate-in fade-in duration-700 delay-1000">
            <div className="inline-block backdrop-blur-xl bg-gradient-to-r from-[#1a1815]/60 to-[#252218]/40 rounded-2xl border border-[#f59e0b]/10 p-6 shadow-lg">
              <p className="text-[#b0b0b0] mb-4">
                Want to challenge yourself with more questions?
              </p>
              <Link
                href="/interview/mock"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 hover:from-[#f59e0b]/30 hover:to-[#fbbf24]/30 text-[#fbbf24] border border-[#f59e0b]/30 py-2 px-6 rounded-xl transition-all duration-300 font-medium"
              >
                <Brain className="w-4 h-4" />
                Practice More
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}