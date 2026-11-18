"use client";

import { useState } from "react";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { computeMatch } from "@/actions/Resume";
import { generationErrorMessage } from "@/components/shared/generationError";

export const SECTION_CLASS = "border border-border bg-panel rounded-xl p-8 shadow-card";
export const HEADING_CLASS =
  "text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-6 flex items-center gap-3";
export const LABEL_CLASS = "text-[10px] font-bold tracking-widest uppercase text-muted-foreground";

export function TermList({ terms, tone }) {
  if (!terms?.length) return <p className="text-xs text-muted-foreground">None</p>;
  const cls =
    tone === "match"
      ? "border-primary/30 bg-primary/5 text-foreground"
      : "border-destructive/30 bg-destructive/5 text-destructive";
  return (
    <div className="flex flex-wrap gap-2">
      {terms.map((t) => (
        <span key={t} className={`px-2 py-1 border rounded-xl text-[10px] font-medium tracking-wide ${cls}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

/** Shows one computeMatch result. termCount 0 means no recognised skills (not "0%"). */
export function MatchResult({ match, title }) {
  if (!match) return null;
  return (
    <div className="space-y-4">
      {title && <p className={LABEL_CLASS}>{title}</p>}
      {match.termCount === 0 ? (
        <p className="text-sm text-muted-foreground">No recognised skills found in this job description.</p>
      ) : (
        <>
          <p className="text-4xl font-clash font-bold text-primary-ink">{match.percent}%</p>
          <div className="space-y-2">
            <p className={LABEL_CLASS}>Matched ({match.matched.length})</p>
            <TermList terms={match.matched} tone="match" />
          </div>
          <div className="space-y-2">
            <p className={LABEL_CLASS}>Missing ({match.missing.length})</p>
            <TermList terms={match.missing} tone="miss" />
          </div>
        </>
      )}
    </div>
  );
}

export default function MatchCard({ getResumeLike }) {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!jd.trim()) {
      setError("Paste a job description first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await computeMatch({ jobDescription: jd, resume: getResumeLike() });
      if (!res || res.error) {
        setMatch(null);
        setError(generationErrorMessage(res));
      } else {
        setMatch(res);
      }
    } catch (e) {
      setError("We couldn't compute the match. Please try again.");
      toast.error(e?.message || "Match failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={SECTION_CLASS}>
      <h3 className={HEADING_CLASS}>
        <Target className="h-4 w-4 text-primary-ink" />
        Job match
      </h3>
      <div className="space-y-4">
        <Textarea
          rows={5}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste a job description to see how many of its skills your resume covers..."
        />
        <div className="flex items-center gap-4 flex-wrap">
          <Button type="button" onClick={run} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Target className="h-4 w-4 mr-2" />}
            Check match
          </Button>
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            Computed from keywords, not AI. Uses your current form.
          </span>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <MatchResult match={match} />
      </div>
    </div>
  );
}
