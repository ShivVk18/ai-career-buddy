"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmptyState from "@/components/ui/EmptyState";
import { Chip } from "@/components/ui/Chip";
import QuizResult from "./QuizResult";
import { ChevronRight, Plus } from "lucide-react";

const badge = (score) => (score >= 90 ? ["excellent", "brand"] : score >= 80 ? ["great", "brand"] : score >= 70 ? ["good", "neutral"] : ["keep learning", "warn"]);

export default function QuizList({ assessments, onStartNew }) {
  const router = useRouter();
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const startNew = onStartNew || (() => router.push("/interview/mock"));

  if (!assessments || assessments.length === 0) {
    return (
      <EmptyState
        outfit="headphones"
        title="no quizzes yet"
        text="take one and your score and a tip show up here."
        action={
          <Link href="/interview/mock" className="btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Plus className="size-4" aria-hidden="true" /> take your first quiz
          </Link>
        }
      />
    );
  }

  return (
    <>
      <ul className="space-y-2.5">
        {assessments.map((assessment, i) => {
          const [label, tone] = badge(assessment.quizScore);
          return (
            <li key={assessment.id}>
              <button
                type="button"
                onClick={() => setSelectedQuiz(assessment)}
                className="flex min-h-14 w-full items-center gap-3 rounded-[14px] border border-line bg-bg p-3.5 text-left outline-none transition-colors hover:border-brand/60 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-doc text-2xl text-text">{assessment.quizScore.toFixed(1)}%</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-sm text-text">
                    quiz {assessments.length - i} <Chip tone={tone} editable={false} value={label} className="h-6 text-xs" />
                  </span>
                  <span className="block text-xs text-muted">{format(new Date(assessment.createdAt), "MMM d, yyyy, HH:mm")}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-faint" aria-hidden="true" />
                <span className="sr-only">view details</span>
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[20px] border border-line bg-panel p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>quiz results</DialogTitle>
          </DialogHeader>
          <div className="p-5 md:p-10">
            <QuizResult
              result={selectedQuiz}
              hideStartNew={false}
              onStartNew={() => {
                setSelectedQuiz(null);
                startNew();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
