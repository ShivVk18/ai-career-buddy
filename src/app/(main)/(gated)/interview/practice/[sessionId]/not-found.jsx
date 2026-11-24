import EmptyState from "@/components/shared/EmptyState";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <EmptyState step="detective" text="i can't find that practice session." actionLabel="back to interview prep" href="/interview" />
    </div>
  );
}
