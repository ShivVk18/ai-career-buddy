"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import TrackedChanges from "@/components/shared/TrackedChanges";
import { generationErrorMessage } from "@/components/shared/generationError";
import { getResume, saveTailoredVersion } from "@/actions/Resume";
import { loadTailorDraft } from "./tailorDraftSource";

/**
 * Tailor draft as tracked changes (D36, D63). Accepting saves a resume VERSION via saveTailoredVersion;
 * the main resume is never touched. onDone() is called once the draft is saved or dismissed.
 */
export default function TailorReview({ item, onDismiss, onSaved }) {
  const [state, setState] = useState({ status: "loading" });
  const [resume, setResume] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const [draft, doc] = await Promise.all([loadTailorDraft(item.refId), getResume().catch(() => null)]);
      setResume(doc);
      if (!draft || draft.error) setState({ status: "error", error: generationErrorMessage(draft, "We couldn't open this draft."), code: draft?.code });
      else setState({ status: "ready", draft });
    } catch {
      setState({ status: "error", error: "We couldn't open this draft." });
    }
  }, [item.refId]);

  useEffect(() => {
    load();
  }, [load]);

  const accepted = useMemo(
    () => (state.draft ? state.draft.proposals.filter((p) => decisions[p.proposalId] === "accepted") : []),
    [state.draft, decisions]
  );

  const save = async (ids) => {
    setSaving(true);
    try {
      const res = await saveTailoredVersion({ draftId: state.draft.draftId, acceptedProposalIds: ids });
      if (!res || res.error) {
        toast.error(generationErrorMessage(res, "We couldn't save the version."));
        return;
      }
      toast.success("Saved as a version. Your main resume is unchanged.");
      onSaved?.(res);
    } catch {
      toast.error("We couldn't save the version. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (state.status === "loading") {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading resume edits">
        <div className="h-4 w-1/3 animate-pulse rounded bg-soft" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-soft" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="space-y-3 rounded-xl border border-[#E8C9C0] bg-[#FDF3F0] p-4 text-xs text-text">
        <p>{state.error}</p>
        <div className="flex flex-wrap gap-2">
          {state.code !== "UNSUPPORTED" && (
            <button type="button" onClick={load} className="btn-pill-secondary min-h-10 px-4 text-xs">
              Retry
            </button>
          )}
          <Link href="/resume" className="btn-pill-secondary inline-flex min-h-10 items-center px-4 text-xs">
            Open resume tailoring
          </Link>
          <button type="button" onClick={onDismiss} className="btn-pill-secondary min-h-10 px-4 text-xs">
            Dismiss this draft
          </button>
        </div>
      </div>
    );
  }

  const { draft } = state;
  return (
    <div className="space-y-4">
      <TrackedChanges
        proposals={draft.proposals}
        decisions={decisions}
        onDecide={(id, v) => setDecisions((d) => ({ ...d, [id]: v }))}
        resume={resume}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            const all = draft.proposals.map((p) => p.proposalId);
            setDecisions(Object.fromEntries(all.map((id) => [id, "accepted"])));
            save(all);
          }}
          className="btn-pill-primary inline-flex min-h-11 items-center gap-2 px-5 text-xs disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          Accept all
        </button>
        <button
          type="button"
          disabled={saving || accepted.length === 0}
          onClick={() => save(accepted.map((p) => p.proposalId))}
          className="btn-pill-secondary min-h-11 px-5 text-xs disabled:opacity-50"
        >
          Save {accepted.length} accepted
        </button>
        <button type="button" disabled={saving} onClick={onDismiss} className="min-h-11 rounded px-3 text-xs text-muted hover:text-text focus-visible:ring-2 focus-visible:ring-pip/50">
          Reject all
        </button>
      </div>
      <p className="text-[11px] text-muted">Saving makes a version only. Your main resume changes only when you restore it.</p>
    </div>
  );
}
