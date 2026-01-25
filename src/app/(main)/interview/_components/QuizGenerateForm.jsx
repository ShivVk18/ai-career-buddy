"use client";

import { useState, useEffect } from "react";
import { Sparkles, Brain, Plus, X, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { generateQuiz } from "@/actions/Interview";

export default function SkillQuizForm({ onQuizGenerated }) {
  const [skill, setSkill] = useState("");
  const [skills, setSkills] = useState([]);

  const {
    loading,
    fn: generateQuizFn,
    data: quizData,
    error,
  } = useFetch(generateQuiz);

  const addSkill = () => {
    const clean = skill.trim();
    if (!clean) return;

    if (!skills.includes(clean)) {
      setSkills([...skills, clean]);
    }

    setSkill("");
  };

  const removeSkill = (s) => {
    setSkills(skills.filter((x) => x !== s));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const onGenerateQuiz = async () => {
    if (skills.length === 0) {
      toast.error("Please add at least one skill.");
      return;
    }

    try {
      await generateQuizFn(skills);
    } catch (error) {
      toast.error(error.message || "Failed to generate quiz");
    }
  };

  // Handle successful quiz generation
  useEffect(() => {
    if (quizData && !error) {
      toast.success("Quiz generated successfully!");
      
      // Notify parent component
      if (onQuizGenerated) {
        onQuizGenerated();
      }
    }
  }, [quizData, error, onQuizGenerated]);

  return (
    <div className="relative">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#f59e0b]/10 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#fbbf24]/10 blur-3xl rounded-full animate-pulse delay-1000" />
      </div>

      <div className="space-y-10 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-[#f59e0b]/10 to-[#fbbf24]/10 border border-[#f59e0b]/20 backdrop-blur-xl mb-6">
            <Sparkles className="h-4 w-4 text-[#f59e0b] mr-2" />
            <span className="text-sm font-medium text-[#fbbf24]">
              Skills-Based AI Quiz
            </span>
            <Brain className="h-4 w-4 text-[#f59e0b] ml-2" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
            Add Your Skills
          </h2>
          <p className="text-[#b0b0b0] text-lg max-w-xl mx-auto">
            Enter your technical skills — we'll generate a personalized quiz.
          </p>
        </div>

        {/* Card */}
        <div className="p-8 bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 rounded-3xl border border-[#f59e0b]/10 backdrop-blur-xl shadow-xl shadow-[#f59e0b]/10">
          <Label className="text-gray-300 mb-3 block text-lg font-semibold">
            Enter a Skill
          </Label>

          <div className="flex gap-3">
            <Input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., React, Node.js, Tailwind CSS"
              className="bg-[#1a1815]/50 border border-[#f59e0b]/20 text-white placeholder-gray-500 h-12 focus:border-[#f59e0b]/50 focus:ring-2 focus:ring-[#f59e0b]/20"
              disabled={loading}
            />

            <Button
              onClick={addSkill}
              disabled={loading || !skill.trim()}
              className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white px-6 rounded-xl h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Skill Tags */}
          {skills.length > 0 && (
            <div className="mt-6">
              <Label className="text-gray-400 mb-3 block text-sm">
                Selected Skills ({skills.length})
              </Label>
              <div className="flex flex-wrap gap-3">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="px-4 py-2 bg-[#f59e0b]/20 border border-[#f59e0b]/30 text-[#fbbf24] rounded-full flex items-center gap-2 hover:bg-[#f59e0b]/30 transition-colors"
                  >
                    {s}
                    <button
                      onClick={() => removeSkill(s)}
                      disabled={loading}
                      className="hover:scale-110 transition-transform disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-[#fbbf24]" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={onGenerateQuiz}
            disabled={loading || skills.length === 0}
            className="w-full mt-8 bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white py-4 text-lg rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#f59e0b]/30 hover:shadow-2xl hover:shadow-[#f59e0b]/50 transform hover:scale-105 transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                <span>Generating Quiz...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>Generate Interview Quiz</span>
              </>
            )}
          </Button>

          {skills.length === 0 && (
            <p className="text-center text-[#b0b0b0] text-sm mt-4">
              Add at least one skill to generate a quiz
            </p>
          )}
        </div>
      </div>
    </div>
  );
}