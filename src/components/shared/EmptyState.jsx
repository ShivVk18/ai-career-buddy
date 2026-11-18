import Link from "next/link";
import PipStatus from "@/components/pixel/PipStatus";

/** Empty state: Pip with a line of text and exactly one action (a link via href, or a button via onClick). */
export default function EmptyState({ step = "detective", text, actionLabel, href, onClick }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-panel/60 p-6 text-center space-y-4">
      <PipStatus step={step} text={text} className="mx-auto" />
      {actionLabel &&
        (href ? (
          <Link href={href} className="btn-pill-primary inline-flex min-h-11 items-center px-6 text-sm">
            {actionLabel}
          </Link>
        ) : (
          <button type="button" onClick={onClick} className="btn-pill-primary min-h-11 px-6 text-sm">
            {actionLabel}
          </button>
        ))}
    </div>
  );
}
