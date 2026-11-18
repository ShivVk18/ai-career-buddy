"use client";

import { Trophy, CheckCircle2, XCircle, Sparkles, TrendingUp, Target, RefreshCw, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuizResult({
  result,
  hideStartNew = false,
  onStartNew,
}) {
  if (!result) return null;

  const score = result.quizScore;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Score Overview Card */}
      <div className="border border-border bg-panel rounded-xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-divider/10"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-divider/10 flex items-center justify-center mb-8 border border-divider/20 relative">
            <Trophy className="w-10 h-10 text-primary-ink" />
            <div className="absolute -inset-2 border border-primary/20 rounded-full animate-pulse-slow"></div>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-clash font-bold text-foreground tracking-tight mb-8">
            Interview <span className="text-primary-ink">Summary</span>
          </h1>

          <div className="w-full max-w-sm border border-border bg-divider/5 rounded-xl p-10 mb-8 shadow-inner">
            <div className="text-7xl md:text-8xl font-clash font-bold text-primary-ink mb-2 tracking-tighter">
              {score.toFixed(1)}%
            </div>
            <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">Overall Score</p>
            {typeof result.correctCount === "number" && typeof result.total === "number" && (
              <p className="text-xs text-muted-foreground mt-3">{result.correctCount} of {result.total} correct</p>
            )}
          </div>

          {result.improvementTip && (
            <div className="max-w-2xl border border-primary/30 bg-primary/5 rounded-xl p-8 text-left shadow-card">
              <div className="flex items-start gap-4">
                <TrendingUp className="w-5 h-5 text-primary-ink flex-shrink-0 mt-1" />
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-primary-ink uppercase mb-3 text-left">Career Buddy Insight</p>
                  <p className="text-muted-foreground font-general font-light leading-relaxed">{result.improvementTip}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Section */}
      <div className="border border-border bg-panel rounded-xl p-8 md:p-12 shadow-2xl">
        <h3 className="text-xs font-bold tracking-[0.3em] text-muted-foreground mb-12 flex items-center gap-4">
          <Target className="w-4 h-4 text-primary-ink" />
          Question-by-Question Review
        </h3>
        
        <div className="grid grid-cols-1 gap-8">
          {result.questions.map((q, index) => (
            <div 
              key={index} 
              className={`border rounded-xl p-8 transition-editorial shadow-card hover:shadow-md ${
                q.isCorrect 
                  ? 'border-primary/30 bg-primary/[0.02]' 
                  : 'border-divider bg-divider/[0.02]'
              }`}
            >
              <div className="flex items-start justify-between gap-6 mb-8">
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Question {index + 1}</span>
                  <h4 className="text-xl md:text-2xl font-clash font-bold text-foreground uppercase tracking-tight leading-tight">
                    {q.question}
                  </h4>
                </div>
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                  q.isCorrect 
                    ? 'border-primary/40 bg-primary/10' 
                    : 'border-destructive/40 bg-destructive/10'
                }`}>
                  {q.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-primary-ink" />
                  ) : (
                    <XCircle className="w-6 h-6 text-destructive" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border border-divider bg-divider/10 rounded-xl p-5">
                  <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-3">Your Answer:</p>
                  <p className={`text-sm font-medium ${q.isCorrect ? 'text-primary-ink' : 'text-destructive'}`}>
                    {q.userAnswer ?? "Not answered"}
                  </p>
                </div>
                {!q.isCorrect && (
                  <div className="border border-primary bg-primary/5 rounded-xl p-5 shadow-card">
                    <p className="text-[9px] font-bold tracking-widest text-primary-ink uppercase mb-3">Suggested Answer:</p>
                    <p className="text-sm font-medium text-foreground">{q.answer}</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-divider/5 border border-divider/30 rounded-xl">
                <div className="flex items-start gap-4">
                  <Sparkles className="w-4 h-4 text-primary-ink flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-[9px] font-bold tracking-widest text-primary-ink uppercase mb-2">Coach&apos;s Feedback:</p>
                    <p className="text-muted-foreground text-sm leading-relaxed font-general font-light">{q.explanation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hideStartNew && (
        <Button
          onClick={onStartNew}
          className="w-full h-16 text-xs font-bold tracking-[0.3em] uppercase shadow-card"
        >
          <RefreshCw className="w-4 h-4 mr-4" />
          Start New Practice Interview
        </Button>
      )}
    </div>
  );
}