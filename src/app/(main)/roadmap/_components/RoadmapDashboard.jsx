"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Target,
  CheckCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Brain,
  Zap,
  Calendar,
  ChevronRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import CreateRoadmapModal from "./CreateRoadmapModal";
import RoadmapCard from "./RoadmapCard";

const RoadmapDashboard = ({ roadmaps }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeRoadmaps = roadmaps.filter((r) => r.status === "active");
  const completedRoadmaps = roadmaps.filter((r) => r.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20 text-white py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/20 backdrop-blur-xl mb-6">
            <Sparkles className="h-4 w-4 text-orange-400 mr-2" />
            <span className="text-sm font-medium text-orange-300">AI-Powered Career Planning</span>
            <Brain className="h-4 w-4 text-rose-400 ml-2" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
            Your Career Journey
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Transform your career with personalized AI-powered roadmaps
          </p>

          <motion.button
            onClick={() => setShowCreateModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 rounded-2xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Roadmap
            <ArrowRight className="ml-2 h-5 w-5" />
          </motion.button>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-blue-400" />
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-300">{activeRoadmaps.length}</div>
                <div className="text-sm text-blue-400">Active Roadmaps</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-300">{completedRoadmaps.length}</div>
                <div className="text-sm text-emerald-400">Completed</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-amber-400" />
              <div className="text-right">
                <div className="text-3xl font-bold text-amber-300">
                  {roadmaps.length > 0
                    ? Math.round(roadmaps.reduce((acc, r) => acc + r.progress, 0) / roadmaps.length)
                    : 0}%
                </div>
                <div className="text-sm text-amber-400">Avg Progress</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Active Roadmaps */}
        {activeRoadmaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Zap className="h-6 w-6 text-orange-400 mr-3" />
              Active Roadmaps
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence>
                {activeRoadmaps.map((roadmap, index) => (
                  <motion.div
                    key={roadmap.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <RoadmapCard roadmap={roadmap} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Completed Roadmaps */}
        {completedRoadmaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Star className="h-6 w-6 text-yellow-400 mr-3" />
              Completed Roadmaps
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence>
                {completedRoadmaps.map((roadmap, index) => (
                  <motion.div
                    key={roadmap.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <RoadmapCard roadmap={roadmap} completed />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {roadmaps.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-8"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-orange-500/20 to-rose-500/20 flex items-center justify-center border border-orange-500/30">
                <Target className="h-12 w-12 text-orange-400" />
              </div>
            </motion.div>
            <h3 className="text-3xl font-semibold text-gray-300 mb-4">
              No roadmaps yet
            </h3>
            <p className="text-gray-500 mb-8 text-lg">
              Create your first career roadmap to start your journey
            </p>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-600 via-rose-600 to-orange-600 hover:from-orange-500 hover:via-rose-500 hover:to-orange-500 rounded-2xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Roadmap
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Create Roadmap Modal */}
      <CreateRoadmapModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default RoadmapDashboard;