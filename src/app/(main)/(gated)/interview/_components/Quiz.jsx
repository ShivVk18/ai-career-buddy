"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";
import {
  Sparkles,
  Brain,
  Target,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Home,
  Loader2,
  HelpCircle
} from "lucide-react";

import { saveQuizResult, getLatestQuiz } from "@/actions/Interview";
import useFetch from "@/hooks/use-fetch";
import QuizResult from "./QuizResult";
import { Button } from "@/components/ui/button";

export default function Quiz({ onComplete, initialQuestions }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizData, setQuizData] = useState(initialQuestions || null);
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);

  // Load quiz that was ALREADY generated from Skill Form
  const {
    loading: loadingQuiz,
    fn: loadQuizFn,
    data: fetchedQuizData,
  } = useFetch(getLatestQuiz);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
  } = useFetch(saveQuizResult);

  // Load quiz on mount if not provided as prop
  useEffect(() => {
    if (!initialQuestions) {
      loadQuizFn();
    }
  }, [initialQuestions, loadQuizFn]);

  useEffect(() => {
    if (fetchedQuizData) {
      setQuizData(fetchedQuizData);
    }
  }, [fetchedQuizData]);

  useEffect(() => {
    if (initialQuestions) {
      setQuizData(initialQuestions);
    }
  }, [initialQuestions]);

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
      toast.success("Great job! Interview completed 🎉");
    } catch (err) {
      toast.error(err.message || "Failed to save your results");
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
      <div className="border border-border bg-background rounded-sm p-12 text-center shadow-lg">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-8 mx-auto border border-accent/20 animate-pulse">
          <Brain className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-clash font-bold text-foreground uppercase tracking-tight mb-4">Preparing Your Interview</h3>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-8">Getting your questions ready...</p>
        <BarLoader width={200} color="var(--accent)" className="mx-auto" />
      </div>
    );
  }

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
      <div className="border border-border bg-background rounded-sm p-12 text-center shadow-lg">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-8 mx-auto border border-accent/20">
          <Brain className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-clash font-bold text-foreground uppercase tracking-tight mb-4">No Interview Ready</h3>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-8">Please go back and generate a new set of questions first.</p>
        <Button onClick={handleBackToHome} className="h-12 px-8">
          Back to Interview Hub
        </Button>
      </div>
    );
  }

  const question = quizData[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.length) * 100;

  return (
    <div className="border border-border bg-background rounded-sm p-8 md:p-12 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-divider/10"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-divider/20 flex items-center justify-center border border-divider/30">
            <Target className="w-4 h-4 text-accent" />
          </div>
          <h2 className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase">Mock Interview</h2>
        </div>
        <button
          onClick={handleBackToHome}
          className="text-muted-foreground hover:text-foreground transition-editorial flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest group"
        >
          <Home className="w-4 h-4 group-hover:text-accent transition-editorial" />
          <span>Quit</span>
        </button>
      </div>

      {/* Progress Monitor */}
      <div className="mb-12">
        <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase mb-4">
          <span className="text-muted-foreground">Question {currentQuestion + 1} of {quizData.length}</span>
          <span className="text-accent">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-[1px] bg-divider/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-700 ease-editorial"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-10">
        <span className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mb-4 block">Question {currentQuestion + 1}</span>
        <h3 className="text-2xl md:text-4xl font-clash font-bold text-foreground uppercase tracking-tight leading-tight">{question.question}</h3>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-4 mb-12">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(option)}
            disabled={showExplanation}
            className={`group text-left p-6 border transition-editorial flex items-center gap-6 rounded-sm ${
              answers[currentQuestion] === option
                ? "border-accent bg-accent/5 shadow-sm"
                : "border-divider/50 hover:border-accent hover:bg-divider/5"
            } ${showExplanation ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <div className={`w-5 h-5 border flex items-center justify-center transition-editorial rounded-sm ${
              answers[currentQuestion] === option
                ? "border-accent bg-accent text-accent-foreground"
                : "border-divider/50"
            }`}>
              {answers[currentQuestion] === option && (
                <CheckCircle2 className="w-3 h-3" />
              )}
            </div>
            <span className={`text-sm md:text-base font-general transition-editorial ${
              answers[currentQuestion] === option ? "text-foreground font-medium" : "text-muted-foreground"
            }`}>{option}</span>
          </button>
        ))}
      </div>

      {/* Intelligence Explanation */}
      {showExplanation && (
        <div className="mb-12 p-8 bg-divider/5 border border-divider/30 rounded-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <p className="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
            <Brain className="w-4 h-4" /> Coach&apos;s Explanation
          </p>
          <p className="text-muted-foreground font-general font-light leading-relaxed text-sm md:text-base">{question.explanation}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex gap-4">
          {currentQuestion > 0 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="h-14 px-8 border-divider"
            >
              <ArrowLeft className="w-4 h-4 mr-3" />
              Prev
            </Button>
          )}

          {!showExplanation && (
            <Button
              variant="outline"
              onClick={() => setShowExplanation(true)}
              disabled={!answers[currentQuestion]}
              className="h-14 px-8 border-divider"
            >
              <HelpCircle className="w-4 h-4 mr-3" />
              Explain
            </Button>
          )}
        </div>

        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion] || savingResult}
          className="flex-1 h-14 text-xs font-bold tracking-widest uppercase items-center justify-center shadow-lg"
        >
          {savingResult ? (
            <Loader2 className="h-4 w-4 animate-spin mr-3" />
          ) : (
            <>
              {currentQuestion < quizData.length - 1
                ? "Next Question"
                : "Finish Interview"}
              <ArrowRight className="w-4 h-4 ml-4" />
            </>
          )}
        </Button>
      </div>

      {/* Dot Matrix Navigation */}
      <div className="flex justify-center gap-3 mt-12">
        {quizData.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentQuestion(idx);
              setShowExplanation(false);
            }}
            className={`h-1 transition-editorial rounded-full ${
              idx === currentQuestion
                ? 'bg-accent w-10'
                : answers[idx]
                ? 'bg-accent/40 w-4'
                : 'bg-divider w-4'
            }`}
          />
        ))}
      </div>
    </div>
  );
}