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
    if (progress >= 70) return "from-[#1a1815]/80 to-[#252218]/60 border-[#fbbf24]/30";
    if (progress >= 50) return "from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/30";
    if (progress >= 30) return "from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/25";
    return "from-[#1a1815]/80 to-[#252218]/60 border-[#f59e0b]/20";
  };

  const getScoreColor = (progress) => {
    if (progress >= 70) return "text-[#fbbf24]";
    if (progress >= 50) return "text-[#f59e0b]";
    if (progress >= 30) return "text-[#f59e0b]";
    return "text-[#b0b0b0]";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-[#f59e0b]/20 text-[#fbbf24] border-[#f59e0b]/30";
      case "paused":
        return "bg-[#f59e0b]/15 text-[#fbbf24] border-[#f59e0b]/25";
      case "completed":
        return "bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]/30";
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
        )} border-2 rounded-3xl p-6 shadow-xl shadow-[#f59e0b]/5 hover:shadow-2xl hover:shadow-[#f59e0b]/10 transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2 flex-1">
            <h3 className="text-xl font-bold text-white group-hover:text-[#fbbf24] transition-colors">
              {roadmap.currentRole} → {roadmap.targetRole}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-[#1a1815]/50 border border-[#f59e0b]/30 rounded-full text-xs text-[#fbbf24]">
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
          {completed && <Star className="h-6 w-6 text-[#fbbf24] flex-shrink-0" />}
        </div>

        {/* Progress Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#b0b0b0]">Progress</span>
            <span className={`font-bold text-lg ${getScoreColor(roadmap.progress)}`}>
              {Math.round(roadmap.progress)}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-[#1a1815]/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${roadmap.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#b0b0b0]">
            <span>
              {completedSteps}/{totalSteps} steps completed
            </span>
            {/* ✅ Fixed timeline display */}
            <span>{duration} timeline</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="backdrop-blur-xl bg-[#1a1815]/30 border border-[#f59e0b]/20 rounded-2xl p-3 text-center">
            <Target className="h-5 w-5 text-[#f59e0b] mx-auto mb-1" />
            <div className="text-lg font-bold text-[#fbbf24]">
              {roadmap.milestones?.length || 0}
            </div>
            <div className="text-xs text-[#f59e0b]">Milestones</div>
          </div>

          <div className="backdrop-blur-xl bg-[#1a1815]/30 border border-[#f59e0b]/20 rounded-2xl p-3 text-center">
            <CheckCircle className="h-5 w-5 text-[#f59e0b] mx-auto mb-1" />
            <div className="text-lg font-bold text-[#fbbf24]">{completedSteps}</div>
            <div className="text-xs text-[#f59e0b]">Done</div>
          </div>

          <div className="backdrop-blur-xl bg-[#1a1815]/30 border border-[#f59e0b]/20 rounded-2xl p-3 text-center">
            <TrendingUp className="h-5 w-5 text-[#f59e0b] mx-auto mb-1" />
            <div className="text-lg font-bold text-[#fbbf24]">
              {roadmap.resources?.length || 0}
            </div>
            <div className="text-xs text-[#f59e0b]">Resources</div>
          </div>
        </div>

        {/* Timeline Info */}
        <div className="flex items-center gap-3 p-3 backdrop-blur-xl bg-[#1a1815]/30 border border-[#f59e0b]/20 rounded-2xl mb-4">
          <Calendar className="h-4 w-4 text-[#f59e0b] flex-shrink-0" />
          <div className="text-sm text-[#b0b0b0]">
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
            className="w-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white py-3 px-4 rounded-2xl font-semibold shadow-lg shadow-[#f59e0b]/30 hover:shadow-xl hover:shadow-[#f59e0b]/40 transition-all duration-300 flex items-center justify-center group"
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