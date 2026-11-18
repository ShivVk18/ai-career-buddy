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
        return "bg-primary/20 text-primary-ink border-primary/30";
      case "medium":
        return "bg-primary/15 text-primary-ink border-primary/25";
      case "low":
        return "bg-primary/10 text-muted border-primary/20";
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
    if (progress >= 70) return "from-primary to-lime";
    if (progress >= 50) return "from-primary to-lime";
    if (progress >= 30) return "from-primary/80 to-lime/80";
    return "from-primary/60 to-lime/60";
  };

  return (
    <div className="min-h-screen bg-bg text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-lime/10 rounded-full blur-3xl animate-pulse"></div>
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
            className="p-3 backdrop-blur-xl bg-gradient-to-br from-panel/80 to-soft/60 border border-primary/30 hover:border-primary/50 rounded-2xl transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-primary-ink" />
          </button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary via-lime to-primary bg-clip-text text-transparent">
              {roadmap.currentRole} → {roadmap.targetRole}
            </h1>
            <p className="text-muted mt-1">
              {roadmap.industry} • {roadmap.timeline?.estimatedDuration}
            </p>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-gradient-to-br from-panel/80 via-soft/60 to-panel/80 border border-primary/20 rounded-3xl p-8 shadow-xl shadow-primary/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-6 w-6 text-primary-ink" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-white">
              Overall Progress
            </h2>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-muted">
                {completedSteps} of {totalSteps} steps completed
              </span>
              <span className="text-2xl font-bold text-primary-ink">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="relative h-4 bg-panel/50 rounded-full overflow-hidden">
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
              <h3 className="text-lg font-semibold text-primary-ink">
                Timeline Phases
              </h3>
              <ul className="space-y-3">
                {roadmap.timeline.phaseBreakdown.map((phase, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-muted"
                  >
                    <div className="mt-1.5">
                      <CheckCircle className="h-4 w-4 text-primary-ink" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{phase.title}</p>
                      <p className="text-sm text-muted">
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
          <div className="backdrop-blur-xl bg-gradient-to-br from-panel/80 to-soft/60 border border-primary/20 rounded-2xl p-2">
            <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2">
              <TabsTrigger
                value="steps"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-lime data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <Zap className="h-4 w-4 mr-2" />
                Steps
              </TabsTrigger>
              <TabsTrigger
                value="milestones"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-lime data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <Target className="h-4 w-4 mr-2" />
                Milestones
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-lime data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Resources
              </TabsTrigger>
            </TabsList>
          </div>

          {/* --- Steps Tab --- */}
          <TabsContent value="steps" className="space-y-4">
            <p className="text-xs text-muted">
              AI estimate: steps are grouped by phase in order, and the roadmap itself is AI generated.
            </p>
            {groups.map((group, gi) => (
            <div key={gi} className="space-y-4">
              {group.title && (
                <div className="pt-2">
                  <h3 className="text-lg font-semibold text-primary-ink">
                    {group.title}
                    {group.duration ? <span className="text-sm font-normal text-muted"> ({group.duration})</span> : null}
                  </h3>
                  {group.description && <p className="text-sm text-muted">{group.description}</p>}
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
                        ? "bg-gradient-to-br from-panel/80 via-soft/60 to-panel/80 border-lime/30 shadow-lime/5"
                        : "bg-gradient-to-br from-panel/80 via-soft/60 to-panel/80 border-primary/20 hover:border-primary/40 hover:shadow-primary/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`p-3 rounded-2xl ${
                            step.completed
                              ? "bg-lime/20 text-primary-ink"
                              : "bg-primary/20 text-primary-ink"
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

                          <p className="text-muted leading-relaxed">
                            {step.description}
                          </p>

                          {targetsState === "ready" && targets?.[step.id]?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-bold tracking-widest uppercase text-muted">
                                Closes gaps for
                              </span>
                              {targets[step.id].map((t, ti) => (
                                <span
                                  key={ti}
                                  title={t.jdExcerpt}
                                  className="px-2 py-1 rounded-full text-xs border border-primary/30 bg-primary/10 text-primary-ink cursor-help"
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
                              <h4 className="font-medium text-sm text-muted">
                                Resources:
                              </h4>
                              <ul className="space-y-1">
                                {step.resources.map((resource, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-muted flex items-center gap-2"
                                  >
                                    <ChevronRight className="h-3 w-3 text-primary-ink" />
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
                              ? "px-4 py-2 border border-primary/40 rounded-xl text-primary-ink font-semibold transition-all duration-300 disabled:opacity-50 hover:bg-primary/10"
                              : "px-4 py-2 bg-gradient-to-r from-primary to-lime hover:from-lime hover:to-primary rounded-xl text-white font-semibold transition-all duration-300 disabled:opacity-50 shadow-card shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
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
              <p className="text-xs text-muted">Couldn&apos;t load which of your targets each step closes gaps for.</p>
            )}
            {steps.length === 0 && (
              <p className="text-muted">This roadmap has no steps yet.</p>
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
                  className="backdrop-blur-xl bg-gradient-to-br from-panel/80 via-soft/60 to-panel/80 border-2 border-primary/20 hover:border-primary/40 rounded-3xl p-6 shadow-xl shadow-primary/5 hover:shadow-primary/10 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/20 text-primary-ink rounded-2xl">
                      <Target className="h-6 w-6" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="font-semibold text-lg text-white">
                        {milestone.title}
                      </h3>
                      <p className="text-muted leading-relaxed">
                        {milestone.summary}
                      </p>
                      <div className="px-3 py-1 bg-primary/20 text-primary-ink border border-primary/30 rounded-full text-xs w-fit">
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
                  className="backdrop-blur-xl bg-gradient-to-br from-panel/80 via-soft/60 to-panel/80 border-2 border-primary/20 hover:border-primary/40 rounded-3xl p-6 transition-all duration-300 shadow-xl shadow-primary/5 hover:shadow-primary/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/20 text-primary-ink rounded-2xl">
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
                            className="flex items-center gap-2 text-muted"
                          >
                            <ChevronRight className="h-3 w-3 text-primary-ink" />
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary-ink transition"
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