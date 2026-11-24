'use client'

import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Loader, Wand2, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";
import SourceChips, { LegacySourcesLabel } from "@/components/shared/SourceChips";
import { generationErrorMessage } from "@/components/shared/generationError";
import DeleteAtsButton from "./DeleteAtsButton";
import { proposeAtsFix, applyAtsFix } from "@/actions/ResumeParser";
import { WEIGHT_GROUPS, weightsForLevel } from "@/lib/ats/weights";

const SECTION = "rounded-[20px] border border-line bg-panel p-5 sm:p-8 mb-6 shadow-card";
const H3 = "font-doc text-xl text-text mb-5";

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
        <p key={i} className="text-xs italic text-muted border-l-2 border-brand/50 pl-3">
          From your resume: &quot;{q.quote}&quot;
        </p>
      ))}
      <SourceChips sources={jd} />
    </div>
  );
};

const getScoreColor = (score) => {
  if (score >= 70) return 'text-brand-ink';
  if (score >= 50) return 'text-warn-ink';
  return 'text-gap-ink';
};

// New results carry match: have | partial | gap. Older ones only have status: matched | gap.
export const reqMatch = (r) => (r?.match === "have" || r?.match === "partial" || r?.match === "gap" ? r.match : r?.status === "matched" ? "have" : r?.status === "partial" ? "partial" : "gap");
const MATCH_UI = {
  have: { label: "have", tone: "brand" },
  partial: { label: "partial", tone: "warn" },
  gap: { label: "gap", tone: "gap" },
};

function RequirementChecklist({ result }) {
  const reqs = result.evidence?.requirements;
  if (!result.evidence) return null; // legacy: labelled elsewhere
  const counts = Array.isArray(reqs) ? reqs.reduce((n, r) => ({ ...n, [reqMatch(r)]: (n[reqMatch(r)] || 0) + 1 }), {}) : {};
  return (
    <section className={SECTION} aria-label="requirement checklist">
      <h3 className={H3}>what the job wants</h3>
      {!Array.isArray(reqs) || reqs.length === 0 ? (
        <p className="text-sm text-muted">no requirement checklist was recorded for this result. run a new scan to get one.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2" aria-label="summary">
            {["have", "partial", "gap"].map((k) => (
              <Chip key={k} tone={MATCH_UI[k].tone} editable={false} value={`${counts[k] || 0} ${MATCH_UI[k].label}`} />
            ))}
          </div>
          <ul className="divide-y divide-dashed divide-line">
            {reqs.map((r, i) => {
              const m = reqMatch(r);
              return (
                <li key={i} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-text">{r.requirement}</p>
                    <EvidenceList item={r} />
                  </div>
                  <Chip tone={MATCH_UI[m].tone} editable={false} value={MATCH_UI[m].label} className="shrink-0" />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

function LevelAndWeights({ result }) {
  const level = result.candidateLevel;
  const active = weightsForLevel(level);
  return (
    <details className={cn(SECTION, "group")}>
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="font-doc text-xl text-text">how it was scored</span>
        <span className="flex items-center gap-2 text-xs text-faint">
          {level ? <Chip tone="brand" editable={false} value={`${level}${result.candidateYears != null ? ` · ${result.candidateYears} ${result.candidateYears === 1 ? "year" : "years"}` : ""}`} /> : "level not recorded"}
          <span className="group-open:hidden">show</span>
          <span className="hidden group-open:inline">hide</span>
        </span>
      </summary>
      {level && !active && <p className="mt-4 text-xs text-muted">we don&apos;t recognise this level, so no weights are highlighted.</p>}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {Object.entries(WEIGHT_GROUPS).map(([key, g]) => {
          const isActive = active && active.label === g.label;
          return (
            <div key={key} className={cn("rounded-[14px] border p-4", isActive ? "border-brand bg-brand-soft/40" : "border-line opacity-70")}>
              <p className="mb-3 text-xs font-medium text-text">
                {g.label} {isActive && <span className="text-brand-ink">(applied)</span>}
              </p>
              <ul className="space-y-3">
                {g.weights.map((w) => (
                  <li key={w.key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{w.key}</span>
                      <span className="text-muted">{w.value}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-soft">
                      <div className="h-full bg-brand" style={{ width: `${w.value}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </details>
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
        <div className="border border-line rounded-[14px] p-4 space-y-3 bg-soft">
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
        <div className="border border-brand/40 rounded-[14px] p-4 space-y-3 bg-brand-soft/50">
          <p className="text-xs font-medium text-brand-ink">re-scored</p>
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
  const chipList = (items, tone) => (
    <div className="flex flex-wrap gap-2">
      {items.map((skill, i) => (
        <Chip key={i} tone={tone} editable={false} value={skill} />
      ))}
    </div>
  );
  return (
    <div className="fade-up">
      <div className="mb-6 rounded-[20px] border border-line bg-panel p-5 shadow-card sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{[result.jobTitle, result.companyName].filter(Boolean).join(" at ") || "your scan"}</p>
          {result.id && onDeleted && <DeleteAtsButton scoreId={result.id} onDeleted={onDeleted} onRestored={onRestored} variant="outline" />}
        </div>
        {legacy && <LegacySourcesLabel className="mb-5" />}
        {result.previousScoreId && (
          <p className="mb-5 text-xs text-muted">
            this is a re-score after an accepted fix.{' '}
            <button type="button" className="min-h-10 underline text-brand-ink" onClick={() => onOpenScore(result.previousScoreId)}>
              view the earlier result
            </button>
            {fix && <span className="mt-1 block italic">applied: &quot;{fix.proposed}&quot;</span>}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 text-center sm:gap-6">
          <div className="rounded-[14px] bg-soft p-5">
            <p className={cn("font-doc text-5xl sm:text-7xl", getScoreColor(result.atsScore))}>{result.atsScore}</p>
            <p className="mt-1 text-xs text-faint">ats score</p>
          </div>
          <div className="rounded-[14px] bg-soft p-5">
            <p className={cn("font-doc text-5xl sm:text-7xl", getScoreColor(result.matchPercentage))}>{result.matchPercentage}%</p>
            <p className="mt-1 text-xs text-faint">job match</p>
          </div>
        </div>
      </div>

      <section className={SECTION} aria-label="feedback">
        <h3 className={H3}>pip&apos;s read</h3>
        <p className="font-doc text-lg italic leading-relaxed text-muted sm:text-xl">&quot;{result.finalSummary}&quot;</p>
      </section>

      <RequirementChecklist result={result} />

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-[20px] border border-line bg-panel p-5 shadow-card sm:p-8" aria-label="strengths">
          <h3 className={H3}>strengths</h3>
          <ul className="space-y-4">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text">
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden="true" />
                <div className="min-w-0">
                  {s}
                  <EvidenceList item={result.evidence?.strengths?.[i]} legacy={legacy} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[20px] border border-line bg-panel p-5 shadow-card sm:p-8" aria-label="areas to improve">
          <h3 className={H3}>to improve</h3>
          <ul className="space-y-4">
            {result.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-gap-ink" aria-hidden="true" />
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
        </section>
      </div>

      {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
        <section className={SECTION} aria-label="recommendations">
          <h3 className={H3}>what to do next</h3>
          <ul className="space-y-5">
            {result.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-text">
                {(r.category || r.priority) && <p className="mb-1 text-xs font-medium text-brand-ink">{[r.category, r.priority].filter(Boolean).join(" / ").toLowerCase()}</p>}
                <p>{r.action}</p>
                {r.impact && <p className="mt-1 text-xs text-muted">{r.impact}</p>}
                <EvidenceList item={result.evidence?.recommendations?.[i]} legacy={legacy} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-[20px] border border-line bg-panel p-5 shadow-card sm:p-8" aria-label="your top skills">
          <h3 className={H3}>your top skills</h3>
          {chipList(result.relevantSkills || [], "brand")}
        </section>
        <section className="rounded-[20px] border border-line bg-panel p-5 shadow-card sm:p-8" aria-label="skills to add">
          <h3 className={H3}>skills to add</h3>
          {chipList(result.missingSkills || [], "gap")}
        </section>
      </div>

      <LevelAndWeights result={result} />

      <div className="mb-10 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => onRerun(result)} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-panel px-6 text-sm text-text outline-none hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring">
          <RotateCcw className="size-4" aria-hidden="true" /> re-run with this job
        </button>
        <button type="button" onClick={onScanAnother} className="btn-ink inline-flex min-h-12 flex-1 items-center justify-center px-6 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          scan another resume
        </button>
      </div>
    </div>
  );
}
