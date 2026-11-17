// Friendly text for { error, code } results returned by server actions.
export function generationErrorMessage(result, fallback = "Something went wrong. Please try again.") {
  if (!result) return fallback;
  switch (result.code) {
    case "NO_SOURCES":
      return "We couldn't ground this in your details. Add more detail to your profile or resume, or paste a fuller job description, then try again.";
    case "AI_LIMIT":
      return "Daily AI limit reached. Please try again tomorrow.";
    case "AI_UNAVAILABLE":
      return "AI is temporarily unavailable. Please try again later.";
    case "FIX_UNAVAILABLE":
      return "Fixes are temporarily unavailable. Please try again later.";
    case "ALREADY_APPLIED":
      return "You've already applied this fix. Opening the result you got.";
    case "NEEDS_REUPLOAD":
      return "This result was saved before we kept the analyzed resume text, so we can't test a fix on it. Please upload your PDF again and re-run the analysis.";
    case "STALE":
      return result.error || "This has expired or your resume changed. Please start again.";
    case "NOT_RESTORABLE":
      return "This older copy only kept plain text, so it can't be restored. Your resume was not changed.";
    case "NOT_SHORTENABLE":
      return `${result.error || "This letter can't be shortened automatically."} Use Regenerate instead.`;
    case "MIGRATION_PENDING":
      return "This feature is being set up. Please try again in a little while.";
    case "ALREADY_SCORED":
      return "This question has already been scored. Showing your saved result.";
    case "SCORING_IN_PROGRESS":
      return "Pip is still scoring this answer, check back in a few seconds";
    default:
      return result.error || fallback;
  }
}
