"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generateQuiz, saveQuizResult } from "@/actions/Interview";
import QuizResult from "./QuizResult";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { Sparkles, Brain, Play, Clock, Target, Award, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
  } = useFetch(generateQuiz);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
    setData: setResultData,
  } = useFetch(saveQuizResult);

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
    }
  }, [quizData]);

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++;
      }
    });
    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    try {
      await saveQuizResultFn(quizData, answers, score);
      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results");
    }
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowExplanation(false);
    generateQuizFn();
    setResultData(null);
  };

  if (generatingQuiz) {
    return (
      <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 rounded-3xl border border-[#f59e0b]/10 p-12 text-center shadow-2xl shadow-[#f59e0b]/5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 flex items-center justify-center mb-6 mx-auto border border-[#f59e0b]/30 animate-pulse">
          <Brain className="w-10 h-10 text-[#f59e0b] animate-pulse" />
        </div>
        <p className="text-xl text-[#b0b0b0] mb-4">Generating your personalized quiz...</p>
        <BarLoader width={200} color="#f59e0b" className="mx-auto" />
      </div>
    );
  }

  // Show results if quiz is completed
  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 rounded-3xl border border-[#f59e0b]/10 p-8 shadow-2xl shadow-[#f59e0b]/5 mx-2">
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/10 border border-[#f59e0b]/20 backdrop-blur-xl mb-6">
            <Sparkles className="h-4 w-4 text-[#f59e0b] mr-2" />
            <span className="text-sm font-medium text-[#fbbf24]">AI-Powered Questions</span>
            <Brain className="h-4 w-4 text-[#f59e0b] ml-2" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Test Your Knowledge?</h2>
          <p className="text-[#b0b0b0] mb-8">
            This quiz contains 10 questions specific to your industry and skills. Take your time and choose the best answer for each question.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="backdrop-blur-xl bg-[#1a1815]/30 rounded-2xl p-4 border border-[#f59e0b]/20">
              <Clock className="w-8 h-8 text-[#f59e0b] mx-auto mb-2" />
              <p className="text-sm text-[#b0b0b0]">10 Questions</p>
            </div>
            <div className="backdrop-blur-xl bg-[#1a1815]/30 rounded-2xl p-4 border border-[#f59e0b]/20">
              <Target className="w-8 h-8 text-[#f59e0b] mx-auto mb-2" />
              <p className="text-sm text-[#b0b0b0]">Industry Focused</p>
            </div>
            <div className="backdrop-blur-xl bg-[#1a1815]/30 rounded-2xl p-4 border border-[#f59e0b]/20">
              <Award className="w-8 h-8 text-[#f59e0b] mx-auto mb-2" />
              <p className="text-sm text-[#b0b0b0]">Instant Feedback</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={generateQuizFn}
          className="w-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white py-4 px-6 rounded-2xl transition-all duration-300 font-semibold shadow-lg shadow-[#f59e0b]/30 hover:shadow-2xl hover:shadow-[#f59e0b]/50 transform hover:scale-105 flex items-center justify-center gap-3"
        >
          <Play className="w-5 h-5" />
          Start Quiz
        </button>
      </div>
    );
  }

  const question = quizData[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.length) * 100;

  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 rounded-3xl border border-[#f59e0b]/10 p-8 shadow-2xl shadow-[#f59e0b]/5 mx-2">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-[#b0b0b0]">
            Question {currentQuestion + 1} of {quizData.length}
          </span>
          <span className="text-sm font-medium text-[#f59e0b]">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-[#1a1815]/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-6">{question.question}</h3>
        
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                answers[currentQuestion] === option
                  ? 'bg-gradient-to-r from-[#f59e0b]/20 to-[#fbbf24]/20 border-[#f59e0b]/50 shadow-lg shadow-[#f59e0b]/20'
                  : 'bg-[#1a1815]/30 border-[#6b7280] hover:border-[#f59e0b]/30 hover:bg-[#1a1815]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  answers[currentQuestion] === option
                    ? 'border-[#f59e0b] bg-[#f59e0b]'
                    : 'border-gray-500'
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
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="mb-6 backdrop-blur-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Brain className="w-6 h-6 text-[#f59e0b] flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-[#fbbf24] mb-2">Explanation</p>
              <p className="text-[#b0b0b0] leading-relaxed">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {!showExplanation && (
          <button
            onClick={() => setShowExplanation(true)}
            disabled={!answers[currentQuestion]}
            className="flex-1 backdrop-blur-xl bg-[#1a1815]/50 border border-[#f59e0b]/30 hover:border-[#f59e0b]/50 text-white py-3 px-6 rounded-2xl transition-all duration-300 font-semibold hover:bg-[#1a1815]/70 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Show Explanation
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!answers[currentQuestion] || savingResult}
          className="flex-1 bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white py-3 px-6 rounded-2xl transition-all duration-300 font-semibold shadow-lg shadow-[#f59e0b]/30 hover:shadow-2xl hover:shadow-[#f59e0b]/50 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {savingResult ? (
            <BarLoader width={100} color="#ffffff" />
          ) : (
            <>
              {currentQuestion < quizData.length - 1 ? "Next Question" : "Finish Quiz"}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}