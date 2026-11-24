"use client";

import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";
import { generateCareerRoadmap } from "@/actions/CareerRoadmap";
import { getProfileChips } from "@/actions/Onboarding";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generationErrorMessage } from "@/components/shared/generationError";
import { Chip } from "@/components/ui/Chip";
import PipAvatar from "@/components/ui/PipAvatar";
import PipStatus from "@/components/ui/PipStatus";
import Skeleton from "@/components/ui/Skeleton";
import { ChoiceChips, FieldLabel, InkButton, Note, fieldClass } from "@/components/shared/ToolBits";
import { cn } from "@/lib/utils";

const TIMELINES = [
  ["", "no rush"],
  ["6 months", "6 months"],
  ["12 months", "1 year"],
  ["24 months", "2 years"],
];
const FIELDS = [
  { key: "currentRole", label: "where you are now", placeholder: "software engineer" },
  { key: "targetRole", label: "where you want to be", placeholder: "engineering manager" },
  { key: "industry", label: "industry", placeholder: "technology" },
];

/** `loadProfile` and `generate` can be swapped by dev pages. */
const CreateRoadmapModal = ({ open, onClose, loadProfile = getProfileChips, generate = generateCareerRoadmap, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ currentRole: "", targetRole: "", industry: "", timeline: "" });
  const [phase, setPhase] = useState("idle"); // idle | loading | done
  const [prefilled, setPrefilled] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const triedPrefill = useRef(false);
  const router = useRouter();

  // Smart defaults: current role, target role and industry come from the profile. Anything already typed wins.
  useEffect(() => {
    if (!open || triedPrefill.current) return;
    triedPrefill.current = true;
    setPhase("loading");
    (async () => {
      try {
        const res = await loadProfile();
        if (!res || res.error) return;
        const role = (res.chips || []).find((c) => c.kind === "role");
        const found = {
          currentRole: role?.label || "",
          targetRole: res.targetRole || res.suggestedTargetRole || "",
          industry: res.industry || "",
        };
        setFormData((f) => ({
          ...f,
          currentRole: f.currentRole || found.currentRole,
          targetRole: f.targetRole || found.targetRole,
          industry: f.industry || found.industry,
        }));
        setPrefilled(Object.values(found).some(Boolean));
      } catch {
        // Prefill is a convenience only; the fields stay empty and editable.
      } finally {
        setPhase("done");
      }
    })();
  }, [open, loadProfile]);

  const set = (k, v) => setFormData((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!["currentRole", "targetRole", "industry"].every((k) => formData[k].trim())) {
      setError("add where you are, where you want to be, and your industry.");
      setEditing(true);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const roadmap = await generate(formData);
      if (!roadmap || roadmap.error || !roadmap.id) {
        setError(generationErrorMessage(roadmap));
        return;
      }
      toast.success("your roadmap is ready");
      setFormData({ currentRole: "", targetRole: "", industry: "", timeline: "" });
      triedPrefill.current = false; // prefill again next time it opens
      setPrefilled(false);
      setEditing(false);
      onClose();
      if (onCreated) onCreated(roadmap);
      else router.push(`/roadmap/${roadmap.id}`);
    } catch (err) {
      console.error("Roadmap generation error:", err);
      setError(err?.message || "something went wrong. try again.");
    } finally {
      setLoading(false);
    }
  };

  const complete = prefilled && FIELDS.every((f) => formData[f.key].trim());
  const showFields = !complete || editing;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto rounded-[20px] border border-line bg-panel p-5 shadow-pop sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <PipAvatar outfit="rocket" size="lg" alt="" />
          <div>
            <DialogTitle className="font-doc text-2xl font-normal normal-case tracking-normal text-text">new roadmap</DialogTitle>
            <DialogDescription className="mt-0.5 text-sm text-muted">
              {prefilled ? "filled in from your profile. tap a chip to change it." : "tell pip where you are and where you're headed."}
            </DialogDescription>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {phase === "loading" && (
            <div aria-busy="true" aria-label="reading your profile" className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-8 w-28" />
            </div>
          )}

          {phase !== "loading" && !showFields && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2" aria-label="details from your profile">
                {FIELDS.map((f) => (
                  <span key={f.key} className="inline-flex items-center gap-1.5">
                    <span className="text-xs text-muted">{f.key === "currentRole" ? "now" : f.key === "targetRole" ? "goal" : "industry"}</span>
                    <Chip tone="brand" value={formData[f.key]} onChange={(v) => set(f.key, v)} className="min-h-10" />
                  </span>
                ))}
              </div>
            </div>
          )}

          {phase !== "loading" && showFields && (
            <div className="space-y-4">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <FieldLabel htmlFor={`rm-${f.key}`}>{f.label}</FieldLabel>
                  <input
                    id={`rm-${f.key}`}
                    name={f.key}
                    value={formData[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    autoComplete="off"
                    className={cn(fieldClass, "mt-1.5 h-11")}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <FieldLabel>timeline</FieldLabel>
            <ChoiceChips label="timeline" value={formData.timeline} onChange={(v) => set("timeline", v)} options={TIMELINES} />
          </div>

          {error && <Note tone="error">{error}</Note>}

          {loading ? (
            <PipStatus outfit="rocket" text="building your roadmap, about 20 seconds" />
          ) : (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-line px-6 text-sm text-text outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring"
              >
                cancel
              </button>
              <InkButton type="submit" busy={loading} busyText="building…" disabled={phase === "loading"}>
                <Sparkles className="size-4" aria-hidden="true" /> make my roadmap
              </InkButton>
            </div>
          )}
          {complete && !editing && phase !== "loading" && !loading && (
            <button type="button" onClick={() => setEditing(true)} className="min-h-10 rounded-full text-sm text-muted underline-offset-4 outline-none hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              edit details as text
            </button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoadmapModal;
