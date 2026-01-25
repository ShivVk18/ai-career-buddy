"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";
import {
  Sparkles,
  Brain,
  Play,
  Clock,
  Target,
  Award,
  CheckCircle2,
  ArrowRight,
  Home
} from "lucide-react";

import { saveQuizResult, getLatestQuiz } from "@/actions/Interview";
import useFetch from "@/hooks/use-fetch";
import QuizResult from "./QuizResult";

export default function Quiz({ onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);

  // Load quiz that was ALREADY generated from Skill Form
  const {
    loading: loadingQuiz,
    fn: loadQuizFn,
    data: quizData,
  } = useFetch(getLatestQuiz);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
    setData: setResultData,
  } = useFetch(saveQuizResult);

  // Load quiz on mount
  useEffect(() => {
    loadQuizFn();
  }, []);

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
    }
  }, [quizData]);

  const handleAnswer = (answer) => {
    const updated = [...answers];
    updated[currentQuestion] = answer;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((ans, idx) => {
      if (ans === quizData[idx].correctAnswer) correct++;
    });
    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    try {
      await saveQuizResultFn(quizData, answers, score);
      toast.success("Quiz Completed!");
    } catch (err) {
      toast.error(err.message || "Failed to save quiz data");
    }
  };

  const handleBackToHome = () => {
    if (onComplete) {
      onComplete();
    }
  };

  // Loading screen
  if (loadingQuiz) {
    return (
      <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 rounded-3xl border border-[#f59e0b]/10 p-12 text-center shadow-2xl shadow-[#f59e0b]/5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center mb-6 mx-auto animate-pulse">
          <Brain className="w-10 h-10 text-[#f59e0b]" />
        </div>
        <p className="text-xl text-[#b0b0b0] mb-3">Loading your quiz...</p>
        <BarLoader width={200} color="#f59e0b" className="mx-auto" />
      </div>
    );
  }

  // Show quiz result
  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={handleBackToHome} />
      </div>
    );
  }

  // If quiz is not loaded yet
  if (!quizData) {
    return (
      <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 rounded-3xl border border-[#f59e0b]/10 p-12 text-center shadow-2xl shadow-[#f59e0b]/5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center mb-6 mx-auto">
          <Brain className="w-10 h-10 text-[#f59e0b]" />
        </div>
        <p className="text-xl text-white mb-2">No Quiz Found!</p>
        <p className="text-[#b0b0b0] mb-6">Please generate a quiz first from the skills form.</p>
        <button
          onClick={handleBackToHome}
          className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white py-3 px-6 rounded-2xl transition-all duration-300 font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const question = quizData[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.length) * 100;

  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 rounded-3xl border border-[#f59e0b]/10 p-8 shadow-2xl shadow-[#f59e0b]/5 mx-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center border border-[#f59e0b]/30">
            <Target className="w-5 h-5 text-[#f59e0b]" />
          </div>
          <h2 className="text-2xl font-bold text-white">Skills Quiz</h2>
        </div>
        <button
          onClick={handleBackToHome}
          className="text-[#b0b0b0] hover:text-white transition-colors flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-[#b0b0b0] mb-3">
          <span>Question {currentQuestion + 1} of {quizData.length}</span>
          <span className="text-[#f59e0b] font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h3 className="text-2xl font-bold text-white mb-6">{question.question}</h3>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(option)}
            disabled={showExplanation}
            className={`w-full p-4 rounded-xl border transition duration-300 text-left ${
              answers[currentQuestion] === option
                ? "border-[#f59e0b] bg-[#f59e0b]/20"
                : "border-gray-600 bg-black/40 hover:bg-black/60"
            } ${showExplanation ? 'cursor-not-allowed opacity-75' : ''}`}
          >
            <div className="flex gap-3 items-center">
              <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                answers[currentQuestion] === option
                  ? "border-[#f59e0b] bg-[#f59e0b]"
                  : "border-gray-500"
              }`}>
                {answers[currentQuestion] === option && (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-gray-200">{option}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="mt-6 p-5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[#fbbf24] font-semibold mb-2 flex items-center gap-2">
            <Brain className="w-5 h-5" /> Explanation
          </p>
          <p className="text-[#b0b0b0]">{question.explanation}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        {currentQuestion > 0 && (
          <button
            onClick={handlePrevious}
            className="py-3 px-6 rounded-xl bg-black/40 border border-[#f59e0b]/20 text-white hover:bg-black/60 transition-colors"
          >
            Previous
          </button>
        )}

        {!showExplanation && (
          <button
            onClick={() => setShowExplanation(true)}
            disabled={!answers[currentQuestion]}
            className="flex-1 py-3 rounded-xl bg-black/40 border border-[#f59e0b]/20 text-white disabled:opacity-40 hover:bg-black/60 transition-colors"
          >
            Show Explanation
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={!answers[currentQuestion] || savingResult}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-white flex items-center justify-center gap-2 disabled:opacity-40 hover:shadow-lg hover:shadow-[#f59e0b]/30 transition-all"
        >
          {savingResult ? (
            <BarLoader width={80} color="#ffffff" />
          ) : (
            <>
              {currentQuestion < quizData.length - 1
                ? "Next Question"
                : "Finish Quiz"}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Question Navigation Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {quizData.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentQuestion(idx);
              setShowExplanation(false);
            }}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === currentQuestion
                ? 'bg-[#f59e0b] w-8'
                : answers[idx]
                ? 'bg-[#fbbf24]/50'
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}