"use client";

import { CheckCircle2, XCircle, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProgressRing from "@/components/ui/ProgressRing";

export default function QuizResult({
  result,
  hideStartNew = false,
  onStartNew,
}) {
  if (!result) return null;

  const score = result.quizScore;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <section aria-label="quiz summary" className="panel-cozy p-5 text-center sm:p-8">
        <h1 className="font-doc text-3xl text-text sm:text-4xl">quiz summary</h1>
        <div className="mt-6 flex flex-col items-center gap-2">
          <ProgressRing value={score} size={132} stroke={10} label="overall score">
            <span className="font-pixel text-3xl text-text">{Math.round(score)}%</span>
          </ProgressRing>
          {typeof result.correctCount === "number" && typeof result.total === "number" && (
            <p className="text-sm text-muted">{result.correctCount} of {result.total} correct</p>
          )}
        </div>

        {result.improvementTip && (
          <div className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-[14px] bg-brand-soft p-4 text-left sm:p-5">
            <TrendingUp className="mt-0.5 size-5 shrink-0 text-brand-ink" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-brand-ink">what to work on</p>
              <p className="mt-1 text-sm leading-relaxed text-text">{result.improvementTip}</p>
            </div>
          </div>
        )}
      </section>

      <section aria-label="question review" className="panel-cozy p-5 sm:p-8">
        <h2 className="mb-5 font-doc text-xl text-text">question by question</h2>
        <ul className="space-y-4">
          {result.questions.map((q, index) => (
            <li key={index} className={`rounded-[14px] border p-4 sm:p-5 ${q.isCorrect ? "border-brand/40" : "border-line"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">question {index + 1}</p>
                  <h3 className="mt-1 font-doc text-lg leading-snug text-text">{q.question}</h3>
                </div>
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full ${q.isCorrect ? "bg-brand-soft text-brand-ink" : "bg-gap-soft text-gap-ink"}`}
                  role="img"
                  aria-label={q.isCorrect ? "correct" : "incorrect"}
                >
                  {q.isCorrect ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <XCircle className="size-5" aria-hidden="true" />}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-[12px] bg-soft p-3.5">
                  <p className="mb-1 text-xs text-muted">your answer</p>
                  <p className={`text-sm font-medium ${q.isCorrect ? "text-brand-ink" : "text-gap-ink"}`}>{q.userAnswer ?? "not answered"}</p>
                </div>
                {!q.isCorrect && (
                  <div className="rounded-[12px] bg-brand-soft p-3.5">
                    <p className="mb-1 text-xs text-brand-ink">suggested answer</p>
                    <p className="text-sm font-medium text-text">{q.answer}</p>
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted">
                <span className="font-medium text-text">feedback </span>
                {q.explanation}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {!hideStartNew && (
        <Button variant="ink" onClick={onStartNew} className="min-h-12 w-full">
          <RefreshCw className="size-4" aria-hidden="true" /> start a new quiz
        </Button>
      )}
    </div>
  );
}
