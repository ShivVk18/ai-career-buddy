import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PipAvatar from "@/components/ui/PipAvatar";
import AppWindow from "@/components/ui/AppWindow";
import { cn } from "@/lib/utils";

/**
 * Shared page frame for the six tools: pip + lowercase title + one line, then the tool inside a window panel.
 * `windowTitle` is the muted caption in the window bar. Pass `bare` to skip the window (children render as-is).
 */
export default function ToolFrame({ title, line, outfit = "detective", back, windowTitle, bare = false, action, className, bodyClassName, children }) {
  return (
    <div className={cn("mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12", className)}>
      {back && (
        <Link
          href={back.href}
          className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-full text-sm text-muted outline-none hover:text-text focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {back.label}
        </Link>
      )}
      <header className="mb-6 flex items-start gap-4 sm:items-center">
        <PipAvatar outfit={outfit} size="lg" alt="" className="hidden sm:inline-block" />
        <div className="min-w-0 flex-1">
          <h1 className="font-doc text-3xl leading-tight text-text sm:text-4xl">{title}</h1>
          {line && <p className="mt-1 text-sm text-muted">{line}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {bare ? (
        children
      ) : (
        <AppWindow title={windowTitle} bodyClassName={cn("p-5 sm:p-8", bodyClassName)}>
          {children}
        </AppWindow>
      )}
    </div>
  );
}
