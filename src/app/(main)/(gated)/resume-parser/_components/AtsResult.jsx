'use client'

import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Loader, Wand2, RotateCcw, XCircle, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import SourceChips, { LegacySourcesLabel } from "@/components/shared/SourceChips";
import { generationErrorMessage } from "@/components/shared/generationError";
import DeleteAtsButton from "./DeleteAtsButton";
import { proposeAtsFix, applyAtsFix } from "@/actions/ResumeParser";
import { WEIGHT_GROUPS, weightsForLevel } from "@/lib/ats/weights";

const SECTION = "border border-border bg-background p-10 rounded-sm mb-12 shadow-sm";
const H3 = "text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center gap-3";

// Evidence list for one strength/weakness/recommendation (or the legacy label)
export const EvidenceList = ({ item, legacy }) => {
  if (legacy) return <LegacySourcesLabel className="mt-2" />;
  const sources = item?.sources;
  if (!Array.isArray(sources) || sources.length === 0) return null;
  const quotes = sources.filter((x) => x.type === "resume_quote");
  const jd = sources.filter((x) => x.type === "jd");
  return (
    <div className="mt-2 space-y-2">
      {quotes.map((q, i) => (
        <p key={i} className="text-xs italic text-muted-foreground border-l-2 border-accent/40 pl-3">
          From your resume: &quot;{q.quote}&quot;
        </p>
      ))}
      <SourceChips sources={jd} />
    </div>
  );
};

const getScoreColor = (score) => {
  if (score >= 90) return 'text-accent';
  if (score >= 80) return 'text-accent/80';
  if (score >= 70) return 'text-accent/60';
  return 'text-destructive';
};

function RequirementChecklist({ result }) {
  const reqs = result.evidence?.requirements;
  if (!result.evidence) return null; // legacy: labelled elsewhere
  return (
    <div className={SECTION}>
      <h3 className={H3}>
        <span className="w-4 h-[1px] bg-accent"></span>
        Requirement Checklist
      </h3>
      {!Array.isArray(reqs) || reqs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No requirement checklist was recorded for this result. Run a new scan to get one.
        </p>
      ) : (
        <ul className="space-y-4">
          {reqs.map((r, i) => (
            <li key={i} className="text-sm font-general flex items-start gap-4">
              {r.status === "matched" ? (
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-foreground">
                  {r.requirement}{' '}
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${r.status === "matched" ? "text-accent" : "text-destructive"}`}>
                    {r.status === "matched" ? "Matched" : "Gap"}
                  </span>
                </p>
                <EvidenceList item={r} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LevelAndWeights({ result }) {
  const level = result.candidateLevel;
  const active = weightsForLevel(level);
  return (
    <div className={SECTION}>
      <h3 className={H3}>
        <span className="w-4 h-[1px] bg-accent"></span>
        Candidate Level and Scoring Weights
      </h3>
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Detected level</span>
        {level ? (
          <span className="px-3 py-1 border border-accent/30 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest rounded-sm">
            {level}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not recorded for this result</span>
        )}
        {result.candidateYears != null && (
          <span className="text-xs text-muted-foreground">
            {result.candidateYears} {result.candidateYears === 1 ? "year" : "years"} exp
          </span>
        )}
      </div>
      {level && !active && (
        <p className="text-xs text-muted-foreground mb-6">
          We don&apos;t recognise this level, so no weights are highlighted.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(WEIGHT_GROUPS).map(([key, g]) => {
          const isActive = active && active.label === g.label;
          return (
            <div key={key} className={`border rounded-sm p-5 ${isActive ? "border-accent bg-accent/5" : "border-divider opacity-70"}`}>
              <p className="text-[10px] font-bold tracking-widest uppercase text-foreground mb-4">
                {g.label} {isActive && <span className="text-accent">(applied)</span>}
              </p>
              <ul className="space-y-3">
                {g.weights.map((w) => (
                  <li key={w.key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{w.key}</span>
                      <span className="text-muted-foreground">{w.value}%</span>
                    </div>
                    <div className="h-1 bg-divider rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${w.value}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// One weakness: Propose fix -> show proposal -> Accept (real re-score) -> before/after.
function WeaknessFix({ scoreId, index, hasResumeText, resumePurged, onOpenScore, onRerun }) {
  const [state, setState] = useState({ phase: "idle" }); // idle | proposing | proposed | applying | applied | error

  if (!hasResumeText) {
    return (
      <div className="mt-3 text-xs text-muted-foreground space-y-2">
        <Button type="button" variant="outline" size="sm" disabled>
          <Wand2 className="w-3 h-3 mr-2" /> Propose fix
        </Button>
        <p>
          {resumePurged
            ? "Resume text is removed after 90 days; re-upload to use fixes."
            : generationErrorMessage({ code: "NEEDS_REUPLOAD" })}
        </p>
        {onRerun && (
          <Button type="button" variant="outline" size="sm" onClick={onRerun}>
            <RotateCcw className="w-3 h-3 mr-2" /> Re-run with this job
          </Button>
        )}
      </div>
    );
  }

  const propose = async () => {
    setState({ phase: "proposing" });
    try {
      const res = await proposeAtsFix(scoreId, index);
      if (!res || res.error) setState({ phase: "error", message: generationErrorMessage(res), stage: "idle" });
      else setState({ phase: "proposed", proposal: res });
    } catch {
      setState({ phase: "error", message: "Something went wrong. Please try again.", stage: "idle" });
    }
  };

  const apply = async () => {
    const proposal = state.proposal;
    setState({ phase: "applying", proposal });
    try {
      const res = await applyAtsFix(scoreId, proposal.fixId);
      if (res?.code === "ALREADY_APPLIED" && res.newScoreId) {
        setState({ phase: "already", message: generationErrorMessage(res), newScoreId: res.newScoreId, proposal });
        onOpenScore(res.newScoreId);
      } else if (res?.code === "INVALID") {
        setState({ phase: "error", message: "This proposed fix is out of date. Please propose the fix again.", stage: "idle" });
      } else if (!res || res.error) setState({ phase: "error", message: generationErrorMessage(res), stage: "proposed", proposal });
      else setState({ phase: "applied", outcome: res, proposal });
    } catch {
      setState({ phase: "error", message: "Something went wrong. Please try again.", stage: "proposed", proposal });
    }
  };

  const { phase, proposal, outcome, message, newScoreId } = state;
  return (
    <div className="mt-3 space-y-3">
      {(phase === "idle" || phase === "proposing" || (phase === "error" && !proposal)) && (
        <Button type="button" variant="outline" size="sm" onClick={propose} disabled={phase === "proposing"}>
          {phase === "proposing" ? <Loader className="w-3 h-3 mr-2 animate-spin" /> : <Wand2 className="w-3 h-3 mr-2" />}
          {phase === "proposing" ? "Proposing..." : "Propose fix"}
        </Button>
      )}
      {proposal && phase !== "applied" && (
        <div className="border border-divider rounded-sm p-4 space-y-3 bg-divider/5">
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Original</p>
            <p className="text-xs text-muted-foreground line-through">{proposal.original}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Proposed</p>
            <p className="text-sm text-foreground">{proposal.proposed}</p>
          </div>
          <EvidenceList item={{ sources: proposal.sources }} />
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Accepting re-scores the analyzed text with this change. Your saved resume is not changed.
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={apply} disabled={phase === "applying"}>
              {phase === "applying" && <Loader className="w-3 h-3 mr-2 animate-spin" />}
              {phase === "applying" ? "Re-scoring..." : "Accept and re-score"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setState({ phase: "idle" })} disabled={phase === "applying"}>
              Dismiss
            </Button>
          </div>
        </div>
      )}
      {phase === "applied" && outcome && (
        <div className="border border-accent/40 rounded-sm p-4 space-y-3 bg-accent/5">
          <p className="text-[10px] font-bold tracking-widest uppercase text-accent">Re-scored</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p>ATS score: {outcome.before.atsScore} <ArrowRight className="inline w-3 h-3" /> <strong>{outcome.after.atsScore}</strong></p>
            <p>Job match: {outcome.before.matchPercentage}% <ArrowRight className="inline w-3 h-3" /> <strong>{outcome.after.matchPercentage}%</strong></p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenScore(outcome.newScoreId)}>
            Open new result
          </Button>
        </div>
      )}
      {phase === "already" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{message}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => onOpenScore(newScoreId)}>
            Open result
          </Button>
        </div>
      )}
      {phase === "error" && <p className="text-xs text-destructive">{message}</p>}
    </div>
  );
}

export default function AtsResult({ result, onScanAnother, onRerun, onOpenScore, onDeleted, onRestored }) {
  const legacy = !result.evidence;
  const fix = result.evidence?.appliedFix;
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="border border-border bg-background p-10 rounded-sm mb-12 shadow-xl">
        <h2 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-10 flex items-center gap-3">
          <span className="w-4 h-[1px] bg-divider"></span>
          Scan Results
        </h2>

        {result.id && onDeleted && (
          <div className="-mt-6 mb-6 flex justify-end">
            <DeleteAtsButton scoreId={result.id} onDeleted={onDeleted} onRestored={onRestored} variant="outline" />
          </div>
        )}

        {(result.companyName || result.jobTitle) && (
          <p className="text-sm text-muted-foreground mb-6">
            {[result.jobTitle, result.companyName].filter(Boolean).join(" at ")}
          </p>
        )}
        {legacy && <LegacySourcesLabel className="mb-6" />}
        {result.previousScoreId && (
          <p className="text-xs text-muted-foreground mb-6">
            This is a re-score after an accepted fix.{' '}
            <button type="button" className="underline text-accent" onClick={() => onOpenScore(result.previousScoreId)}>
              View the earlier result
            </button>
            {fix && (
              <span className="block mt-2 italic">Applied: &quot;{fix.proposed}&quot;</span>
            )}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
          <div className="p-8 border border-divider rounded-sm bg-divider/5">
            <p className={`text-6xl md:text-8xl font-clash font-bold mb-2 ${getScoreColor(result.atsScore)}`}>{result.atsScore}</p>
            <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">ATS Score</p>
          </div>

          <div className="p-8 border border-divider rounded-sm bg-divider/5">
            <p className={`text-6xl md:text-8xl font-clash font-bold mb-2 ${getScoreColor(result.matchPercentage)}`}>
              {result.matchPercentage}%
            </p>
            <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase">Job Match</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className={SECTION}>
        <h3 className={H3}>
          <span className="w-4 h-[1px] bg-divider"></span>
          AI Feedback
        </h3>
        <p className="text-muted-foreground leading-relaxed font-light italic text-lg md:text-xl">
          &quot;{result.finalSummary}&quot;
        </p>
      </div>

      <LevelAndWeights result={result} />
      <RequirementChecklist result={result} />

      {/* Strengths / Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        <div className="border border-border bg-background p-10 rounded-sm shadow-sm hover:border-accent transition-editorial">
          <h3 className={H3}>
            <span className="w-4 h-[1px] bg-accent"></span>
            Key Strengths
          </h3>
          <ul className="space-y-4">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-sm font-general text-foreground flex items-start gap-4">
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="min-w-0">
                  {s}
                  <EvidenceList item={result.evidence?.strengths?.[i]} legacy={legacy} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-border bg-background p-10 rounded-sm shadow-sm hover:border-destructive transition-editorial">
          <h3 className={H3}>
            <span className="w-4 h-[1px] bg-destructive"></span>
            Areas to Improve
          </h3>
          <ul className="space-y-4">
            {result.weaknesses.map((w, i) => (
              <li key={i} className="text-sm font-general text-muted-foreground flex items-start gap-4">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  {w}
                  <EvidenceList item={result.evidence?.weaknesses?.[i]} legacy={legacy} />
                  {!legacy && (
                    <WeaknessFix
                      scoreId={result.id}
                      index={i}
                      hasResumeText={!!result.hasResumeText}
                      resumePurged={!!result.resumePurged}
                      onOpenScore={onOpenScore}
                      onRerun={onRerun}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
        <div className={SECTION}>
          <h3 className={H3}>
            <span className="w-4 h-[1px] bg-accent"></span>
            Recommendations
          </h3>
          <ul className="space-y-6">
            {result.recommendations.map((r, i) => (
              <li key={i} className="text-sm font-general text-foreground">
                {(r.category || r.priority) && (
                  <p className="text-[10px] font-bold tracking-widest uppercase text-accent mb-1">
                    {[r.category, r.priority].filter(Boolean).join(" / ")}
                  </p>
                )}
                <p>{r.action}</p>
                {r.impact && <p className="text-xs text-muted-foreground mt-1">{r.impact}</p>}
                <EvidenceList item={result.evidence?.recommendations?.[i]} legacy={legacy} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        <div className="border border-border bg-background p-10 rounded-sm shadow-sm">
          <h3 className={H3}>
            <span className="w-4 h-[1px] bg-accent"></span>
            Your Top Skills
          </h3>
          <div className="flex flex-wrap gap-3">
            {(result.relevantSkills || []).map((skill, i) => (
              <span key={i} className="px-3 py-1 border border-accent/30 text-[10px] font-bold text-accent-foreground uppercase tracking-widest bg-accent rounded-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="border border-border bg-background p-10 rounded-sm shadow-sm">
          <h3 className={H3}>
            <span className="w-4 h-[1px] bg-destructive"></span>
            Skills to Add
          </h3>
          <div className="flex flex-wrap gap-3">
            {(result.missingSkills || []).map((skill, i) => (
              <span key={i} className="px-3 py-1 border border-destructive/20 text-[10px] font-bold text-destructive-foreground uppercase tracking-widest bg-destructive rounded-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-20">
        <Button onClick={() => onRerun(result)} variant="outline" className="flex-1 h-16 tracking-[0.2em]">
          <RotateCcw className="w-4 h-4 mr-3" /> Re-run with this job
        </Button>
        <Button onClick={onScanAnother} variant="outline" className="flex-1 h-16 tracking-[0.2em]">
          Scan Another Resume
        </Button>
      </div>
    </div>
  );
}
