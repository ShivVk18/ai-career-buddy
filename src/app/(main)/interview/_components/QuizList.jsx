"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QuizResult from "./QuizResult";
import { Clock, Trophy, TrendingUp, Plus, FileText, Sparkles, BarChart3 } from "lucide-react";

export default function QuizList({ assessments, onStartNew }) {
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-[#fbbf24]';
    if (score >= 80) return 'text-[#f59e0b]';
    if (score >= 70) return 'text-[#f59e0b]';
    return 'text-[#b0b0b0]';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'from-[#1a1815]/80 to-[#252218]/60 border-[#fbbf24]/30';
    if (score >= 80) return 'from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/30';
    if (score >= 70) return 'from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/25';
    return 'from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/20';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return { label: 'Excellent', icon: Trophy };
    if (score >= 80) return { label: 'Great', icon: TrendingUp };
    if (score >= 70) return { label: 'Good', icon: BarChart3 };
    return { label: 'Keep Learning', icon: Sparkles };
  };

  return (
    <>
      <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 rounded-3xl border border-[#f59e0b]/10 p-8 shadow-2xl shadow-[#f59e0b]/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center border border-[#f59e0b]/30">
                <FileText className="w-6 h-6 text-[#f59e0b]" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
                Quiz History
              </h2>
            </div>
            <p className="text-[#b0b0b0] text-sm ml-15">
              {assessments?.length || 0} quiz{assessments?.length !== 1 ? 'zes' : ''} completed
            </p>
          </div>
          <button
            onClick={onStartNew}
            className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white py-3 px-6 rounded-2xl transition-all duration-300 font-semibold shadow-lg shadow-[#f59e0b]/30 hover:shadow-2xl hover:shadow-[#f59e0b]/50 transform hover:scale-105 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Start New Quiz
          </button>
        </div>

        {/* Empty State */}
        {!assessments || assessments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/10 flex items-center justify-center mb-6 mx-auto border border-[#f59e0b]/20">
              <FileText className="w-12 h-12 text-[#f59e0b]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Quizzes Yet</h3>
            <p className="text-[#b0b0b0] mb-6 max-w-md mx-auto">
              Start your first quiz to test your technical knowledge and track your progress over time.
            </p>
            <button
              onClick={onStartNew}
              className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white py-3 px-8 rounded-2xl transition-all duration-300 font-semibold shadow-lg shadow-[#f59e0b]/30 hover:shadow-2xl hover:shadow-[#f59e0b]/50 transform hover:scale-105 inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Take Your First Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment, i) => {
              const badge = getScoreBadge(assessment.quizScore);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={assessment.id}
                  onClick={() => setSelectedQuiz(assessment)}
                  className={`backdrop-blur-xl bg-gradient-to-br ${getScoreBgColor(assessment.quizScore)} rounded-2xl border-2 p-6 cursor-pointer hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-[#f59e0b]/5 hover:shadow-2xl hover:shadow-[#f59e0b]/10`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">
                            Quiz {assessments.length - i}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <BadgeIcon className="w-4 h-4 text-[#fbbf24]" />
                            <span className="text-sm text-[#fbbf24] font-medium">
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#b0b0b0]">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(assessment.createdAt), "MMMM dd, yyyy 'at' HH:mm")}
                        </span>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <div className={`text-5xl font-bold ${getScoreColor(assessment.quizScore)}`}>
                        {assessment.quizScore.toFixed(1)}%
                      </div>
                      <p className="text-xs text-[#b0b0b0] mt-1 uppercase tracking-wide">
                        Final Score
                      </p>
                    </div>
                  </div>

                  {assessment.improvementTip && (
                    <div className="backdrop-blur-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#fbbf24] mb-1">
                            Improvement Tip
                          </p>
                          <p className="text-sm text-[#b0b0b0] leading-relaxed">
                            {assessment.improvementTip}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-[#f59e0b]/10 flex items-center justify-between text-sm">
                    <span className="text-[#b0b0b0]">
                      Click to view detailed results
                    </span>
                    <span className="text-[#f59e0b] font-medium">
                      View Details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1815] border-[#f59e0b]/20">
          <DialogHeader>
            <DialogTitle className="sr-only">Quiz Results</DialogTitle>
          </DialogHeader>
          <QuizResult
            result={selectedQuiz}
            hideStartNew={false}
            onStartNew={() => {
              setSelectedQuiz(null);
              onStartNew();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}