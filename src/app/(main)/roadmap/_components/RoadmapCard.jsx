"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Target,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  Star,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const RoadmapCard = ({ roadmap, completed = false }) => {
  console.log("🧭 RoadmapCard received:", roadmap);

  const completedSteps = roadmap.steps?.filter((step) => step.completed).length || 0;
  const totalSteps = roadmap.steps?.length || 0;

  const getProgressColor = (progress) => {
    if (progress >= 70) return "from-emerald-500/20 to-green-500/20 border-emerald-500/30";
    if (progress >= 50) return "from-blue-500/20 to-cyan-500/20 border-blue-500/30";
    if (progress >= 30) return "from-amber-500/20 to-yellow-500/20 border-amber-500/30";
    return "from-rose-500/20 to-red-500/20 border-rose-500/30";
  };

  const getScoreColor = (progress) => {
    if (progress >= 70) return "text-emerald-400";
    if (progress >= 50) return "text-blue-400";
    if (progress >= 30) return "text-amber-400";
    return "text-rose-400";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "paused":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "completed":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  // ✅ Safely extract duration
  const duration =
    roadmap.timeline?.estimatedDuration ||
    `${totalSteps > 0 ? totalSteps * 2 : "N/A"} months`;

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }} className="group">
      <div
        className={`backdrop-blur-xl bg-gradient-to-br ${getProgressColor(
          roadmap.progress
        )} border-2 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2 flex-1">
            <h3 className="text-xl font-bold text-white group-hover:text-orange-300 transition-colors">
              {roadmap.currentRole} → {roadmap.targetRole}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-slate-800/50 border border-orange-500/30 rounded-full text-xs text-orange-300">
                {roadmap.industry}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs border capitalize ${getStatusColor(
                  roadmap.status
                )}`}
              >
                {roadmap.status}
              </span>
            </div>
          </div>
          {completed && <Star className="h-6 w-6 text-yellow-400 flex-shrink-0" />}
        </div>

        {/* Progress Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Progress</span>
            <span className={`font-bold text-lg ${getScoreColor(roadmap.progress)}`}>
              {Math.round(roadmap.progress)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-slate-800/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${roadmap.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${
                roadmap.progress >= 70
                  ? "from-emerald-500 to-green-500"
                  : roadmap.progress >= 50
                  ? "from-blue-500 to-cyan-500"
                  : roadmap.progress >= 30
                  ? "from-amber-500 to-yellow-500"
                  : "from-rose-500 to-red-500"
              }`}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              {completedSteps}/{totalSteps} steps completed
            </span>
            {/* ✅ Fixed timeline display */}
            <span>{duration} timeline</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="backdrop-blur-xl bg-slate-800/30 border border-blue-500/20 rounded-2xl p-3 text-center">
            <Target className="h-5 w-5 text-blue-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-300">
              {roadmap.milestones?.length || 0}
            </div>
            <div className="text-xs text-blue-400">Milestones</div>
          </div>

          <div className="backdrop-blur-xl bg-slate-800/30 border border-emerald-500/20 rounded-2xl p-3 text-center">
            <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-emerald-300">{completedSteps}</div>
            <div className="text-xs text-emerald-400">Done</div>
          </div>

          <div className="backdrop-blur-xl bg-slate-800/30 border border-purple-500/20 rounded-2xl p-3 text-center">
            <TrendingUp className="h-5 w-5 text-purple-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-purple-300">
              {roadmap.resources?.length || 0}
            </div>
            <div className="text-xs text-purple-400">Resources</div>
          </div>
        </div>

        {/* Timeline Info */}
        <div className="flex items-center gap-3 p-3 backdrop-blur-xl bg-slate-800/30 border border-orange-500/20 rounded-2xl mb-4">
          <Calendar className="h-4 w-4 text-orange-400 flex-shrink-0" />
          <div className="text-sm text-gray-300">
            Created{" "}
            {formatDistanceToNow(new Date(roadmap.createdAt), {
              addSuffix: true,
            })}
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/roadmap/${roadmap.id}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 text-white py-3 px-4 rounded-2xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 flex items-center justify-center group"
          >
            <span>{completed ? "View Details" : "Continue Journey"}</span>
            <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
};

export default RoadmapCard;
