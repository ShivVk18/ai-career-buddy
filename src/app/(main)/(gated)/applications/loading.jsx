export default function ApplicationsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5" aria-busy="true" aria-label="Loading applications">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-soft" />
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-72 min-w-[78vw] sm:min-w-[16rem] flex-1 animate-pulse rounded-2xl bg-soft" />
        ))}
      </div>
    </div>
  );
}
