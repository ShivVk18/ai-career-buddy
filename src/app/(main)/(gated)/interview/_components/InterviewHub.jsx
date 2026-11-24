import Link from "next/link";
import { Target, Mic } from "lucide-react";
import ToolFrame from "@/components/shared/ToolFrame";
import { Chip } from "@/components/ui/Chip";
import StatsCards from "./StatsCard";
import PerformanceChart from "./PerformanceChart";
import QuizList from "./QuizList";
import PracticeHistory from "./PracticeHistory";
import WeakAreas from "./WeakAreas";

export default function InterviewHub({ assessments, practiceHistory, weakAreas }) {
  const totalQuizzes = assessments?.length || 0;
  const hasQuizzes = totalQuizzes > 0;
  const latestScore = hasQuizzes ? assessments[0]?.quizScore : 0;
  const avgScore = hasQuizzes ? assessments.reduce((sum, a) => sum + a.quizScore, 0) / totalQuizzes : 0;

  const PANEL = "rounded-[20px] border border-line bg-panel p-5 shadow-card sm:p-6";
  const H2 = "mb-4 font-doc text-xl text-text";
  const ink = "btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const ghost = "inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-panel px-5 text-sm text-text outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <ToolFrame
      title="interview prep"
      line="talk it out in open practice, or take a quick quiz. both feed monday's plan."
      outfit="headphones"
      bare
      className="max-w-6xl"
    >
      <div className="space-y-6">
        {/* two ways in */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className={PANEL}>
            <h2 className={H2}>open practice</h2>
            <p className="mb-4 text-sm text-muted">answer real questions built from the job and your projects. speak or type, get a rubric with quotes.</p>
            <Link href="/interview/practice" className={ink}>
              <Mic className="size-4" aria-hidden="true" /> start open practice
            </Link>
          </div>
          <div className={PANEL}>
            <h2 className={H2}>quick quiz</h2>
            {hasQuizzes ? (
              <div className="mb-4 flex flex-wrap gap-2" aria-label="your scores">
                <Chip tone="brand" editable={false} value={`latest ${latestScore.toFixed(1)}%`} />
                <Chip editable={false} value={`average ${avgScore.toFixed(1)}%`} />
                <Chip editable={false} value={`${totalQuizzes} quiz${totalQuizzes === 1 ? "" : "zes"}`} />
              </div>
            ) : (
              <p className="mb-4 text-sm text-muted">no quizzes yet. pick skills from your profile and see how you score.</p>
            )}
            <Link href="/interview/mock" className={hasQuizzes ? ghost : ink}>
              <Target className="size-4" aria-hidden="true" /> {hasQuizzes ? "new quiz" : "start a quiz"}
            </Link>
          </div>
        </div>

        <section className={PANEL} aria-label="performance summary">
          <h2 className={H2}>performance</h2>
          <StatsCards assessments={assessments} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={PANEL} aria-label="progress">
            <h2 className={H2}>progress</h2>
            <PerformanceChart assessments={assessments} />
          </section>
          <section className={PANEL} aria-label="quiz history">
            <h2 className={H2}>quiz history</h2>
            <QuizList assessments={assessments} />
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={PANEL} aria-label="open practice history">
            <h2 className={H2}>open practice history</h2>
            <PracticeHistory history={practiceHistory} />
          </section>
          <section className={PANEL} aria-label="weak areas">
            <h2 className={H2}>weak areas</h2>
            <WeakAreas weak={weakAreas} />
          </section>
        </div>
      </div>
    </ToolFrame>
  );
}
