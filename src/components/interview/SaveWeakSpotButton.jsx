"use client";

import { useState } from "react";
import { saveWeakSpot } from "@/actions/Track";

const tz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

/** Small "add to monday's plan" button for a topic. Optimistic, rolls back on error. */
export default function SaveWeakSpotButton({ skill }) {
  const [st, setSt] = useState("idle");
  const save = async () => {
    setSt("saved");
    try {
      const res = await saveWeakSpot({ skill: String(skill).slice(0, 80), timeZone: tz() });
      if (res?.error) setSt("error");
    } catch {
      setSt("error");
    }
  };
  if (st === "saved") return <span role="status" className="text-xs text-brand-ink">saved to monday&apos;s plan</span>;
  return (
    <button type="button" onClick={save} className="min-h-9 rounded-full bg-brand-soft px-3 text-xs text-brand-ink outline-none focus-visible:ring-2 focus-visible:ring-brand">
      {st === "error" ? "couldn't save, retry" : "add to monday's plan"}
    </button>
  );
}
