"use client";

import Link from "next/link";
import { ArrowRight, RotateCw } from "lucide-react";
import BotStepList from "@/components/ui/BotStepList";
import AppWindow from "@/components/ui/AppWindow";
import PipAvatar from "@/components/ui/PipAvatar";
import SceneScreen from "@/components/ui/SceneScreen";
import Skeleton from "@/components/ui/Skeleton";
import { generationErrorMessage } from "@/components/shared/generationError";

const OUTFIT = { checker: "detective", tailor: "wizard", writer: "thinking", connector: "rocket" };
const DOING = {
  checker: ["scoring the match", "reading the job…"],
  tailor: ["writing your resume", "tailoring from your work…"],
  writer: ["drafting the cover letter", "drafting the letter…"],
  connector: ["writing outreach", "writing outreach…"],
};
const TONE = { good: "brand", warn: "warn", bad: "gap", neutral: "neutral" };
const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-panel px-5 text-sm text-text outline-none transition hover:border-pip focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95 disabled:opacity-60";

function outputLink(s) {
  const ids = s.ids || {};
  switch (s.id) {
    case "checker":
      return { href: "/resume-parser", label: "see ats result" };
    case "tailor":
      return ids.draftId
        ? { href: `/needs-you?item=${encodeURIComponent(`TAILOR_DRAFT:${ids.draftId}`)}`, label: s.needsYou ? "review edits" : "open edits" }
        : null;
    case "writer":
      return ids.coverLetterId ? { href: `/cover-letter/${ids.coverLetterId}`, label: s.needsYou ? "review letter" : "open letter" } : null;
    case "connector":
      return ids.coldEmailId ? { href: `/cold-email/${ids.coldEmailId}`, label: s.needsYou ? "review email" : "open email" } : null;
    default:
      return null;
  }
}

const linkCls = "inline-flex min-h-9 items-center gap-1 rounded text-sm text-brand-ink underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-pip/50";

function PipelineBody({ status, loading, error, retrying, onRetry, cooldown = 0 }) {
  if (loading && !status) {
    return (
      <section aria-label="Pipeline progress" aria-busy="true" className="panel-cozy border border-line bg-panel p-5 sm:p-8 space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </section>
    );
  }
  if (!status) {
    return (
      <section aria-label="Pipeline progress" role="alert" className="panel-cozy border border-line bg-panel p-6 text-center space-y-3">
        <PipAvatar outfit="coffee" size="xl" className="mx-auto" alt="" />
        <p className="text-sm text-muted">{generationErrorMessage(error ? { error } : null, "We couldn't load pip's progress.")}</p>
        <button type="button" onClick={onRetry} className={btn}>
          <RotateCw className="size-4" aria-hidden="true" /> retry
        </button>
      </section>
    );
  }

  const { run, steps } = status;
  const finished = run === "done" || run === "needs_you";
  const failed = steps.find((s) => s.status === "failed");
  const active = failed ? null : steps.find((s) => s.status === "running") || (run === "running" || run === "idle" ? steps.find((s) => s.status === "pending") : null);
  const outfit = failed ? "coffee" : finished ? "coffee" : active ? OUTFIT[active.id] : "coffee";
  const working = !!active && !finished;
  const caption = failed
    ? `${failed.id} hit a snag`
    : finished
      ? "done. your turn."
      : active
        ? DOING[active.id][1]
        : "waiting to start";
  const review = finished ? steps.map(outputLink).find((l, i) => l && steps[i].needsYou) : null;
  const tailorDraftId = status.draftId || steps.find((s) => s.id === "tailor" && s.status === "done")?.ids?.draftId;
  const reviewHref = tailorDraftId ? `/review/${encodeURIComponent(tailorDraftId)}` : null;
  const tailorDone = steps.some((s) => s.id === "tailor" && s.status === "done");
  const reviewReady = !finished && (status.reviewReady ?? tailorDone) && !!reviewHref;

  const rows = steps.map((s) => {
    const isActive = active?.id === s.id;
    const skipped = s.status === "skipped";
    const st = failed?.id === s.id ? "error" : isActive ? "running" : s.status === "done" || skipped ? "done" : "waiting";
    const link = s.status === "done" ? outputLink(s) : null;
    return {
      id: s.id,
      label: s.id,
      detail: DOING[s.id][0],
      status: st,
      chips: s.status === "done" || skipped ? s.chips : [],
      footer: (
        <>
          {failed?.id === s.id && (
            <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-gap-ink">
              <span className="min-w-0 flex-1" role={cooldown > 0 ? "status" : undefined}>
                {cooldown > 0 || s.error?.code === "RATE_LIMITED"
                  ? cooldown > 0
                    ? `pip's ai is busy, trying again in ${cooldown}s`
                    : "pip's ai is busy. you can try again now."
                  : s.error?.code === "PROVIDER_DOWN"
                    ? "pip's ai is down for a moment. try again soon."
                    : generationErrorMessage(s.error, "This step failed. Try again.")}
              </span>
              <button type="button" onClick={onRetry} disabled={retrying || cooldown > 0} className={btn}>
                <RotateCw className={`size-4 ${retrying ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" /> retry
              </button>
            </div>
          )}
          {skipped && s.chips.some((c) => /resume/i.test(c.label)) && (
            <Link href="/resume" className={linkCls}>
              add your resume
            </Link>
          )}
          {link && (
            <Link href={link.href} className={linkCls}>
              {link.label} <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          )}
        </>
      ),
    };
  });

  return (
    <section aria-label="Pipeline progress">
      <AppWindow title="ascendai · pip is working" className="relative" bodyClassName="p-5 sm:px-12 sm:py-9">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
          <div className="flex flex-col items-center gap-4 text-center md:order-2 md:w-[260px] md:shrink-0 md:pt-4">
            <PipAvatar outfit={outfit} size={170} working={working} alt="" />
            <p className="font-pixel text-xl font-medium text-text" role="status" aria-live="polite">
              {caption}
            </p>
            {error && <p className="text-xs text-muted">we lost the connection. showing the last update.</p>}
          </div>
          <div className="min-w-0 flex-1 md:order-1">
            <BotStepList steps={rows} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          {finished ? (
            <>
              <p className="text-sm text-muted">everything is drafted. nothing is sent until you say so.</p>
              <Link href={reviewHref || review?.href || "/needs-you"} className="btn-pill-primary inline-flex min-h-11 items-center gap-2 px-6 text-sm">
                review what pip made <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </>
          ) : reviewReady ? (
            <>
              <p className="text-sm text-muted">{failed ? "your resume is ready. retry the other steps above." : "your resume is ready. the letter and outreach are still being written."}</p>
              <Link href={reviewHref} className="btn-pill-primary inline-flex min-h-11 items-center gap-2 px-6 text-sm">
                review your resume <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </>
          ) : failed ? (
            <p className="text-sm text-muted">the other steps are saved. retry picks up where pip stopped.</p>
          ) : (
            <>
              <p className="text-sm text-muted">you can leave, we&apos;ll notify you when it&apos;s ready.</p>
              <Link href="/dashboard" className={btn}>
                back to home
              </Link>
            </>
          )}
        </div>
      </AppWindow>
    </section>
  );
}

/** Pipeline progress on the shared full-bleed scene: pink while the run is active, calm morning once it settles. */
export default function PipelineProgress(props) {
  const run = props.status?.run;
  const active = !props.status || run === "running" || run === "idle";
  return (
    <SceneScreen variant={active ? "pink" : "morning"} seed={303} label="pip's work on this job" className="min-h-0 !mb-0 !pb-8 sm:!pb-10">
      <PipelineBody {...props} />
    </SceneScreen>
  );
}
