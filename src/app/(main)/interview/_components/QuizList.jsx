"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QuizResult from "./QuizResult";
import { Clock, Trophy, TrendingUp, Plus, FileText, Sparkles } from "lucide-react";

export default function QuizList({ assessments }) {
  const router = useRouter();
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'from-emerald-500/10 to-green-500/10 border-emerald-500/30';
    if (score >= 80) return 'from-blue-500/10 to-cyan-500/10 border-blue-500/30';
    if (score >= 70) return 'from-amber-500/10 to-yellow-500/10 border-amber-500/30';
    return 'from-rose-500/10 to-red-500/10 border-rose-500/30';
  };

  return (
    <>
      <div className="backdrop-blur-xl bg-slate-900/50 rounded-3xl border border-orange-500/10 p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500/20 to-rose-500/20 flex items-center justify-center border border-orange-500/30">
                <FileText className="w-5 h-5 text-orange-400" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                Recent Quizzes
              </h2>
            </div>
            <p className="text-gray-400 text-sm ml-13">Review your past quiz performance</p>
          </div>
          <button
            onClick={() => router.push("/interview/mock")}
            className="bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white py-3 px-6 rounded-2xl transition-all duration-300 font-semibold shadow-lg shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Start New Quiz
          </button>
        </div>

        <div className="space-y-4">
          {assessments?.map((assessment, i) => (
            <div
              key={assessment.id}
              onClick={() => setSelectedQuiz(assessment)}
              className={`backdrop-blur-xl bg-gradient-to-br ${getScoreBgColor(assessment.quizScore)} rounded-2xl border-2 p-6 cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-2xl`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      Quiz {i + 1}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(assessment.createdAt), "MMMM dd, yyyy HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(assessment.quizScore)}`}>
                    {assessment.quizScore.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Score</p>
                </div>
              </div>

              {assessment.improvementTip && (
                <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-300 mb-1">Improvement Tip</p>
                      <p className="text-sm text-blue-200 leading-relaxed">
                        {assessment.improvementTip}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-orange-500/20">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <QuizResult
            result={selectedQuiz}
            hideStartNew
            onStartNew={() => router.push("/interview/mock")}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}