'use client'

import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, RotateCcw } from 'lucide-react';
import { LegacySourcesLabel } from "@/components/shared/SourceChips";
import Skeleton from "@/components/ui/Skeleton";
import { Chip } from "@/components/ui/Chip";
import DeleteAtsButton from "./DeleteAtsButton";
import { getUserATSScores } from "@/actions/ResumeParser";

const ghost = "inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm text-muted outline-none hover:bg-soft hover:text-text focus-visible:ring-2 focus-visible:ring-ring";

export default function AtsHistory({ onOpen, onRerun, refreshKey }) {
  const [rows, setRows] = useState(null);
  const [restoreKey, setRestoreKey] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await getUserATSScores();
        if (live) setRows(Array.isArray(res) ? res : []);
      } catch {
        if (live) {
          setError("we couldn't load your score history.");
          setRows([]);
        }
      }
    })();
    return () => { live = false; };
  }, [refreshKey, restoreKey]);

  const byId = new Map((rows || []).map((r) => [r.id, r]));

  return (
    <section aria-label="score history" className="mx-auto w-full max-w-4xl px-4 pb-12 sm:px-6">
      <h2 className="mb-3 font-doc text-xl text-text">score history</h2>
      {rows === null && (
        <div aria-busy="true" aria-label="loading history" className="space-y-3">
          <Skeleton className="h-20 w-full rounded-[20px]" />
          <Skeleton className="h-20 w-full rounded-[20px]" />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {rows && rows.length === 0 && !error && <p className="text-sm text-muted">no scans yet. your results will show up here.</p>}
      <ul className="space-y-3">
        {rows?.map((r) => {
          const prev = r.previousScoreId ? byId.get(r.previousScoreId) : null;
          return (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-line bg-panel p-4 shadow-card sm:p-5">
              <div className="min-w-0 space-y-1.5">
                <p className="truncate text-sm font-medium text-text">{[r.jobTitle, r.companyName].filter(Boolean).join(" at ") || "untitled scan"}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  {r.candidateLevel && <Chip value={`${r.candidateLevel}${r.candidateYears != null ? ` · ${r.candidateYears} yr` : ''}`} editable={false} />}
                  {r.requirementsTotal > 0 && <Chip tone="brand" value={`${r.requirementsMatched}/${r.requirementsTotal} requirements`} editable={false} />}
                </div>
                {r.previousScoreId && (
                  <p className="text-xs text-brand-ink">
                    after a fix:{' '}
                    {prev ? (
                      <>ats {prev.atsScore} <ArrowRight className="inline size-3" aria-hidden="true" /> {r.atsScore}, match {prev.matchPercentage}% <ArrowRight className="inline size-3" aria-hidden="true" /> {r.matchPercentage}%</>
                    ) : (
                      <>re-score of an earlier result</>
                    )}
                  </p>
                )}
                {r.isLegacy && <LegacySourcesLabel />}
                {r.resumePurged && <p className="text-xs text-faint">resume text removed after 90 days; re-upload to use fixes.</p>}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <div className="mr-2 text-right">
                  <p className="font-doc text-2xl leading-none text-text">{r.atsScore}</p>
                  <p className="text-xs text-faint">{r.matchPercentage}% match</p>
                </div>
                <button type="button" onClick={() => onOpen(r.id)} className={ghost}><Eye className="size-4" aria-hidden="true" /> view</button>
                <button type="button" onClick={() => onRerun(r)} className={ghost}><RotateCcw className="size-4" aria-hidden="true" /> re-run with this job</button>
                <DeleteAtsButton scoreId={r.id} onDeleted={(id) => setRows((cur) => (cur || []).filter((x) => x.id !== id))} onRestored={() => setRestoreKey((k) => k + 1)} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
