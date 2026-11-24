import ToolFrame from "@/components/shared/ToolFrame";
import { getCoverLetter } from "@/actions/CoverLetter";
import CoverLetterPreview from "../_components/CoverLetterPreview";
import EmptyState from "@/components/shared/EmptyState";

export default async function EditCoverLetterPage({ params }) {
  const { id } = await params;
  const coverLetter = await getCoverLetter(id);

  if (!coverLetter) {
    return (
      <div className="mx-auto max-w-xl p-6 py-16">
        <EmptyState step="detective" text="i can't find that letter. it may have been deleted." actionLabel="back to cover letters" href="/cover-letter" />
      </div>
    );
  }

  return (
    <ToolFrame
      title={[coverLetter?.jobTitle, coverLetter?.companyName].filter(Boolean).join(" at ").toLowerCase() || "your cover letter"}
      line="review it, tweak the tone, then download."
      outfit="wizard"
      back={{ href: "/cover-letter", label: "your letters" }}
      windowTitle="ascendai · cover letter"
    >
      <CoverLetterPreview id={coverLetter?.id} content={coverLetter?.content} sources={coverLetter?.sources ?? null} tone={coverLetter?.tone ?? null} />
    </ToolFrame>
  );
}
