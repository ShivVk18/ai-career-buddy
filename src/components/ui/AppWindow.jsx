import { cn } from "@/lib/utils";

/** Window chrome with three dots and a muted title. */
export default function AppWindow({ title, children, className, bodyClassName }) {
  return (
    <div className={cn("overflow-hidden rounded-[20px] border border-line bg-panel shadow-soft", className)}>
      <div className="relative flex h-11 items-center border-b border-line px-4">
        <div className="flex gap-2" aria-hidden="true">
          <i className="size-2.5 rounded-full bg-line" />
          <i className="size-2.5 rounded-full bg-line" />
          <i className="size-2.5 rounded-full bg-line" />
        </div>
        {title && (
          <span className="pointer-events-none absolute inset-x-0 text-center font-doc text-xs text-faint">{title}</span>
        )}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
