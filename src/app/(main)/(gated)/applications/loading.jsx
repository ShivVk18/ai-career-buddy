import AppWindow from "@/components/ui/AppWindow";
import PixelScene from "@/components/ui/PixelScene";
import Skeleton from "@/components/ui/Skeleton";

export default function ApplicationsLoading() {
  return (
    <div className="relative min-h-full" aria-busy="true" aria-label="loading applications">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <PixelScene variant="sea" seed={505} />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-3 pb-10 pt-4 sm:px-8 sm:pt-16">
        <AppWindow title="ascendai · applications" bodyClassName="p-3 sm:p-6">
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="min-h-72 w-[78%] shrink-0 space-y-2 rounded-[18px] bg-soft p-3 md:w-auto md:flex-1">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-14 bg-panel" />
              </div>
            ))}
          </div>
        </AppWindow>
      </div>
    </div>
  );
}
