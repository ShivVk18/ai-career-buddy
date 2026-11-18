import { getTailorDraft } from "@/actions/Resume";

// A pending tailoring draft's proposals for the review queue. Returns the action result unchanged:
//   { draftId, jobId, jobTitle, companyName, matchBefore, proposals, expiresAt } | { error, code }
export async function loadTailorDraft(draftId) {
  return getTailorDraft(draftId);
}
