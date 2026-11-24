"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import ToolFrame from "@/components/shared/ToolFrame";
import EmptyState from "@/components/ui/EmptyState";
import { Chip } from "@/components/ui/Chip";
import CreateRoadmapModal from "./CreateRoadmapModal";
import RoadmapCard from "./RoadmapCard";
import GapFrequency from "./GapFrequency";

const NEW_BTN = "btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const RoadmapDashboard = ({ roadmaps, gapData, initialOpen = false }) => {
  const [showCreateModal, setShowCreateModal] = useState(initialOpen);

  const activeRoadmaps = roadmaps.filter((r) => r.status === "active");
  const completedRoadmaps = roadmaps.filter((r) => r.status === "completed");
  const avg = roadmaps.length > 0 ? Math.round(roadmaps.reduce((acc, r) => acc + r.progress, 0) / roadmaps.length) : 0;

  return (
    <ToolFrame
      title="career roadmap"
      line="a step-by-step plan from where you are to where you want to be."
      outfit="rocket"
      bare
      action={
        <button type="button" onClick={() => setShowCreateModal(true)} className={NEW_BTN}>
          <Plus className="size-4" aria-hidden="true" /> new roadmap
        </button>
      }
    >
      <div className="space-y-8">
        {roadmaps.length === 0 ? (
          <EmptyState
            outfit="rocket"
            title="no roadmaps yet"
            text="pip fills in your role and goal from your profile. one tap and you have a plan."
            action={
              <button type="button" onClick={() => setShowCreateModal(true)} className={NEW_BTN}>
                <Plus className="size-4" aria-hidden="true" /> make my first roadmap
              </button>
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-2" aria-label="summary">
              <Chip tone="brand" editable={false} value={`${activeRoadmaps.length} active`} />
              <Chip editable={false} value={`${completedRoadmaps.length} completed`} />
              <Chip editable={false} value={`${avg}% average progress`} />
            </div>

            <GapFrequency gapData={gapData} />

            {activeRoadmaps.length > 0 && (
              <section aria-label="in progress" className="space-y-3">
                <h2 className="font-doc text-xl text-text">in progress</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {activeRoadmaps.map((roadmap) => (
                    <RoadmapCard key={roadmap.id} roadmap={roadmap} />
                  ))}
                </div>
              </section>
            )}

            {completedRoadmaps.length > 0 && (
              <section aria-label="completed" className="space-y-3">
                <h2 className="font-doc text-xl text-text">completed</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {completedRoadmaps.map((roadmap) => (
                    <RoadmapCard key={roadmap.id} roadmap={roadmap} completed />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <CreateRoadmapModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </ToolFrame>
  );
};

export default RoadmapDashboard;
