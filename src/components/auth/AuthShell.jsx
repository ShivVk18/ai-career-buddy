import Link from "next/link";
import SceneScreen from "@/components/ui/SceneScreen";
import AppWindow from "@/components/ui/AppWindow";
import PipAvatar from "@/components/ui/PipAvatar";

/** Shared frame for the four auth pages: morning scene, one window, pip on top. */
export default function AuthShell({ title, heading, intro, children, footer }) {
  return (
    <SceneScreen variant="morning" seed={7} center label={heading} as="main" innerClassName="max-w-[440px]">
      <Link href="/" className="mb-4 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-text">
        <PipAvatar outfit="coffee" size="md" alt="" />
        ascendai
      </Link>
      <AppWindow title={title} bodyClassName="p-5 sm:p-7">
        <h1 className="font-doc text-2xl text-text">{heading}</h1>
        {intro && <p className="mt-1 text-sm text-muted">{intro}</p>}
        <div className="mt-5">{children}</div>
      </AppWindow>
      {footer && <p className="mt-4 text-center text-sm text-text">{footer}</p>}
    </SceneScreen>
  );
}
