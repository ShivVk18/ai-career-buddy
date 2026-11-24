/** Route-level loading state shared by every loading.jsx. */
export default function PageSkeleton({ label = "Loading" }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5" aria-busy="true" aria-label={label}>
      <div className="h-8 w-1/2 animate-pulse rounded-lg bg-soft" />
      <div className="h-24 w-full animate-pulse rounded-lg bg-soft" />
      <div className="h-64 w-full animate-pulse rounded-lg bg-soft" />
    </div>
  );
}
