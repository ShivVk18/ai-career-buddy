import { cn } from "@/lib/utils";

/** "4 · you review. every line has a source." pill caption. */
export default function StepCaption({ n, children, className }) {
  return (
    <p
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full bg-panel/90 px-4 py-2 font-doc text-lg text-text shadow-card backdrop-blur-sm",
        className,
      )}
    >
      {n != null && (
        <>
          <span className="text-brand">{n}</span>
          <span className="text-faint">·</span>
        </>
      )}
      <span>{children}</span>
    </p>
  );
}
