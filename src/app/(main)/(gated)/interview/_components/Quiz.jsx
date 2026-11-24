"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Home,
  Loader2
} from "lucide-react";

import { submitQuiz } from "@/actions/Interview";
import QuizResult from "./QuizResult";
import { Button } from "@/components/ui/button";
import AppWindow from "@/components/ui/AppWindow";
import PipAvatar from "@/components/ui/PipAvatar";

export default function Quiz({ onComplete, initialQuestions }) {
  // initialQuestions is the generateQuiz() response: { quizId, questions: [{ question, options }] }
  const quizId = initialQuestions?.quizId || null;
  const quizData = initialQuestions?.questions?.length ? initialQuestions.questions : null;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);

  const [savingResult, setSavingResult] = useState(false);
  const [submitData, setSubmitData] = useState(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
      setCurrentQuestion(0);
    }
  }, [initialQuestions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (submitData) toast.success("quiz finished");
  }, [submitData]);

  // Shape the server response like a saved Assessment so QuizResult renders both.
  const resultData = submitData
    ? {
        quizScore: submitData.score,
        correctCount: submitData.correctCount,
        total: submitData.total,
        improvementTip: submitData.improvementTip,
        questions: submitData.results.map((r) => ({
          question: r.question,
          answer: r.correctAnswer,
          userAnswer: r.userAnswer,
          isCorrect: r.isCorrect,
          explanation: r.explanation,
        })),
      }
    : null;

  const handleAnswer = (answer) => {
    const updated = [...answers];
    updated[currentQuestion] = answer;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishQuiz = async () => {
    if (savingResult || alreadySubmitted) return;
    setSavingResult(true);
    try {
      const res = await submitQuiz(quizId, answers); // result or { error, code }
      if (res?.code) {
        if (res.code === "ALREADY_SUBMITTED") setAlreadySubmitted(true);
        toast.error(res.error || "couldn't submit the quiz");
      } else if (res?.results) {
        setSubmitData(res);
      } else {
        toast.error("couldn't submit the quiz");
      }
    } catch (e) {
      toast.error(e?.message || "couldn't submit the quiz");
    } finally {
      setSavingResult(false);
    }
  };

  const handleBackToHome = () => {
    if (onComplete) {
      onComplete();
    }
  };

  // Show quiz result
  if (resultData) {
    return (
      <div className="animate-in fade-in duration-700">
        <QuizResult result={resultData} onStartNew={handleBackToHome} />
      </div>
    );
  }

  // If quiz is not loaded yet
  if (!quizData) {
    return (
      <div className="panel-cozy p-8 text-center sm:p-12">
        <PipAvatar outfit="headphones" size="xl" alt="" className="mx-auto" />
        <h3 className="mt-4 font-doc text-2xl text-text">no quiz ready</h3>
        <p className="mb-6 mt-2 text-sm text-muted">go back and make a new set of questions first.</p>
        <Button variant="ink" onClick={handleBackToHome} className="min-h-11 px-6">
          back to interview prep
        </Button>
      </div>
    );
  }

  const question = quizData[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.length) * 100;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AppWindow title="ascendai · quick quiz" bodyClassName="p-5 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            question {currentQuestion + 1} of {quizData.length}
          </p>
          <button
            type="button"
            onClick={handleBackToHome}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-muted outline-none transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="size-4" aria-hidden="true" /> quit
          </button>
        </div>

        <div
          role="progressbar"
          aria-label="quiz progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="mb-8 h-1.5 overflow-hidden rounded-full bg-soft"
        >
          <div className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
        </div>

        <h3 className="mb-6 font-doc text-2xl leading-snug text-text sm:text-3xl">{question.question}</h3>

        <div role="radiogroup" aria-label="answers" className="mb-8 grid grid-cols-1 gap-3">
          {question.options.map((option, index) => {
            const on = answers[currentQuestion] === option;
            return (
              <button
                key={index}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => handleAnswer(option)}
                disabled={savingResult}
                className={`flex min-h-12 items-center gap-4 rounded-[14px] border p-4 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                  on ? "border-brand bg-brand-soft" : "border-line bg-panel hover:border-brand/60 hover:bg-soft"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-6 shrink-0 place-items-center rounded-full border ${on ? "border-brand-ink bg-brand-ink text-white" : "border-line"}`}
                >
                  {on && <CheckCircle2 className="size-3.5" />}
                </span>
                <span className={`text-sm sm:text-base ${on ? "font-medium text-text" : "text-muted"}`}>{option}</span>
              </button>
            );
          })}
        </div>

        {alreadySubmitted && <p className="mb-5 text-sm text-muted">this quiz has already been submitted. start a new one from interview prep.</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          {currentQuestion > 0 && (
            <Button variant="outline" onClick={handlePrevious} className="min-h-12 px-6">
              <ArrowLeft className="size-4" aria-hidden="true" /> prev
            </Button>
          )}
          <Button
            variant="ink"
            onClick={handleNext}
            disabled={!answers[currentQuestion] || savingResult || alreadySubmitted}
            className="min-h-12 flex-1"
          >
            {savingResult ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-label="saving" />
            ) : (
              <>
                {currentQuestion < quizData.length - 1 ? "next question" : "finish quiz"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 flex justify-center gap-1">
          {quizData.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`go to question ${idx + 1}`}
              aria-current={idx === currentQuestion ? "step" : undefined}
              onClick={() => setCurrentQuestion(idx)}
              className="grid size-6 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  idx === currentQuestion ? "w-6 bg-brand-ink" : answers[idx] ? "w-3 bg-brand/60" : "w-3 bg-line"
                }`}
              />
            </button>
          ))}
        </div>
      </AppWindow>
    </div>
  );
}
