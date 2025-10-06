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
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30';
    if (score >= 80) return 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30';
    if (score >= 70) return 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30';
    return 'bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/30';
  };

  return (
    <div className="space-y-6">
      <div className={`backdrop-blur-xl rounded-3xl border-2 p-8 ${getScoreBgColor(result.quizScore)} shadow-2xl`}>
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 flex items-center justify-center mb-4 mx-auto border border-emerald-500/30">
            <Trophy className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            Quiz Results
          </h1>
        </div>

        <div className="backdrop-blur-xl bg-slate-900/30 rounded-2xl p-8 border border-orange-500/20 text-center mb-6">
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.quizScore)}`}>
            {result.quizScore.toFixed(1)}%
          </div>
          <p className="text-gray-300 font-medium text-lg">Your Score</p>
          <Award className="w-10 h-10 mx-auto mt-4 text-orange-400" />
        </div>

        {result.improvementTip && (
          <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-blue-300 mb-2">Improvement Tip</p>
                <p className="text-blue-200 leading-relaxed">{result.improvementTip}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
          <Target className="w-6 h-6 text-orange-400 mr-3" />
          Question Review
        </h3>
        <div className="space-y-4">
          {result.questions.map((q, index) => (
            <div 
              key={index} 
              className={`backdrop-blur-xl rounded-2xl p-6 border-2 transition-all duration-300 ${
                q.isCorrect 
                  ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30' 
                  : 'bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <p className="font-semibold text-white text-lg flex-1">
                  {index + 1}. {q.question}
                </p>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  q.isCorrect 
                    ? 'bg-green-500/20 border-2 border-green-500/40' 
                    : 'bg-rose-500/20 border-2 border-rose-500/40'
                }`}>
                  {q.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400" />
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="backdrop-blur-xl bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <p className="text-sm text-gray-400 mb-1">Your answer:</p>
                  <p className={`font-medium ${q.isCorrect ? 'text-green-300' : 'text-rose-300'}`}>
                    {q.userAnswer}
                  </p>
                </div>
                {!q.isCorrect && (
                  <div className="backdrop-blur-xl bg-slate-800/50 rounded-xl p-4 border border-green-500/30">
                    <p className="text-sm text-gray-400 mb-1">Correct answer:</p>
                    <p className="font-medium text-green-300">{q.answer}</p>
                  </div>
                )}
              </div>

              <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-300 text-sm mb-1">Explanation:</p>
                    <p className="text-blue-200 text-sm leading-relaxed">{q.explanation}</p>
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
          className="w-full bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white py-4 px-6 rounded-2xl transition-all duration-300 font-semibold shadow-lg shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <RefreshCw className="w-5 h-5" />
          Start New Quiz
        </button>
      )}
    </div>
  );
}