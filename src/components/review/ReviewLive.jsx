"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getResume, getTailorDraft, saveTailoredVersion } from "@/actions/Resume";
import { acceptTailoredVersion, undo } from "@/actions/Undo";
import { getPipelineStatus } from "@/actions/Pipeline";
import { getATSScoreById } from "@/actions/ResumeParser";
import { approveNeedsYou } from "@/actions/Applications";
import { generationErrorMessage } from "@/components/shared/generationError";
import ReviewScreen from "./ReviewScreen";
import { buildReviewLines } from "./reviewLines";

const GONE = "this draft expired or was already saved. tailor again to get fresh edits.";

/** Real data for the review screen: tailor draft + saved resume + (when the application is known) checker requirements and the invented count. */
export default function ReviewLive({ draftId, applicationId, onSaved }) {
  const [state, setState] = useState({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const [draft, resume] = await Promise.all([getTailorDraft(draftId), getResume().catch(() => null)]);
      if (!draft || draft.error) {
        const gone = draft?.code === "STALE" || draft?.code === "NOT_FOUND";
        setState({ status: "error", error: gone ? GONE : generationErrorMessage(draft, "we couldn't open this draft."), retry: !gone });
        return;
      }
      let invented = null;
      let requirements = [];
      const appId = applicationId || null;
      if (appId) {
        try {
          const pipe = await getPipelineStatus(appId);
          const tailor = pipe?.steps?.find((s) => s.id === "tailor");
          const inv = tailor?.chips?.find((c) => /invented/i.test(c.label));
          if (inv != null && Number.isFinite(parseInt(inv.value, 10))) invented = parseInt(inv.value, 10);
          const scoreId = pipe?.steps?.find((s) => s.id === "checker")?.ids?.atsScoreId;
          if (scoreId) {
            const score = await getATSScoreById(scoreId);
            const reqs = score?.evidence?.requirements;
            if (Array.isArray(reqs))
              requirements = reqs.map((r, i) => ({ id: `r${i}`, label: r.requirement, status: r.status === "matched" ? "have" : r.status === "partial" ? "partial" : "gap" }));
          }
        } catch {
          // requirement list and invented count are extras; the edits still work without them
        }
      }
      setState({ status: "ready", draft, resume, invented, requirements });
    } catch {
      setState({ status: "error", error: "we couldn't open this draft.", retry: true });
    }
  }, [draftId, applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  const data = useMemo(() => {
    if (state.status !== "ready") return null;
    const { draft, resume, invented, requirements } = state;
    const matched = Array.isArray(draft.matchBefore?.matched) ? draft.matchBefore.matched.map((m) => (typeof m === "string" ? m : m?.term)) : [];
    const name = resume?.contactInfo?.name || resume?.name || "your resume";
    const target = [draft.companyName, draft.jobTitle].filter(Boolean);
    return {
      title: name,
      subtitle: `resume · for ${target.join(" · ") || "this job"}`.toLowerCase(),
      wants: `${(draft.companyName || "the job").toLowerCase()} wants`,
      windowTitle: "ascendai · needs you",
      lines: buildReviewLines(draft.proposals, resume, matched),
      requirements,
      invented,
    };
  }, [state]);

  const commit = async ({ ids, edits }) => {
    const res = await saveTailoredVersion({ draftId, acceptedProposalIds: ids, ...(Object.keys(edits).length ? { edits } : {}) });
    if (!res || res.error) return { error: generationErrorMessage(res, "we couldn't save these edits.").toLowerCase() };
    const acc = await acceptTailoredVersion(res.versionId);
    if (!acc || acc.error) return { error: "saved as a version, but we couldn't apply it. open your resume versions to restore it." };
    return { count: Array.isArray(res.applied) ? res.applied.length : ids.length, undoToken: acc.undoToken };
  };

  return (
    <ReviewScreen
      status={state.status}
      error={state.error}
      onRetry={state.retry ? load : undefined}
      data={data}
      onCommit={commit}
      onUndo={undo}
      onDone={applicationId ? () => approveNeedsYou(applicationId, "TAILOR").then(() => onSaved?.()).catch(() => {}) : onSaved}
      emptyAction={<Link href="/needs-you" className="btn-pill-secondary inline-flex min-h-11 items-center px-5 text-sm">back to needs you</Link>}
    />
  );
}
