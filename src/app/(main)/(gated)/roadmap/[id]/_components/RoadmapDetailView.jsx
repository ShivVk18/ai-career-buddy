"use client";

import React, { useState, useEffect } from "react";
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
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { setRoadmapStepDone, getStepTargets } from "@/actions/CareerRoadmap";
import { generationErrorMessage } from "@/components/shared/generationError";
import SourceChips from "@/components/shared/SourceChips";

const RoadmapDetailView = ({ roadmap }) => {
  const [completingStep, setCompletingStep] = useState(null);
  const [activeTab, setActiveTab] = useState("steps");
  const router = useRouter();

  const [steps, setSteps] = useState(roadmap.steps);
  const [progress, setProgress] = useState(roadmap.progress);
  const [targets, setTargets] = useState(null); // { [stepId]: [...] }
  const [targetsState, setTargetsState] = useState("loading"); // loading | ready | error

  // Resync from server props after router.refresh(), but never while a toggle is in flight.
  const inFlightRef = React.useRef(false);
  useEffect(() => {
    if (inFlightRef.current) return;
    setSteps(roadmap.steps);
    setProgress(roadmap.progress);
  }, [roadmap.steps, roadmap.progress]);

  const completedSteps = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;

  useEffect(() => {
    let cancelled = false;
    getStepTargets(roadmap.id)
      .then((res) => {
        if (cancelled) return;
        if (res?.targets) {
          setTargets(res.targets);
          setTargetsState("ready");
        } else {
          setTargetsState("error");
        }
      })
      .catch(() => !cancelled && setTargetsState("error"));
    return () => {
      cancelled = true;
    };
  }, [roadmap.id]);

  // Optimistic toggle; reverts if the save fails. The toast's Undo is the same call with the old value.
  const toggleStep = async (stepId, done, isUndo = false) => {
    if (completingStep !== null) return;
    const prevSteps = steps;
    const prevProgress = progress;
    const nextSteps = steps.map((st) => (st.id === stepId ? { ...st, completed: done } : st));
    setSteps(nextSteps);
    setProgress((nextSteps.filter((st) => st.completed).length / (nextSteps.length || 1)) * 100);
    setCompletingStep(stepId);
    inFlightRef.current = true;
    try {
      const res = await setRoadmapStepDone(roadmap.id, stepId, done);
      if (res?.error || !res?.success) throw new Error(generationErrorMessage(res, "Failed to save"));
      if (typeof res.progress === "number") setProgress(res.progress);
      if (Array.isArray(res.steps)) setSteps(res.steps);
      if (isUndo) {
        toast.success("Undone");
      } else {
        toast.success(done ? "Step completed" : "Step marked not done", {
          duration: 5000,
          action: { label: "Undo", onClick: () => toggleStepRef.current?.(stepId, !done, true) },
        });
      }
    } catch (error) {
      setSteps(prevSteps);
      setProgress(prevProgress);
      toast.error(error?.message || "Failed to update step");
    } finally {
      inFlightRef.current = false;
      setCompletingStep(null);
      router.refresh();
    }
  };
  const toggleStepRef = React.useRef(null);
  toggleStepRef.current = toggleStep;

  // Phase-grouped checklist (D47): the roadmap stores no step-to-phase link, so steps are split in order
  // across the phases. This is an AI estimate, not a stored plan.
  const phases = roadmap.timeline?.phaseBreakdown || [];
  const groups = (() => {
    if (!phases.length) return [{ title: null, description: null, duration: null, items: steps }];
    const out = phases.map((ph) => ({ ...ph, items: [] }));
    steps.forEach((st, i) => {
      out[Math.min(out.length - 1, Math.floor((i * out.length) / steps.length))].items.push(st);
    });
    return out.filter((g) => g.items.length > 0);
  })();

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-[#f59e0b]/20 text-[#fbbf24] border-[#f59e0b]/30";
      case "medium":
        return "bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/25";
      case "low":
        return "bg-[#f59e0b]/10 text-[#b0b0b0] border-[#f59e0b]/20";
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
    if (progress >= 70) return "from-[#f59e0b] to-[#fbbf24]";
    if (progress >= 50) return "from-[#f59e0b] to-[#fbbf24]";
    if (progress >= 30) return "from-[#f59e0b]/80 to-[#fbbf24]/80";
    return "from-[#f59e0b]/60 to-[#fbbf24]/60";
  };

  return (
    <div className="min-h-screen bg-[#0f0e0a] text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#f59e0b]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#fbbf24]/10 rounded-full blur-3xl animate-pulse"></div>
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
            className="p-3 backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 border border-[#f59e0b]/30 hover:border-[#f59e0b]/50 rounded-2xl transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-[#f59e0b]" />
          </button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] bg-clip-text text-transparent">
              {roadmap.currentRole} → {roadmap.targetRole}
            </h1>
            <p className="text-[#b0b0b0] mt-1">
              {roadmap.industry} • {roadmap.timeline?.estimatedDuration}
            </p>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 via-[#252218]/60 to-[#1a1815]/80 border border-[#f59e0b]/20 rounded-3xl p-8 shadow-xl shadow-[#f59e0b]/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-6 w-6 text-[#f59e0b]" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-white">
              Overall Progress
            </h2>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-[#b0b0b0]">
                {completedSteps} of {totalSteps} steps completed
              </span>
              <span className="text-2xl font-bold text-[#fbbf24]">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="relative h-4 bg-[#1a1815]/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-gradient-to-r ${getProgressColor(
                  progress
                )}`}
              />
            </div>
          </div>

          {/* Timeline Breakdown */}
          {roadmap.timeline?.phaseBreakdown?.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-[#f59e0b]">
                Timeline Phases
              </h3>
              <ul className="space-y-3">
                {roadmap.timeline.phaseBreakdown.map((phase, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-[#b0b0b0]"
                  >
                    <div className="mt-1.5">
                      <CheckCircle className="h-4 w-4 text-[#f59e0b]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{phase.title}</p>
                      <p className="text-sm text-[#b0b0b0]">
                        {phase.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 to-[#252218]/60 border border-[#f59e0b]/20 rounded-2xl p-2">
            <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2">
              <TabsTrigger
                value="steps"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f59e0b] data-[state=active]:to-[#fbbf24] data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <Zap className="h-4 w-4 mr-2" />
                Steps
              </TabsTrigger>
              <TabsTrigger
                value="milestones"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f59e0b] data-[state=active]:to-[#fbbf24] data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <Target className="h-4 w-4 mr-2" />
                Milestones
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f59e0b] data-[state=active]:to-[#fbbf24] data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Resources
              </TabsTrigger>
            </TabsList>
          </div>

          {/* --- Steps Tab --- */}
          <TabsContent value="steps" className="space-y-4">
            <p className="text-xs text-[#b0b0b0]">
              AI estimate: steps are grouped by phase in order, and the roadmap itself is AI generated.
            </p>
            {groups.map((group, gi) => (
            <div key={gi} className="space-y-4">
              {group.title && (
                <div className="pt-2">
                  <h3 className="text-lg font-semibold text-[#f59e0b]">
                    {group.title}
                    {group.duration ? <span className="text-sm font-normal text-[#b0b0b0]"> ({group.duration})</span> : null}
                  </h3>
                  {group.description && <p className="text-sm text-[#b0b0b0]">{group.description}</p>}
                </div>
              )}
            <AnimatePresence>
              {group.items.map((step, index) => {
                const IconComponent = getCategoryIcon(step.category);
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`backdrop-blur-xl border-2 rounded-3xl p-6 transition-all duration-300 shadow-xl ${
                      step.completed
                        ? "bg-gradient-to-br from-[#1a1815]/80 via-[#252218]/60 to-[#1a1815]/80 border-[#fbbf24]/30 shadow-[#fbbf24]/5"
                        : "bg-gradient-to-br from-[#1a1815]/80 via-[#252218]/60 to-[#1a1815]/80 border-[#f59e0b]/20 hover:border-[#f59e0b]/40 hover:shadow-[#f59e0b]/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`p-3 rounded-2xl ${
                            step.completed
                              ? "bg-[#fbbf24]/20 text-[#fbbf24]"
                              : "bg-[#f59e0b]/20 text-[#f59e0b]"
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
                              className={`px-3 py-1 rounded-full text-xs border capitalize ${getPriorityColor(
                                step.priority
                              )}`}
                            >
                              {step.priority}
                            </span>
                          </div>

                          <p className="text-[#b0b0b0] leading-relaxed">
                            {step.description}
                          </p>

                          {targetsState === "ready" && targets?.[step.id]?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold tracking-widest uppercase text-[#b0b0b0]">
                                Closes gaps for
                              </span>
                              {targets[step.id].map((t, ti) => (
                                <span
                                  key={ti}
                                  title={t.jdExcerpt}
                                  className="px-2 py-1 rounded-full text-xs border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fbbf24] cursor-help"
                                >
                                  {[t.company, t.role].filter(Boolean).join(" - ")}
                                </span>
                              ))}
                            </div>
                          )}

                          <SourceChips
                            sources={step.sources}
                            legacy={!Array.isArray(step.sources)}
                            heading="Based on"
                          />

                          {step.resources && step.resources.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-[#b0b0b0]">
                                Resources:
                              </h4>
                              <ul className="space-y-1">
                                {step.resources.map((resource, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-[#b0b0b0] flex items-center gap-2"
                                  >
                                    <ChevronRight className="h-3 w-3 text-[#f59e0b]" />
                                    {resource}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={() => toggleStep(step.id, !step.completed)}
                          disabled={completingStep !== null}
                          className={
                            step.completed
                              ? "px-4 py-2 border border-[#f59e0b]/40 rounded-xl text-[#fbbf24] font-semibold transition-all duration-300 disabled:opacity-50 hover:bg-[#f59e0b]/10"
                              : "px-4 py-2 bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] rounded-xl text-white font-semibold transition-all duration-300 disabled:opacity-50 shadow-lg shadow-[#f59e0b]/30 hover:shadow-xl hover:shadow-[#f59e0b]/40"
                          }
                        >
                          {completingStep === step.id
                            ? "Saving..."
                            : step.completed
                            ? "Mark not done"
                            : "Complete"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            </div>
            ))}
            {targetsState === "error" && (
              <p className="text-xs text-[#b0b0b0]">Couldn&apos;t load which of your targets each step closes gaps for.</p>
            )}
            {steps.length === 0 && (
              <p className="text-[#b0b0b0]">This roadmap has no steps yet.</p>
            )}
          </TabsContent>

          {/* --- Milestones Tab --- */}
          <TabsContent value="milestones" className="space-y-4">
            <AnimatePresence>
              {roadmap.milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 via-[#252218]/60 to-[#1a1815]/80 border-2 border-[#f59e0b]/20 hover:border-[#f59e0b]/40 rounded-3xl p-6 shadow-xl shadow-[#f59e0b]/5 hover:shadow-[#f59e0b]/10 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#f59e0b]/20 text-[#f59e0b] rounded-2xl">
                      <Target className="h-6 w-6" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="font-semibold text-lg text-white">
                        {milestone.title}
                      </h3>
                      <p className="text-[#b0b0b0] leading-relaxed">
                        {milestone.summary}
                      </p>
                      <div className="px-3 py-1 bg-[#f59e0b]/20 text-[#fbbf24] border border-[#f59e0b]/30 rounded-full text-xs w-fit">
                        {milestone.targetDate}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </TabsContent>

          {/* --- Resources Tab --- */}
          <TabsContent value="resources" className="space-y-4">
            <AnimatePresence>
              {roadmap.resources.map((resource, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="backdrop-blur-xl bg-gradient-to-br from-[#1a1815]/80 via-[#252218]/60 to-[#1a1815]/80 border-2 border-[#f59e0b]/20 hover:border-[#f59e0b]/40 rounded-3xl p-6 transition-all duration-300 shadow-xl shadow-[#f59e0b]/5 hover:shadow-[#f59e0b]/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#f59e0b]/20 text-[#f59e0b] rounded-2xl">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="font-semibold text-lg text-white">
                        {resource.category}
                      </h3>
                      <ul className="space-y-2">
                        {resource.items.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-[#b0b0b0]"
                          >
                            <ChevronRight className="h-3 w-3 text-[#f59e0b]" />
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[#fbbf24] transition"
                            >
                              {item.title}
                            </a>
                          </li>
                        ))}
                      </ul>
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