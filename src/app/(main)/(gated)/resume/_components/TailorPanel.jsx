"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SourceChips from "@/components/shared/SourceChips";
import { generationErrorMessage } from "@/components/shared/generationError";
import { tailorResume, saveTailoredVersion } from "@/actions/Resume";
import { MatchResult, SECTION_CLASS, HEADING_CLASS, LABEL_CLASS } from "./MatchCard";

const SKIP_REASONS = {
  UNKNOWN: "no longer available",
  RESUME_CHANGED: "that line changed in your resume",
  FAILED_CHECK: "it failed the safety check",
};

export default function TailorPanel({ ensureSaved, onSaved }) {
  const [form, setForm] = useState({ jobTitle: "", companyName: "", jobDescription: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(null);
  const [decisions, setDecisions] = useState({}); // proposalId -> "accepted" | "struck"
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleTailor = async () => {
    if (!form.jobDescription.trim()) {
      setError("Paste the job description first.");
      return;
    }
    setLoading(true);
    setError("");
    setSaved(null);
    setDraft(null);
    try {
      // Proposals are built from the SAVED resume, so save the form first.
      if (!(await ensureSaved())) return;
      const res = await tailorResume({
        jobTitle: form.jobTitle.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        jobDescription: form.jobDescription,
      });
      if (!res || res.error) {
        setError(generationErrorMessage(res));
        return;
      }
      setDraft(res);
      setDecisions({});
      setLabel(
        [res.jobTitle, res.companyName].filter(Boolean).join(" at ") || "Tailored resume"
      );
    } catch {
      setError("Something went wrong while tailoring. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const decide = (id, value) =>
    setDecisions((d) => ({ ...d, [id]: d[id] === value ? undefined : value }));

  const accepted = draft ? draft.proposals.filter((p) => decisions[p.proposalId] === "accepted") : [];

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await saveTailoredVersion({
        draftId: draft.draftId,
        acceptedProposalIds: accepted.map((p) => p.proposalId),
        label: label.trim() || undefined,
      });
      if (!res || res.error) {
        setError(generationErrorMessage(res));
        return;
      }
      setSaved(res);
      setDraft(null);
      toast.success("Tailored version saved. Your main resume is unchanged.");
      onSaved?.();
    } catch {
      setError("We couldn't save the version. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setDraft(null);
    setSaved(null);
    setError("");
  };

  return (
    <div className={SECTION_CLASS}>
      <h3 className={HEADING_CLASS}>
        <Sparkles className="h-4 w-4 text-accent" />
        Tailor to a job
      </h3>

      {!draft && !saved && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Job title (optional)" value={form.jobTitle} onChange={set("jobTitle")} maxLength={200} />
            <Input placeholder="Company (optional)" value={form.companyName} onChange={set("companyName")} maxLength={200} />
          </div>
          <Textarea
            rows={6}
            value={form.jobDescription}
            onChange={set("jobDescription")}
            placeholder="Paste the job description. The AI proposes edits to your existing bullets; you accept or strike each one."
          />
          <div className="flex items-center gap-4 flex-wrap">
            <Button type="button" onClick={handleTailor} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {loading ? "Tailoring..." : "Suggest edits"}
            </Button>
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
              Saves your form first. Your main resume is never changed here.
            </span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive mt-4">{error}</p>}

      {draft && (
        <div className="space-y-6">
          <MatchResult match={draft.matchBefore} title="Match before" />
          <ul className="space-y-4">
            {draft.proposals.map((p) => {
              const d = decisions[p.proposalId];
              return (
                <li
                  key={p.proposalId}
                  className={`border rounded-sm p-4 space-y-3 ${
                    d === "accepted" ? "border-accent" : d === "struck" ? "border-divider opacity-50" : "border-divider"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className={LABEL_CLASS}>Original</p>
                      <p className={`text-sm mt-1 ${d === "accepted" ? "line-through text-muted-foreground" : ""}`}>{p.original}</p>
                    </div>
                    <div>
                      <p className={LABEL_CLASS}>Proposed</p>
                      <p className="text-sm mt-1 text-foreground">{p.proposed}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{p.reason}</p>
                  <SourceChips sources={p.sources} />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant={d === "accepted" ? "default" : "outline"} onClick={() => decide(p.proposalId, "accepted")}>
                      <Check className="h-3 w-3 mr-2" /> Accept
                    </Button>
                    <Button type="button" size="sm" variant={d === "struck" ? "destructive" : "outline"} onClick={() => decide(p.proposalId, "struck")}>
                      <X className="h-3 w-3 mr-2" /> Strike
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="space-y-3 border-t border-divider pt-6">
            <Input placeholder="Version label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={120} />
            <div className="flex items-center gap-4 flex-wrap">
              <Button type="button" onClick={handleSave} disabled={saving || accepted.length === 0}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save as version ({accepted.length} accepted)
              </Button>
              <Button type="button" variant="ghost" onClick={reset} disabled={saving}>
                Discard
              </Button>
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                Unmarked edits are left out. Nothing is applied until you restore the version.
              </span>
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div className="space-y-6">
          <p className="text-sm text-foreground">
            Saved &quot;{saved.label}&quot; with {saved.applied.length} edit{saved.applied.length === 1 ? "" : "s"}. Your
            main resume was not changed; restore the version from the list below to use it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MatchResult match={saved.matchBefore} title="Match before" />
            <MatchResult match={saved.matchAfter} title="Match after" />
          </div>
          {saved.skipped?.length > 0 && (
            <div className="border border-destructive/30 bg-destructive/5 rounded-sm p-4 space-y-1">
              <p className={LABEL_CLASS}>Skipped ({saved.skipped.length})</p>
              {saved.skipped.map((s) => (
                <p key={s.proposalId} className="text-xs text-muted-foreground">
                  Edit {s.proposalId} was skipped: {SKIP_REASONS[s.reason] || s.reason}.
                </p>
              ))}
            </div>
          )}
          <Button type="button" variant="outline" onClick={reset}>
            Tailor for another job
          </Button>
        </div>
      )}
    </div>
  );
}
