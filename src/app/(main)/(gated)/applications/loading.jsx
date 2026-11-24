import AppWindow from "@/components/ui/AppWindow";
import SceneScreen from "@/components/ui/SceneScreen";
import Skeleton from "@/components/ui/Skeleton";

export default function ApplicationsLoading() {
  return (
    <SceneScreen variant="sea" seed={505} as="div" innerClassName="max-w-6xl" label="loading applications">
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
    </SceneScreen>
  );
}
