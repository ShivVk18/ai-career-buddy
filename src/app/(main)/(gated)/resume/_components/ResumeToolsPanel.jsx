"use client";

import { useState } from "react";

import MatchCard from "./MatchCard";
import TailorPanel from "./TailorPanel";
import VersionsPanel from "./VersionsPanel";

// Versions, tailoring and match % for the saved resume (D36, D37).
export default function ResumeToolsPanel({ ensureSaved, getResumeLike }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-8">
      <MatchCard getResumeLike={getResumeLike} />
      <TailorPanel ensureSaved={ensureSaved} onSaved={bump} />
      <VersionsPanel ensureSaved={ensureSaved} refreshKey={refreshKey} onChanged={bump} />
    </div>
  );
}
