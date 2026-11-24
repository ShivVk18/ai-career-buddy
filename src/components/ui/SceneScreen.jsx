import PixelScene from "@/components/ui/PixelScene";
import { cn } from "@/lib/utils";

/**
 * Full-bleed pixel scene behind a screen. Always at least one viewport tall (so the sky never stops at content
 * height on tall screens), and runs under the mobile tab bar. `center` vertically centres the window.
 * `as` lets a page pick the element; pass `label` for the landmark name.
 */
export default function SceneScreen({
  variant = "morning",
  seed = 1,
  center = false,
  label,
  as: Tag = "section",
  className,
  innerClassName,
  children,
  overlay,
}) {
  return (
    <Tag
      aria-label={label}
      className={cn(
        "relative flex min-h-screen flex-col overflow-hidden px-3 py-6 sm:px-8 sm:py-10 -mb-20 pb-24 md:-mb-8 md:pb-10",
        center && "justify-center",
        className,
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <PixelScene variant={variant} seed={seed} />
      </div>
      {overlay}
      <div className={cn("relative z-10 mx-auto w-full max-w-[1040px]", innerClassName)}>{children}</div>
    </Tag>
  );
}
