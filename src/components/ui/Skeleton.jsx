import { cn } from "@/lib/utils";

export default function Skeleton({ className, ...props }) {
  return <div aria-hidden="true" className={cn("skeleton-pulse rounded-[9px] bg-soft", className)} {...props} />;
}
