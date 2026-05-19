"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Target,
  CheckCircle,
  ChevronRight,
  Star,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const RoadmapCard = ({ roadmap, completed = false }) => {
  const completedSteps =
    roadmap.steps?.filter((step) => step.completed).length || 0;
  const totalSteps = roadmap.steps?.length || 0;

  return (
    <div className="group border border-divider bg-background rounded-sm p-8 transition-editorial hover:border-accent">
      {/* Header */}
      <div className="flex flex-col space-y-6 mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-[1px] bg-accent" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
              {completed ? "Completed" : "Career Roadmap"}
            </span>
          </div>
          {completed && <Star className="h-4 w-4 text-accent fill-accent" />}
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl md:text-3xl font-clash font-bold text-foreground uppercase tracking-tight group-hover:text-accent transition-editorial">
            {roadmap.currentRole}{" "}
            <span className="text-muted-foreground/40">→</span>{" "}
            {roadmap.targetRole}
          </h3>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold tracking-widest text-accent bg-accent/5 px-3 py-1 rounded-sm border border-accent/20 uppercase">
              {roadmap.industry}
            </span>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              {roadmap.timeline?.estimatedDuration || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-6 mb-10 pb-10 border-b border-divider/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Progress
          </span>
          <span className="text-lg font-clash font-bold text-foreground">
            {Math.round(roadmap.progress)}%
          </span>
        </div>

        <div className="h-[1px] w-full bg-divider/30 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${roadmap.progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full bg-accent"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          <span>
            {completedSteps} / {totalSteps} steps done
          </span>
          <span className="flex items-center gap-1">
            {completed ? (
              <><CheckCircle className="h-3 w-3 text-accent" /> All done</>
            ) : (
              "In progress"
            )}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            {formatDistanceToNow(new Date(roadmap.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        <Link href={`/roadmap/${roadmap.id}`}>
          <button className="h-12 px-8 border border-divider text-[10px] font-bold tracking-widest uppercase hover:bg-foreground hover:text-background transition-editorial rounded-sm">
            {completed ? "Review" : "Continue"}
          </button>
        </Link>
      </div>
    </div>
  );
};

export default RoadmapCard;