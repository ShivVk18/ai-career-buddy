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
        toast.success("undone");
      } else {
        toast.success(done ? "step done" : "step marked not done", {
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
        return "bg-gap-soft text-gap-ink";
      case "medium":
        return "bg-warn-soft text-warn-ink";
      default:
        return "bg-soft text-muted";
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

  return (
    <div className="min-h-screen bg-bg px-4 py-8 text-text sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={() => router.back()}
            aria-label="back" className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-panel text-text outline-none transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <div>
            <h1 className="font-doc text-2xl leading-tight text-text sm:text-4xl">
              {roadmap.currentRole} → {roadmap.targetRole}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {roadmap.industry} • {roadmap.timeline?.estimatedDuration}
            </p>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel-cozy p-5 sm:p-8"
        >
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-doc text-2xl text-text">
              overall progress
            </h2>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-muted">
                {completedSteps} of {totalSteps} steps done
              </span>
              <span className="font-pixel text-2xl text-brand-ink">
                {Math.round(progress)}%
              </span>
            </div>
            <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="roadmap progress" className="relative h-2 overflow-hidden rounded-full bg-soft">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-brand"
              />
            </div>
          </div>

          {/* Timeline Breakdown */}
          {roadmap.timeline?.phaseBreakdown?.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-medium text-text">
                timeline phases
              </h3>
              <ul className="space-y-3">
                {roadmap.timeline.phaseBreakdown.map((phase, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-muted"
                  >
                    <div className="mt-1.5">
                      <CheckCircle className="size-4 text-brand-ink" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium text-text">{phase.title}</p>
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
          <div className="rounded-full border border-line bg-panel p-1.5">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-transparent p-0">
              <TabsTrigger
                value="steps"
                className="min-h-11 rounded-full text-muted data-[state=active]:bg-ink data-[state=active]:text-ink-foreground data-[state=active]:shadow-none"
              >
                <Zap className="mr-2 size-4" aria-hidden="true" />
                steps
              </TabsTrigger>
              <TabsTrigger
                value="milestones"
                className="min-h-11 rounded-full text-muted data-[state=active]:bg-ink data-[state=active]:text-ink-foreground data-[state=active]:shadow-none"
              >
                <Target className="mr-2 size-4" aria-hidden="true" />
                milestones
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="min-h-11 rounded-full text-muted data-[state=active]:bg-ink data-[state=active]:text-ink-foreground data-[state=active]:shadow-none"
              >
                <BookOpen className="mr-2 size-4" aria-hidden="true" />
                resources
              </TabsTrigger>
            </TabsList>
          </div>

          {/* --- Steps Tab --- */}
          <TabsContent value="steps" className="space-y-4">
            <p className="text-xs text-muted">
              ai estimate: steps are grouped by phase in order, and the roadmap itself is ai generated.
            </p>
            {groups.map((group, gi) => (
            <div key={gi} className="space-y-4">
              {group.title && (
                <div className="pt-2">
                  <h3 className="font-doc text-xl text-text">
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
                    className={`rounded-[20px] border bg-panel p-5 shadow-card transition-colors sm:p-6 ${
                      step.completed ? "border-brand/40" : "border-line hover:border-brand/60"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-1 items-start gap-4">
                        <div
                          className={`grid size-11 shrink-0 place-items-center rounded-[12px] ${
                            step.completed ? "bg-brand-soft text-brand-ink" : "bg-soft text-muted"
                          }`}
                        >
                          {step.completed ? (
                            <CheckCircle className="size-5" aria-hidden="true" />
                          ) : (
                            <IconComponent className="size-5" aria-hidden="true" />
                          )}
                        </div>

                        <div className="space-y-3 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-doc text-lg leading-snug text-text">
                              {step.title}
                            </h3>
                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs lowercase ${getPriorityColor(
                                step.priority
                              )}`}
                            >
                              {step.priority}
                            </span>
                          </div>

                          <p className="text-sm leading-relaxed text-muted">
                            {step.description}
                          </p>

                          {targetsState === "ready" && targets?.[step.id]?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted">
                                closes gaps for
                              </span>
                              {targets[step.id].map((t, ti) => (
                                <span
                                  key={ti}
                                  title={t.jdExcerpt}
                                  className="cursor-help rounded-full bg-brand-soft px-2.5 py-1 text-xs text-brand-ink"
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
                                resources
                              </h4>
                              <ul className="space-y-1">
                                {step.resources.map((resource, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-muted flex items-center gap-2"
                                  >
                                    <ChevronRight className="size-3 text-brand-ink" aria-hidden="true" />
                                    {resource}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pl-[60px] sm:pl-0">
                        <button
                          onClick={() => toggleStep(step.id, !step.completed)}
                          disabled={completingStep !== null}
                          className={
                            step.completed
                              ? "min-h-11 whitespace-nowrap rounded-full border border-line bg-panel px-4 text-sm text-text outline-none transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                              : "min-h-11 whitespace-nowrap rounded-full bg-ink px-5 text-sm text-ink-foreground outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                          }
                        >
                          {completingStep === step.id
                            ? "saving…"
                            : step.completed
                            ? "mark not done"
                            : "complete"}
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
              <p className="text-xs text-muted">couldn&apos;t load which of your targets each step closes gaps for.</p>
            )}
            {steps.length === 0 && (
              <p className="text-sm text-muted">this roadmap has no steps yet.</p>
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
                  className="rounded-[20px] border border-line bg-panel p-5 shadow-card transition-colors hover:border-brand/60 sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-brand-soft text-brand-ink">
                      <Target className="size-5" aria-hidden="true" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="font-doc text-lg leading-snug text-text">
                        {milestone.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted">
                        {milestone.summary}
                      </p>
                      <div className="w-fit rounded-full bg-brand-soft px-3 py-1 text-xs text-brand-ink">
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
                  className="rounded-[20px] border border-line bg-panel p-5 shadow-card transition-colors hover:border-brand/60 sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-brand-soft text-brand-ink">
                      <BookOpen className="size-5" aria-hidden="true" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="font-doc text-lg leading-snug text-text">
                        {resource.category}
                      </h3>
                      <ul className="space-y-2">
                        {resource.items.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-muted"
                          >
                            <ChevronRight className="size-3 text-brand-ink" aria-hidden="true" />
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded text-text underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
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