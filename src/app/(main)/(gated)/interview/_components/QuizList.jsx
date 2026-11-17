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

  const getScoreBadge = (score) => {
    if (score >= 90) return { label: 'Excellent', icon: Trophy };
    if (score >= 80) return { label: 'Great', icon: TrendingUp };
    if (score >= 70) return { label: 'Good', icon: BarChart3 };
    return { label: 'Keep Learning', icon: Sparkles };
  };

  return (
    <>
      <div className="border border-border bg-background rounded-sm p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-sm bg-divider/20 flex items-center justify-center border border-divider/30">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <h2 className="text-3xl font-clash font-bold text-foreground uppercase tracking-tight">
                Quiz History
              </h2>
            </div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest ml-14">
              {assessments?.length || 0} quiz{assessments?.length !== 1 ? 'zes' : ''} completed
            </p>
          </div>
          <Button
            onClick={onStartNew}
            className="h-12 px-8 text-[10px] font-bold tracking-widest uppercase shadow-lg"
          >
            <Plus className="w-4 h-4 mr-3" />
            Start New Quiz
          </Button>
        </div>

        {/* Empty State */}
        {!assessments || assessments.length === 0 ? (
          <div className="text-center py-16 border border-divider bg-divider/5 rounded-sm">
            <div className="w-16 h-16 rounded-sm bg-divider/20 flex items-center justify-center mb-6 mx-auto border border-divider/30">
              <FileText className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-clash font-bold text-foreground uppercase tracking-tight mb-2">No Quizzes Yet</h3>
            <p className="text-muted-foreground font-light mb-8 max-w-md mx-auto text-sm">
              Start your first quiz to test your technical knowledge and track your progress over time.
            </p>
            <Button
              onClick={onStartNew}
              variant="outline"
              className="h-12 px-8"
            >
              <Sparkles className="w-4 h-4 mr-3 text-accent" />
              Take Your First Quiz
            </Button>
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
                  className="border border-border bg-background rounded-sm p-6 cursor-pointer hover:border-accent hover:bg-divider/5 transition-editorial shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-sm bg-divider/20 flex items-center justify-center border border-divider/30">
                          <Trophy className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-xl font-clash font-bold text-foreground uppercase tracking-tight">
                            Quiz {assessments.length - i}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <BadgeIcon className="w-3 h-3 text-accent" />
                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                              {badge.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(new Date(assessment.createdAt), "MMMM dd, yyyy 'at' HH:mm")}
                        </span>
                      </div>
                    </div>
                    <div className="text-center sm:text-right">
                      <div className="text-4xl md:text-5xl font-clash font-bold text-foreground">
                        {assessment.quizScore.toFixed(1)}%
                      </div>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                        Final Score
                      </p>
                    </div>
                  </div>

                  {assessment.improvementTip && (
                    <div className="border border-accent/20 bg-accent/5 rounded-sm p-4 mt-6">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-accent mb-2">
                            Improvement Tip
                          </p>
                          <p className="text-xs text-muted-foreground font-light leading-relaxed">
                            {assessment.improvementTip}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-divider flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground/50">
                      Click to view detailed results
                    </span>
                    <span className="text-accent group-hover:underline">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border rounded-sm p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Quiz Results</DialogTitle>
          </DialogHeader>
          <div className="p-6 md:p-10">
            <QuizResult
              result={selectedQuiz}
              hideStartNew={false}
              onStartNew={() => {
                setSelectedQuiz(null);
                onStartNew();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}