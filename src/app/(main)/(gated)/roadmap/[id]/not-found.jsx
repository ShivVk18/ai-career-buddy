import EmptyState from "@/components/shared/EmptyState";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <EmptyState step="detective" text="i can't find that roadmap. it may have been deleted." actionLabel="back to roadmaps" href="/roadmap" />
    </div>
  );
}
