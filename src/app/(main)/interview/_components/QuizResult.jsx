"use client";

import { Trophy, CheckCircle2, XCircle, Sparkles, TrendingUp, Target, RefreshCw, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";

export default function QuizResult({
  result,
  hideStartNew = false,
  onStartNew,
}) {
  if (!result) return null;

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-[#fbbf24]';
    if (score >= 80) return 'text-[#f59e0b]';
    if (score >= 70) return 'text-[#f59e0b]';
    return 'text-[#b0b0b0]';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 border-[#fbbf24]/30';
    if (score >= 80) return 'bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/30';
    if (score >= 70) return 'bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/25';
    return 'bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/20';
  };

  return (
    <div className="space-y-6">
      <div className={`backdrop-blur-xl rounded-3xl border-2 p-8 ${getScoreBgColor(result.quizScore)} shadow-2xl shadow-[#f59e0b]/5`}>
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center mb-4 mx-auto border border-[#f59e0b]/30">
            <Trophy className="w-10 h-10 text-[#f59e0b]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            Quiz Results
          </h1>
        </div>

        <div className="backdrop-blur-xl bg-[#1a1815]/30 rounded-2xl p-8 border border-[#f59e0b]/20 text-center mb-6">
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.quizScore)}`}>
            {result.quizScore.toFixed(1)}%
          </div>
          <p className="text-[#b0b0b0] font-medium text-lg">Your Score</p>
          <Award className="w-10 h-10 mx-auto mt-4 text-[#f59e0b]" />
        </div>

        {result.improvementTip && (
          <div className="backdrop-blur-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-[#f59e0b] flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-[#fbbf24] mb-2">Improvement Tip</p>
                <p className="text-[#b0b0b0] leading-relaxed">{result.improvementTip}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 rounded-3xl border border-[#f59e0b]/10 p-8 shadow-2xl shadow-[#f59e0b]/5">
        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
          <Target className="w-6 h-6 text-[#f59e0b] mr-3" />
          Question Review
        </h3>
        <div className="space-y-4">
          {result.questions.map((q, index) => (
            <div 
              key={index} 
              className={`backdrop-blur-xl rounded-2xl p-6 border-2 transition-all duration-300 ${
                q.isCorrect 
                  ? 'bg-gradient-to-br from-[#f59e0b]/10 to-[#fbbf24]/10 border-[#fbbf24]/30' 
                  : 'bg-gradient-to-br from-[#1a1815]/50 to-[#252218]/50 border-[#f59e0b]/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <p className="font-semibold text-white text-lg flex-1">
                  {index + 1}. {q.question}
                </p>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  q.isCorrect 
                    ? 'bg-[#fbbf24]/20 border-2 border-[#fbbf24]/40' 
                    : 'bg-[#f59e0b]/20 border-2 border-[#f59e0b]/40'
                }`}>
                  {q.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-[#fbbf24]" />
                  ) : (
                    <XCircle className="w-6 h-6 text-[#f59e0b]" />
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="backdrop-blur-xl bg-[#1a1815]/50 rounded-xl p-4 border border-[#6b7280]">
                  <p className="text-sm text-[#b0b0b0] mb-1">Your answer:</p>
                  <p className={`font-medium ${q.isCorrect ? 'text-[#fbbf24]' : 'text-[#f59e0b]'}`}>
                    {q.userAnswer}
                  </p>
                </div>
                {!q.isCorrect && (
                  <div className="backdrop-blur-xl bg-[#1a1815]/50 rounded-xl p-4 border border-[#fbbf24]/30">
                    <p className="text-sm text-[#b0b0b0] mb-1">Correct answer:</p>
                    <p className="font-medium text-[#fbbf24]">{q.answer}</p>
                  </div>
                )}
              </div>

              <div className="backdrop-blur-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#fbbf24] text-sm mb-1">Explanation:</p>
                    <p className="text-[#b0b0b0] text-sm leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hideStartNew && (
        <button
          onClick={onStartNew}
          className="w-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white py-4 px-6 rounded-2xl transition-all duration-300 font-semibold shadow-lg shadow-[#f59e0b]/30 hover:shadow-2xl hover:shadow-[#f59e0b]/50 transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <RefreshCw className="w-5 h-5" />
          Start New Quiz
        </button>
      )}
    </div>
  );
}