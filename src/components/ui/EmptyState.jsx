import PipAvatar from "./PipAvatar";
import { cn } from "@/lib/utils";

/** Pip, one line, one action. `action` is any node (a Button). */
export default function EmptyState({ outfit = "coffee", title, text, action, className }) {
  return (
    <div className={cn("fade-up flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-line bg-panel px-6 py-10 text-center", className)}>
      <PipAvatar outfit={outfit} size="xl" alt="" />
      <p className="font-doc text-xl text-text">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
