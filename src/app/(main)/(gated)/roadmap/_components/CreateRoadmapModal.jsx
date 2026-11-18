"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Brain, Zap } from "lucide-react";
import { generateCareerRoadmap } from "@/actions/CareerRoadmap";
import { getProfileChips } from "@/actions/Onboarding";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generationErrorMessage } from "@/components/shared/generationError";

const CreateRoadmapModal = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentRole: "",
    targetRole: "",
    industry: "",
    timeline: "",
  });
  const [prefilled, setPrefilled] = useState(false);
  const [editing, setEditing] = useState(false); // "edit details": show the full fields
  const [chipEdit, setChipEdit] = useState(null); // field name being edited in place
  const triedPrefill = useRef(false);
  const router = useRouter();

  // Smart defaults: current role, target role and industry come from the profile. Anything the user already typed wins.
  useEffect(() => {
    if (!open || triedPrefill.current) return;
    triedPrefill.current = true;
    (async () => {
      try {
        const res = await getProfileChips();
        if (!res || res.error) return;
        const role = (res.chips || []).find((c) => c.kind === "role");
        const target = res.targetRole || res.suggestedTargetRole || "";
        const found = {
          currentRole: role?.label || "",
          targetRole: target,
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
      }
    })();
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const roadmap = await generateCareerRoadmap(formData);
      if (!roadmap || roadmap.error || !roadmap.id) {
        toast.error(generationErrorMessage(roadmap));
        return;
      }
      toast.success("Your roadmap is ready! 🎉");
      setFormData({ currentRole: "", targetRole: "", industry: "", timeline: "" });
      triedPrefill.current = false; // prefill again next time it opens
      setPrefilled(false);
      setEditing(false);
      setChipEdit(null);
      onClose();
      router.push(`/roadmap/${roadmap.id}`);
    } catch (error) {
      console.error("Roadmap generation error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const complete = prefilled && ["currentRole", "targetRole", "industry"].every((k) => formData[k].trim());
  const showFields = !complete || editing;
  const CHIPS = [
    { key: "currentRole", label: "Now" },
    { key: "targetRole", label: "Goal" },
    { key: "industry", label: "Industry" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border border-divider bg-background p-0 rounded-sm overflow-hidden shadow-2xl">
        <div className="p-10 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-8 h-[1px] bg-accent" />
              <span className="text-[10px] font-bold tracking-[0.3em] text-accent uppercase">
                AI Career Roadmap
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <DialogTitle asChild>
                <h2 className="text-3xl md:text-5xl font-clash font-bold text-foreground uppercase tracking-tight leading-none">
                  Build Your <span className="text-muted-foreground">Plan</span>
                </h2>
              </DialogTitle>
              <DialogDescription asChild>
                <p className="text-muted-foreground text-sm font-general font-light leading-relaxed max-w-md">
                  Tell us where you are and where you want to go — your AI coach
                  will map out every step to get there.
                </p>
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {prefilled && <p className="text-xs text-muted-foreground">Filled in from your profile. Change anything that isn&apos;t right.</p>}
            {!showFields && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2" aria-label="Details from your profile">
                  {CHIPS.map((c) =>
                    chipEdit === c.key ? (
                      <Input
                        key={c.key}
                        name={c.key}
                        aria-label={c.label}
                        autoFocus
                        value={formData[c.key]}
                        onChange={handleChange}
                        onBlur={() => setChipEdit(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Escape") {
                            e.preventDefault();
                            setChipEdit(null);
                          }
                        }}
                        className="h-11 w-56 rounded-full text-sm"
                      />
                    ) : (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setChipEdit(c.key)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-divider px-4 text-sm text-foreground outline-none hover:border-accent focus-visible:ring-2 focus-visible:ring-accent/50"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{c.label}</span>
                        {formData[c.key]}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="min-h-11 px-2 text-xs text-muted-foreground underline outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/50"
                  >
                    edit details
                  </button>
                </div>
                <Input
                  id="timeline"
                  name="timeline"
                  aria-label="Timeline (optional)"
                  placeholder="Timeline (optional), e.g. 12 months"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="h-11 max-w-xs rounded-full text-sm"
                />
              </div>
            )}
            {showFields && (<>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label
                  htmlFor="currentRole"
                  className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
                >
                  Current Role
                </Label>
                <div className="relative">
                  <Input
                    id="currentRole"
                    name="currentRole"
                    placeholder="e.g. Software Engineer"
                    value={formData.currentRole}
                    onChange={handleChange}
                    required
                    className="h-14 bg-divider/10 border-divider rounded-sm text-foreground placeholder:text-muted-foreground/40 font-general text-sm focus:border-accent transition-editorial"
                  />
                  <Brain className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="targetRole"
                  className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
                >
                  Target Role
                </Label>
                <div className="relative">
                  <Input
                    id="targetRole"
                    name="targetRole"
                    placeholder="e.g. Engineering Manager"
                    value={formData.targetRole}
                    onChange={handleChange}
                    required
                    className="h-14 bg-divider/10 border-divider rounded-sm text-foreground placeholder:text-muted-foreground/40 font-general text-sm focus:border-accent transition-editorial"
                  />
                  <Zap className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label
                  htmlFor="industry"
                  className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
                >
                  Industry
                </Label>
                <Input
                  id="industry"
                  name="industry"
                  placeholder="e.g. Technology, Finance"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  className="h-14 bg-divider/10 border-divider rounded-sm text-foreground placeholder:text-muted-foreground/40 font-general text-sm focus:border-accent transition-editorial"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="timeline"
                  className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
                >
                  Timeline (optional)
                </Label>
                <Input
                  id="timeline"
                  name="timeline"
                  placeholder="e.g. 12 months, 2 years"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="h-14 bg-divider/10 border-divider rounded-sm text-foreground placeholder:text-muted-foreground/40 font-general text-sm focus:border-accent transition-editorial"
                />
              </div>
            </div>

            </>)}

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-14 border-divider text-[10px] font-bold tracking-widest uppercase hover:bg-divider/20 rounded-sm transition-editorial"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-14 text-[10px] font-bold tracking-widest uppercase rounded-sm transition-editorial"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                    Building your roadmap...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-3" />
                    Generate My Roadmap
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoadmapModal;