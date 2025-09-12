"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronRight,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const RoadmapCard = ({ roadmap, completed = false }) => {
  const completedSteps = roadmap.steps.filter((step) => step.completed).length;
  const totalSteps = roadmap.steps.length;
  
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
                {roadmap.currentRole} → {roadmap.targetRole}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {roadmap.industry}
                </Badge>
                <div
                  className={`h-2 w-2 rounded-full ${getStatusColor(
                    roadmap.status
                  )}`}
                />
                <span className="text-xs text-gray-500 capitalize">
                  {roadmap.status}
                </span>
              </div>
            </div>
            {completed && <Star className="h-5 w-5 text-yellow-500" />}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Progress</span>
              <span className="font-semibold">
                {completedSteps}/{totalSteps} steps
              </span>
            </div>
            <Progress
              value={roadmap.progress}
              className="h-2 bg-gray-200 dark:bg-gray-700"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{Math.round(roadmap.progress)}% complete</span>
              <span>
                {roadmap.timeline} month{roadmap.timeline !== 1 ? "s" : ""} timeline
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Target className="h-4 w-4 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {roadmap.milestones?.length || 0}
              </div>
              <div className="text-xs text-blue-600">Milestones</div>
            </div>

            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                {completedSteps}
              </div>
              <div className="text-xs text-green-600">Completed</div>
            </div>

            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <TrendingUp className="h-4 w-4 text-purple-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {roadmap.resources?.length || 0}
              </div>
              <div className="text-xs text-purple-600">Resources</div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Created{" "}
              {formatDistanceToNow(new Date(roadmap.createdAt), {
                addSuffix: true,
              })}
            </div>
          </div>

          {/* Action Button */}
          <Link href={`/roadmap/${roadmap.id}`}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl group">
                <span>
                  {completed ? "View Details" : "Continue Journey"}
                </span>
                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoadmapCard;