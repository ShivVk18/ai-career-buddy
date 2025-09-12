"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MapPin,
  Calendar,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.25, 0.25, 0.75],
      },
    },
  };

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 rounded-3xl p-8"
        variants={itemVariants}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </motion.div>
            
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Career Journey
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg mt-2">
                Transform your career with AI-powered roadmaps
              </p>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-2xl shadow-2xl group"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Roadmap
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={itemVariants}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Active Roadmaps
            </CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {activeRoadmaps.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Completed Roadmaps
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              {completedRoadmaps.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Avg Progress
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {roadmaps.length > 0
                ? Math.round(
                    roadmaps.reduce((acc, r) => acc + r.progress, 0) /
                      roadmaps.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Roadmaps */}
      {activeRoadmaps.length > 0 && (
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            Active Roadmaps
          </h3>
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
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            Completed Roadmaps
          </h3>
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
          className="text-center py-16"
          variants={itemVariants}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            No roadmaps yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first career roadmap to start your journey
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-2xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Roadmap
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* Create Roadmap Modal */}
      <CreateRoadmapModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </motion.div>
  );
};

export default RoadmapDashboard;