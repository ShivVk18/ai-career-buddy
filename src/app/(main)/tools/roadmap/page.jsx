"use client";

import React, { useState } from "react";
import Link from "next/link";
import PipStatus from "@/components/pixel/PipStatus";
import { MOCK_WEEKLY_ROADMAP, MOCK_JOBS } from "@/lib/mock";
import {
  BrainCircuit,
  Check,
  CheckCircle2,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export default function RoadmapToolPage() {
  const [roadmap, setRoadmap] = useState(MOCK_WEEKLY_ROADMAP);

  // Ranked gaps by frequency
  const rankedGaps = [
    { name: "Playwright E2E Testing", frequency: 5, roles: "Razorpay, Swiggy, Zomato, CRED, Meesho" },
    { name: "Web Vitals & INP Profiling", frequency: 4, roles: "Swiggy, Razorpay, Zomato, Groww" },
    { name: "WebSocket Resilient State", frequency: 3, roles: "Groww, Flipkart, KredX" },
    { name: "Headless UI Accessibility (Radix)", frequency: 3, roles: "CRED, Swiggy, Razorpay" },
  ];

  const toggleTask = (weekIdx, taskIdx) => {
    setRoadmap((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const target = copy[weekIdx].tasks[taskIdx];
      target.done = !target.done;
      return copy;
    });
    toast.success("task updated");
  };

  const totalTasks = roadmap.reduce((acc, w) => acc + w.tasks.length, 0);
  const doneTasks = roadmap.reduce(
    (acc, w) => acc + w.tasks.filter((t) => t.done).length,
    0
  );
  const progressPercent = Math.round((doneTasks / totalTasks) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-pixel text-xs text-pip-ink bg-pip-soft px-2.5 py-0.5 rounded-full font-medium">
              tool 05 • career roadmap
            </span>
            <span className="text-xs text-muted">/tools/roadmap</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-text lowercase">
            weekly gap-closing tasks (ranked by frequency)
          </h1>
        </div>

        {/* Overall Progress Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-muted block">overall progress:</span>
            <span className="font-pixel text-sm font-bold text-pip">
              {doneTasks} of {totalTasks} tasks done ({progressPercent}%)
            </span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-pip flex items-center justify-center font-pixel text-xs text-pip-ink font-bold">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Center: Work Area (Weekly Task Blocks) */}
        <div className="lg:col-span-8 space-y-5">
          {roadmap.map((weekItem, wIdx) => {
            const isCompleted = weekItem.tasks.every((t) => t.done);

            return (
              <div
                key={wIdx}
                className={`panel-cozy p-6 bg-white border transition-all ${
                  isCompleted
                    ? "border-pip/40 bg-white"
                    : "border-[#ECEAE4] hover:border-pip/30"
                }`}
              >
                {/* Week Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ECEAE4] pb-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-pixel text-xs font-bold text-pip">
                        {weekItem.week}
                      </span>
                      <span className="text-xs text-muted">•</span>
                      <h2 className="font-semibold text-sm text-text lowercase">
                        {weekItem.title}
                      </h2>
                    </div>
                    <span className="text-xs text-muted">
                      focus gap: <strong className="text-text font-medium">{weekItem.gap}</strong>
                    </span>
                  </div>

                  {/* Which target job gaps this closes */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-pixel text-[10px] text-muted">
                      closes gaps for:
                    </span>
                    {weekItem.closedFor.map((comp, cIdx) => (
                      <span
                        key={cIdx}
                        className="font-pixel text-[10px] bg-pip-soft text-pip-ink px-2 py-0.5 rounded"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tasks List with Checkboxes */}
                <div className="space-y-2.5">
                  {weekItem.tasks.map((task, tIdx) => (
                    <div
                      key={tIdx}
                      onClick={() => toggleTask(wIdx, tIdx)}
                      className="p-3 rounded-xl border border-[#ECEAE4] bg-[#FBFAF7]/60 hover:bg-[#FBFAF7] transition flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center transition ${
                            task.done
                              ? "bg-pip text-white"
                              : "border border-[#ECEAE4] bg-white"
                          }`}
                        >
                          {task.done && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span
                          className={`text-xs ${
                            task.done
                              ? "line-through text-muted"
                              : "text-text font-medium"
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>
                      <span className="font-pixel text-[10px] text-muted">
                        {task.done ? "completed" : "pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Quick link to existing database roadmap list */}
          <div className="panel-cozy p-4 bg-[#FBFAF7] border border-[#ECEAE4] flex items-center justify-between text-xs">
            <span className="text-muted">
              need multi-month career milestones or target role switches?
            </span>
            <Link
              href="/roadmap"
              className="text-pip hover:underline flex items-center gap-1 font-medium"
            >
              open roadmap database explorer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Pip's Notes + Gaps Ranked by Frequency */}
        <div className="lg:col-span-4 space-y-5">
          <PipStatus
            step="detective"
            text="pip ranks your gaps strictly by frequency across your 6 target companies. fix playwright testing first to unblock 5 applications."
            size="md"
            className="w-full"
          />

          {/* Gaps Ranked by Frequency */}
          <div className="panel-cozy p-4 sm:p-5 bg-white border border-[#ECEAE4]">
            <div className="flex items-center gap-2 mb-3 border-b border-[#ECEAE4] pb-2">
              <TrendingUp className="w-3.5 h-3.5 text-pip" />
              <span className="font-pixel text-xs text-muted uppercase">
                gaps ranked by frequency
              </span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              {rankedGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#FBFAF7] border border-[#ECEAE4]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-text">
                      #{idx + 1} {gap.name}
                    </span>
                    <span className="font-pixel text-xs font-bold text-pip">
                      {gap.frequency} roles
                    </span>
                  </div>
                  <span className="text-[11px] text-muted block">
                    blocks: {gap.roles}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
