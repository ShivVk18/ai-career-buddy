"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Target,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Zap,
  Star,
} from "lucide-react";
import CreateRoadmapModal from "./CreateRoadmapModal";
import RoadmapCard from "./RoadmapCard";

const RoadmapDashboard = ({ roadmaps }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const activeRoadmaps = roadmaps.filter((r) => r.status === "active");
  const completedRoadmaps = roadmaps.filter((r) => r.status === "completed");

  return (
    <div className="min-h-screen bg-transparent py-14 px-6 md:px-12">
      <div className="relative z-10 max-w-7xl mx-auto space-y-16">

        {/* Header */}
        <div className="mb-20 border-b border-divider pb-16">
          <div className="flex flex-col lg:flex-row gap-12 items-start lg:items-center justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-[1px] bg-accent" />
                <span className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
                  Career Planning
                </span>
              </div>

              <h1 className="text-5xl md:text-8xl font-clash font-bold text-foreground uppercase tracking-tight leading-[0.9] mb-8">
                Your Career{" "}
                <span className="text-accent underline decoration-1 underline-offset-8">
                  Roadmaps
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl font-general font-light leading-relaxed">
                AI-generated, step-by-step plans to get you from where you are
                to where you want to be — at your own pace.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="group inline-flex items-center h-20 px-12 bg-accent text-accent-foreground rounded-sm font-clash font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-editorial text-sm"
            >
              <Plus className="h-5 w-5 mr-4 group-hover:rotate-90 transition-editorial" />
              New Roadmap
              <ArrowRight className="ml-4 h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="border border-divider bg-divider/10 p-10 rounded-sm group hover:border-accent transition-editorial">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Target className="h-6 w-6 text-accent" />
                <div className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                  Active Roadmaps
                </div>
              </div>
              <div className="text-5xl md:text-6xl font-clash font-bold text-foreground">
                {activeRoadmaps.length}
              </div>
            </div>
          </div>

          <div className="border border-divider bg-divider/10 p-10 rounded-sm group hover:border-accent transition-editorial">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CheckCircle className="h-6 w-6 text-accent" />
                <div className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                  Completed
                </div>
              </div>
              <div className="text-5xl md:text-6xl font-clash font-bold text-foreground">
                {completedRoadmaps.length}
              </div>
            </div>
          </div>

          <div className="border border-divider bg-divider/10 p-10 rounded-sm group hover:border-accent transition-editorial">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <TrendingUp className="h-6 w-6 text-accent" />
                <div className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                  Avg. Progress
                </div>
              </div>
              <div className="text-5xl md:text-6xl font-clash font-bold text-foreground">
                {roadmaps.length > 0
                  ? Math.round(
                      roadmaps.reduce((acc, r) => acc + r.progress, 0) /
                        roadmaps.length
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>

        {/* Active Roadmaps */}
        {activeRoadmaps.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-[10px] font-bold tracking-[0.4em] text-accent uppercase mb-12 flex items-center gap-4">
              <Zap className="h-4 w-4" />
              In Progress
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <AnimatePresence>
                {activeRoadmaps.map((roadmap, index) => (
                  <motion.div
                    key={roadmap.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <RoadmapCard roadmap={roadmap} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Completed Roadmaps */}
        {completedRoadmaps.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-[10px] font-bold tracking-[0.4em] text-muted-foreground uppercase mb-12 flex items-center gap-4">
              <Star className="h-4 w-4" />
              Completed
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <AnimatePresence>
                {completedRoadmaps.map((roadmap, index) => (
                  <motion.div
                    key={roadmap.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <RoadmapCard roadmap={roadmap} completed={true} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty State */}
        {roadmaps.length === 0 && (
          <div className="text-center py-40 border border-divider border-dashed rounded-sm bg-divider/5">
            <div className="w-24 h-24 mx-auto rounded-sm border border-divider flex items-center justify-center bg-background mb-10 group hover:border-accent transition-editorial">
              <Target className="h-10 w-10 text-muted-foreground group-hover:text-accent transition-editorial" />
            </div>
            <h3 className="text-2xl md:text-4xl font-clash font-bold text-foreground uppercase tracking-tight mb-6">
              No Roadmaps Yet
            </h3>
            <p className="text-muted-foreground mb-12 max-w-md mx-auto font-general font-light leading-relaxed">
              Create your first AI-powered career roadmap and get a clear,
              actionable plan to reach your next role.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center h-16 px-12 bg-accent text-accent-foreground rounded-sm font-clash font-bold uppercase tracking-[0.2em] hover:brightness-110 transition-editorial text-xs"
            >
              <Plus className="h-4 w-4 mr-4" />
              Create My First Roadmap
            </button>
          </div>
        )}
      </div>

      <CreateRoadmapModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default RoadmapDashboard;