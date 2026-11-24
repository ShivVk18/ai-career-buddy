export default function JobLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-5" aria-busy="true" aria-label="Loading job">
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-soft" />
      <div className="h-24 w-full animate-pulse rounded-lg bg-soft" />
      <div className="h-64 w-full animate-pulse rounded-lg bg-soft" />
    </div>
  );
}
