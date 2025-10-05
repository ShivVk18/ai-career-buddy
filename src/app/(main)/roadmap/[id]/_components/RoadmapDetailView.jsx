"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Target,
  BookOpen,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Award,
  Brain,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { completeRoadmapStep } from "@/actions/CareerRoadmap";
import { toast } from "sonner";

const RoadmapDetailView = ({ roadmap }) => {
  const [completingStep, setCompletingStep] = useState(null);
  const [activeTab, setActiveTab] = useState("steps");
  const router = useRouter();

  const completedSteps = roadmap.steps.filter((step) => step.completed).length;
  const totalSteps = roadmap.steps.length;

  const handleCompleteStep = async (stepId) => {
    setCompletingStep(stepId);
    try {
      await completeRoadmapStep(roadmap.id, stepId);
      toast.success("Step completed! Great progress!");
      router.refresh();
    } catch (error) {
      toast.error("Failed to complete step");
    } finally {
      setCompletingStep(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "low":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case "skill":
        return BookOpen;
      case "experience":
        return TrendingUp;
      case "networking":
        return Target;
      case "education":
        return BookOpen;
      case "certification":
        return Award;
      default:
        return Clock;
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 70) return "from-emerald-500 to-green-500";
    if (progress >= 50) return "from-blue-500 to-cyan-500";
    if (progress >= 30) return "from-amber-500 to-yellow-500";
    return "from-rose-500 to-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20 text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.back()}
            className="p-3 backdrop-blur-xl bg-slate-800/50 border border-orange-500/30 hover:border-orange-500/50 rounded-2xl transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-orange-400" />
          </button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              {roadmap.currentRole} → {roadmap.targetRole}
            </h1>
            <p className="text-gray-400 mt-1">
              {roadmap.industry} • {roadmap.timeline} month timeline
            </p>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-orange-500/20 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-6 w-6 text-orange-400" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-white">Overall Progress</h2>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">
                {completedSteps} of {totalSteps} steps completed
              </span>
              <span className="text-2xl font-bold text-orange-400">
                {Math.round(roadmap.progress)}%
              </span>
            </div>
            <div className="relative h-4 bg-slate-800/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${roadmap.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${getProgressColor(roadmap.progress)}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-300">
                {roadmap.steps?.length || 0}
              </div>
              <div className="text-sm text-blue-400">Total Steps</div>
            </div>
            <div className="backdrop-blur-xl bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-emerald-300">
                {roadmap.milestones?.length || 0}
              </div>
              <div className="text-sm text-emerald-400">Milestones</div>
            </div>
            <div className="backdrop-blur-xl bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-300">
                {roadmap.resources?.length || 0}
              </div>
              <div className="text-sm text-purple-400">Resources</div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="backdrop-blur-xl bg-slate-800/50 border border-orange-500/20 rounded-2xl p-2">
            <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2">
              <TabsTrigger
                value="steps"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-rose-600 data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <Zap className="h-4 w-4 mr-2" />
                Steps
              </TabsTrigger>
              <TabsTrigger
                value="milestones"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-rose-600 data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <Target className="h-4 w-4 mr-2" />
                Milestones
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-rose-600 data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Resources
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Steps Tab */}
          <TabsContent value="steps" className="space-y-4">
            <AnimatePresence>
              {roadmap.steps.map((step, index) => {
                const IconComponent = getCategoryIcon(step.category);
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`backdrop-blur-xl border-2 rounded-3xl p-6 transition-all duration-300 ${
                      step.completed
                        ? "bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30"
                        : "bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-orange-500/20 hover:border-orange-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`p-3 rounded-2xl ${
                            step.completed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {step.completed ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <IconComponent className="h-6 w-6" />
                          )}
                        </div>

                        <div className="space-y-3 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-semibold text-lg text-white">
                              {step.title}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs border capitalize ${getPriorityColor(step.priority)}`}
                            >
                              {step.priority}
                            </span>
                          </div>

                          <p className="text-gray-400 leading-relaxed">
                            {step.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {step.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {step.estimatedHours}h
                            </div>
                          </div>

                          {step.resources && step.resources.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-300">
                                Resources:
                              </h4>
                              <ul className="space-y-1">
                                {step.resources.map((resource, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-400 flex items-center gap-2"
                                  >
                                    <ChevronRight className="h-3 w-3" />
                                    {resource}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        {!step.completed && (
                          <button
                            onClick={() => handleCompleteStep(step.id)}
                            disabled={completingStep === step.id}
                            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 rounded-xl text-white font-semibold transition-all duration-300 disabled:opacity-50"
                          >
                            {completingStep === step.id
                              ? "Completing..."
                              : "Complete"}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            <AnimatePresence>
              {roadmap.milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-2 border-amber-500/20 rounded-3xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
                      <Target className="h-6 w-6" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg text-white">
                          {milestone.title}
                        </h3>
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs">
                          Month {milestone.targetMonth}
                        </span>
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        {milestone.description}
                      </p>
                      {milestone.criteria && milestone.criteria.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-300">Criteria:</h4>
                          <ul className="space-y-1">
                            {milestone.criteria.map((criteria, i) => (
                              <li
                                key={i}
                                className="text-sm text-gray-400 flex items-center gap-2"
                              >
                                <CheckCircle className="h-3 w-3 text-emerald-400" />
                                {criteria}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {milestone.reward && (
                        <div className="p-3 backdrop-blur-xl bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                          <p className="text-sm text-emerald-300">
                            <strong>Reward:</strong> {milestone.reward}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            <AnimatePresence>
              {roadmap.resources.map((resource, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-2 border-purple-500/20 hover:border-purple-500/40 rounded-3xl p-6 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg text-white">
                          {resource.title}
                        </h3>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs capitalize">
                          {resource.type}
                        </span>
                      </div>
                      <p className="text-gray-400 leading-relaxed">
                        {resource.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {resource.estimatedCost && (
                          <div>Cost: {resource.estimatedCost}</div>
                        )}
                        {resource.timeCommitment && (
                          <div>Time: {resource.timeCommitment}</div>
                        )}
                      </div>
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-slate-800/50 border border-purple-500/30 hover:border-purple-500/50 rounded-xl text-purple-300 hover:text-purple-200 transition-all duration-300"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Resource
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RoadmapDetailView;