// Where a pending tailoring draft's proposals come from for the review queue.
//
// BLOCKED on the backend: there is no action that returns a draft's proposals by draftId (getResumeVersion refuses
// drafts, tailorResume only returns them to the call that made them). See "Requests from frontend" in
// docs/ai/API-CONTRACT.md. When `getTailorDraft(draftId)` exists, call it here and return its result unchanged:
//   { draftId, jobTitle, companyName, matchBefore, proposals: [...] } | { error, code }
export async function loadTailorDraft() {
  return {
    error: "Pip can't open this draft here yet. Your suggestions are safe; you can dismiss them or tailor again from the resume page.",
    code: "UNSUPPORTED",
  };
}
