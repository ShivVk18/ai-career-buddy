'use client'

import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, RotateCcw, Loader } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { LegacySourcesLabel } from "@/components/shared/SourceChips";
import { getUserATSScores } from "@/actions/ResumeParser";

export default function AtsHistory({ onOpen, onRerun, refreshKey }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await getUserATSScores();
        if (live) setRows(Array.isArray(res) ? res : []);
      } catch {
        if (live) {
          setError("We couldn't load your score history.");
          setRows([]);
        }
      }
    })();
    return () => { live = false; };
  }, [refreshKey]);

  const byId = new Map((rows || []).map((r) => [r.id, r]));

  return (
    <div className="max-w-4xl mx-auto mt-16">
      <h3 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-8 flex items-center gap-3">
        <span className="w-4 h-[1px] bg-divider"></span>
        Score History
      </h3>
      {rows === null && (
        <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader className="w-3 h-3 animate-spin" /> Loading history...</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {rows && rows.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">No scans yet. Your results will show up here.</p>
      )}
      <ul className="space-y-3">
        {rows?.map((r) => {
          const prev = r.previousScoreId ? byId.get(r.previousScoreId) : null;
          return (
            <li key={r.id} className="border border-border bg-background rounded-sm p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-foreground truncate">
                  {[r.jobTitle, r.companyName].filter(Boolean).join(" at ") || "Untitled scan"}
                </p>
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString()}
                  {r.candidateLevel && ` / ${r.candidateLevel}`}
                  {r.requirementsTotal > 0 && ` / ${r.requirementsMatched}/${r.requirementsTotal} requirements`}
                </p>
                {r.previousScoreId && (
                  <p className="text-xs text-accent">
                    After fix:{' '}
                    {prev ? (
                      <>ATS {prev.atsScore} <ArrowRight className="inline w-3 h-3" /> {r.atsScore}, match {prev.matchPercentage}% <ArrowRight className="inline w-3 h-3" /> {r.matchPercentage}%</>
                    ) : (
                      <>re-score of an earlier result</>
                    )}
                  </p>
                )}
                {r.isLegacy && <LegacySourcesLabel />}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-sm">
                  <p className="font-clash font-bold text-foreground">{r.atsScore}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.matchPercentage}% match</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => onOpen(r.id)}>
                  <Eye className="w-3 h-3 mr-2" /> View
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => onRerun(r)}>
                  <RotateCcw className="w-3 h-3 mr-2" /> Re-run with this job
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
