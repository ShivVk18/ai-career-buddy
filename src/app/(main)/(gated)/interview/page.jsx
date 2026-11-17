import { getAssessments } from "@/actions/Interview";
import { getUserOnboardingStatus } from "@/actions/User";
import { redirect } from "next/navigation";
import StatsCards from "./_components/StatsCard";
import PerformanceChart from "./_components/PerformanceChart";
import QuizList from "./_components/QuizList";
import { Sparkles, Brain, TrendingUp, Target, Award, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button"

export default async function InterviewPrepPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const assessments = await getAssessments();
  
  // Calculate stats
  const totalQuizzes = assessments?.length || 0;
  const hasQuizzes = totalQuizzes > 0;
  const latestScore = hasQuizzes ? assessments[0]?.quizScore : 0;
  const avgScore = hasQuizzes 
    ? assessments.reduce((sum, a) => sum + a.quizScore, 0) / totalQuizzes 
    : 0;

  return (
    <div className="min-h-screen bg-transparent py-12 px-6 md:px-12">
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 border-b border-divider pb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-[1px] bg-accent"></div>
            <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground uppercase">
              Interview Prep
            </span>
          </div>
          
          <h1 className="text-4xl md:text-7xl font-clash font-bold text-foreground uppercase tracking-tight leading-none mb-6">
            Interview <span className="text-accent">Preparation</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl font-light leading-relaxed">
            Sharpen your skills with AI-powered mock interviews. Get personalized feedback, track your progress, and walk into your next interview with confidence.
          </p>
        </div>

        {/* Quick Action Banner */}
        {!hasQuizzes ? (
          <div className="mb-12 border border-border bg-background p-8 rounded-sm shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-grow">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-sm bg-accent flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <h2 className="text-2xl font-clash font-bold text-foreground uppercase tracking-tight">
                    Start Your First Interview
                  </h2>
                </div>
                <p className="text-muted-foreground text-sm md:text-base font-light">
                  You haven&apos;t taken any mock interviews yet. Let&apos;s get started and see how you score!
                </p>
              </div>
              <Link href="/interview/mock">
                <Button size="lg" className="h-14 px-10 shadow-lg">
                  <Target className="w-5 h-5 mr-3" />
                  Start Now
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-12 border border-border bg-divider/10 p-8 rounded-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-sm border border-border flex items-center justify-center bg-background shadow-sm">
                  <Award className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-clash font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
                    Interview Status: <span className="text-accent">Active</span>
                    <TrendingUp className="w-4 h-4 text-accent" />
                  </h3>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest mt-1 font-bold">
                    Latest: <span className="text-foreground">{latestScore.toFixed(1)}%</span>
                    {" // "}
                    Average: <span className="text-foreground">{avgScore.toFixed(1)}%</span>
                  </p>
                </div>
              </div>
              <Link href="/interview/mock">
                <Button variant="outline" className="h-12 px-8">
                  <Sparkles className="w-4 h-4 mr-3 text-accent" />
                  Start New Interview
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="space-y-12">
          {/* Stats Cards */}
          <div className="border border-border p-8 rounded-sm bg-background shadow-sm">
            <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center gap-3">
              <span className="w-4 h-[1px] bg-divider"></span>
              Performance Summary
            </h3>
            <StatsCards assessments={assessments} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Performance Chart */}
            <div className="border border-border p-8 rounded-sm bg-background shadow-sm">
              <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center gap-3">
                <span className="w-4 h-[1px] bg-divider"></span>
                Progress Analytics
              </h3>
              <PerformanceChart assessments={assessments} />
            </div>

            {/* Quiz List */}
            <div className="border border-border p-8 rounded-sm bg-background shadow-sm">
              <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center gap-3">
                <span className="w-4 h-[1px] bg-divider"></span>
                Interview History
              </h3>
              <QuizList assessments={assessments} />
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        {hasQuizzes && (
          <div className="mt-16 text-center">
            <div className="inline-block border border-divider bg-divider/10 p-10 rounded-sm max-w-2xl">
              <p className="text-muted-foreground mb-8 font-light italic">
                &quot;Practice makes perfect. Every mock interview gets you one step closer to your dream role.&quot;
              </p>
              <Link href="/interview/mock">
                <Button variant="outline" className="h-12 px-10">
                  <Brain className="w-4 h-4 mr-3 text-accent" />
                  Practice More
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div> 
    </div>
  );
}