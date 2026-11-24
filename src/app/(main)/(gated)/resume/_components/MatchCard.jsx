"use client";

import { useState } from "react";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { computeMatch } from "@/actions/Resume";
import { generationErrorMessage } from "@/components/shared/generationError";

export const SECTION_CLASS = "panel-cozy p-5 sm:p-8";
export const HEADING_CLASS =
  "mb-5 flex items-center gap-2.5 font-doc text-xl text-text";
export const LABEL_CLASS = "text-xs text-muted";

export function TermList({ terms, tone }) {
  if (!terms?.length) return <p className="text-xs text-muted">none</p>;
  const cls =
    tone === "match"
      ? "border-brand/40 bg-brand-soft text-brand-ink"
      : "border-gap-ink/20 bg-gap-soft text-danger";
  return (
    <div className="flex flex-wrap gap-2">
      {terms.map((t) => (
        <span key={t} className={`rounded-[9px] border px-2.5 py-1 text-xs ${cls}`}>
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
        <p className="text-sm text-muted">no recognised skills found in this job description.</p>
      ) : (
        <>
          <p className="font-pixel text-4xl text-brand-ink">{match.percent}%</p>
          <div className="space-y-2">
            <p className={LABEL_CLASS}>matched ({match.matched.length})</p>
            <TermList terms={match.matched} tone="match" />
          </div>
          <div className="space-y-2">
            <p className={LABEL_CLASS}>missing ({match.missing.length})</p>
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
      setError("paste a job description first.");
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
        <Target className="size-4 text-brand-ink" aria-hidden="true" />
        job match
      </h3>
      <div className="space-y-4">
        <Textarea
          rows={5}
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="paste a job description to see how many of its skills your resume covers…"
        />
        <div className="flex items-center gap-4 flex-wrap">
          <Button type="button" variant="ink" onClick={run} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
            check match
          </Button>
          <span className="text-xs text-muted">
            computed from keywords, not ai. uses your current form.
          </span>
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <MatchResult match={match} />
      </div>
    </div>
  );
}
