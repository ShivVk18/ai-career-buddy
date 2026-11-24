import PipAvatar from "./PipAvatar";
import { cn } from "@/lib/utils";

/** Pip plus one line of status text. `working` hops and pulses a dot. */
export default function PipStatus({ outfit = "detective", text, working = true, size = "md", className }) {
  return (
    <div role="status" aria-live="polite" className={cn("inline-flex max-w-full items-center gap-3", className)}>
      <PipAvatar outfit={outfit} size={size} working={working} alt="" />
      <span className="flex min-w-0 items-center gap-2 font-pixel text-sm text-muted">
        {working && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-brand" aria-hidden="true" />}
        <span className="truncate">{text}</span>
      </span>
    </div>
  );
}
