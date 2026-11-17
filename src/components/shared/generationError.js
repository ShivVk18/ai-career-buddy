// Friendly text for { error, code } results returned by generator server actions.
export function generationErrorMessage(result, fallback = "Something went wrong. Please try again.") {
  if (!result) return fallback;
  if (result.code === "NO_SOURCES") {
    return "We couldn't ground this in your details. Add more detail to your profile or resume, or paste a fuller job description, then try again.";
  }
  if (result.code === "AI_LIMIT") return "Daily AI limit reached. Please try again tomorrow.";
  return result.error || fallback;
}
