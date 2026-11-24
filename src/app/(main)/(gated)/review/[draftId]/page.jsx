import ReviewLive from "@/components/review/ReviewLive";

export const metadata = { title: "Review edits" };

export default async function ReviewPage({ params, searchParams }) {
  const { draftId } = await params;
  const { app } = (await searchParams) || {};
  return (
    <div className="min-h-full">
      <ReviewLive draftId={draftId} applicationId={typeof app === "string" ? app : null} />
    </div>
  );
}
