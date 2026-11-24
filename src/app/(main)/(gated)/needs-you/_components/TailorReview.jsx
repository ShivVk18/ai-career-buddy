"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Tailor draft entry in the needs-you queue. The review itself (per-line accept/reject/edit, requirements,
 * accept all with undo) lives on the full review screen: /review/<draftId>.
 */
export default function TailorReview({ item, onDismiss }) {
  const href = `/review/${encodeURIComponent(item.refId)}${item.applicationId ? `?app=${encodeURIComponent(item.applicationId)}` : ""}`;
  return (
    <div className="space-y-3">
      <p className="text-sm text-text">pip rewrote some resume lines for this job. every line has a source, and you pick what stays.</p>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={href} className="btn-pill-primary inline-flex min-h-11 items-center gap-2 px-5 text-sm">
          review the edits <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <button type="button" onClick={onDismiss} className="min-h-11 rounded px-3 text-sm text-muted hover:text-text focus-visible:ring-2 focus-visible:ring-pip/50">
          reject all
        </button>
      </div>
      <p className="text-xs text-muted">accepting updates your resume, with an undo. nothing is sent.</p>
    </div>
  );
}
