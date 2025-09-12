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
  Calendar,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { completeRoadmapStep } from "@/actions/CareerRoadmap";
import { toast } from "sonner";

const RoadmapDetailView = ({ roadmap }) => {
  const [completingStep, setCompletingStep] = useState(null);
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
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300";
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
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {roadmap.currentRole} → {roadmap.targetRole}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {roadmap.industry} • {roadmap.timeline} month timeline
          </p>
        </div>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </motion.div>
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {completedSteps} of {totalSteps} steps completed
              </span>
              <span className="text-lg font-bold">
                {Math.round(roadmap.progress)}%
              </span>
            </div>
            <Progress value={roadmap.progress} className="h-3" />
            
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {roadmap.steps?.length || 0}
                </div>
                <div className="text-xs text-gray-500">Total Steps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {roadmap.milestones?.length || 0}
                </div>
                <div className="text-xs text-gray-500">Milestones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {roadmap.resources?.length || 0}
                </div>
                <div className="text-xs text-gray-500">Resources</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detailed View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs defaultValue="steps" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
            <TabsTrigger
              value="steps"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md"
            >
              Steps
            </TabsTrigger>
            <TabsTrigger
              value="milestones"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md"
            >
              Milestones
            </TabsTrigger>
            <TabsTrigger
              value="resources"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md"
            >
              Resources
            </TabsTrigger>
          </TabsList>

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
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 ${
                        step.completed
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200"
                          : "bg-white dark:bg-gray-900"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div
                              className={`p-3 rounded-xl ${
                                step.completed
                                  ? "bg-green-200 text-green-700"
                                  : "bg-blue-100 text-blue-600"
                              }`}
                            >
                              {step.completed ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                <IconComponent className="h-5 w-5" />
                              )}
                            </div>

                            <div className="space-y-3 flex-1">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-lg">
                                  {step.title}
                                </h3>
                                <Badge
                                  variant="outline"
                                  className={getPriorityColor(step.priority)}
                                >
                                  {step.priority}
                                </Badge>
                              </div>

                              <p className="text-gray-600 dark:text-gray-300">
                                {step.description}
                              </p>

                              <div className="flex items-center gap-4 text-sm text-gray-500">
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
                                  <h4 className="font-medium text-sm">
                                    Resources:
                                  </h4>
                                  <ul className="space-y-1">
                                    {step.resources.map((resource, i) => (
                                      <li
                                        key={i}
                                        className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"
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

                          <div className="ml-4">
                            {!step.completed && (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteStep(step.id)}
                                disabled={completingStep === step.id}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl"
                              >
                                {completingStep === step.id
                                  ? "Completing..."
                                  : "Complete"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
                          <Target className="h-5 w-5" />
                        </div>
                        <div className="space-y-3 flex-1">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-lg">
                              {milestone.title}
                            </h3>
                            <Badge variant="outline">
                              Month {milestone.targetMonth}
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300">
                            {milestone.description}
                          </p>
                          {milestone.criteria && milestone.criteria.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Criteria:</h4>
                              <ul className="space-y-1">
                                {milestone.criteria.map((criteria, i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"
                                  >
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    {criteria}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {milestone.reward && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                              <p className="text-sm text-green-700 dark:text-green-300">
                                <strong>Reward:</strong> {milestone.reward}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="space-y-3 flex-1">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-lg">
                              {resource.title}
                            </h3>
                            <Badge variant="outline" className="capitalize">
                              {resource.type}
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300">
                            {resource.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {resource.estimatedCost && (
                              <div>Cost: {resource.estimatedCost}</div>
                            )}
                            {resource.timeCommitment && (
                              <div>Time: {resource.timeCommitment}</div>
                            )}
                          </div>
                          {resource.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="rounded-xl"
                            >
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                View Resource
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default RoadmapDetailView;