"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import PipAvatar from "@/components/ui/PipAvatar";
import { cn } from "@/lib/utils";

const STATUS_LABEL = { SAVED: "saved", APPLIED: "applied", INTERVIEWING: "interviewing", OFFER: "offer", CLOSED: "closed" };
const BOT_LABEL = { running: "bots working", needs_you: "needs you", done: "drafts ready", failed: "bot stuck" };

function Section({ title, hint, action, children }) {
  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-text">
          {title}
          {hint != null && <span className="ml-2 text-sm font-normal text-muted">{hint}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const rowLink = "flex min-h-14 items-center justify-between gap-3 rounded-[14px] border border-line bg-panel px-4 py-3 transition-colors hover:border-brand/50 active:bg-soft";
const textLink = "inline-flex min-h-11 items-center gap-1 text-sm text-muted hover:text-text sm:min-h-8";

export function NeedsYou({ needsYou, followUps = [] }) {
  const items = needsYou?.items || [];
  const count = (needsYou?.count ?? 0) + followUps.length;
  if (!count) return null;
  const rows = [
    ...items.map((it) => ({ id: it.id, href: it.href, title: it.title, sub: [it.company, it.jobTitle].filter(Boolean).join(" · ") || "review" })),
    // Cold-email reminders you set (the old "follow-ups due" card): open the email to send or reschedule it.
    ...followUps.map((f) => ({
      id: `fu-${f.id}`,
      href: f.href,
      title: `follow up: ${f.subject || "cold email"}`,
      sub: [f.recipientName && `to ${f.recipientName}`, [f.company, f.role].filter(Boolean).join(" · "), `due ${new Date(f.followUpAt).toLocaleDateString(undefined, { timeZone: "UTC" })}`].filter(Boolean).join(" · "),
    })),
  ];
  return (
    <Section title="needs you" hint={count} action={<Link href="/needs-you" className={textLink}>see all <ChevronRight className="size-3.5" aria-hidden="true" /></Link>}>
      <ul className="space-y-2">
        {rows.slice(0, 4).map((it, i) => (
          <li key={`${it.id}:${it.href}:${i}`}>
            <Link href={it.href} className={rowLink}>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-text">{it.title}</span>
                <span className="block truncate text-xs text-muted">{it.sub}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Applications({ applications }) {
  if (!applications.length) return null;
  const shown = applications.filter((a) => a.status !== "CLOSED").slice(0, 6);
  return (
    <Section title="applications" hint={shown.length} action={<Link href="/applications" className={textLink}>all applications <ChevronRight className="size-3.5" aria-hidden="true" /></Link>}>
      <ul className="space-y-2">
        {shown.map((a) => (
          <li key={a.id} className="flex flex-col gap-2 rounded-[14px] border border-line bg-panel px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
            <Link href={`/jobs/${a.job.id}`} className="min-w-0 flex-1 rounded-sm">
              <span className="block truncate text-sm font-medium text-text">
                {a.job.title || "role not set"} <span className="text-muted">· {a.job.company || "company not set"}</span>
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <span className="rounded-[7px] bg-soft px-2 py-0.5 text-text">{STATUS_LABEL[a.status] || a.status.toLowerCase()}</span>
                {BOT_LABEL[a.bot?.state] && <span>{BOT_LABEL[a.bot.state]}</span>}
              </span>
            </Link>
            {a.nextAction && (
              <Link href={a.nextAction.href} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-ink-foreground transition hover:opacity-90 sm:min-h-9">
                {a.nextAction.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function WeekTasks({ tasks }) {
  if (!tasks.length) return null;
  return (
    <Section title="this week" action={<Link href="/roadmap" className={textLink}>roadmap <ChevronRight className="size-3.5" aria-hidden="true" /></Link>}>
      <ul className="space-y-2">
        {tasks.slice(0, 4).map((t) => (
          <li key={`${t.roadmapId}-${t.stepId}`}>
            <Link href={t.href} className={rowLink}>
              <span className="min-w-0 truncate text-sm text-text">{t.title}</span>
              {t.roadmapTitle && <span className="hidden shrink-0 rounded-[7px] bg-soft px-2 py-0.5 text-xs text-muted sm:inline">{t.roadmapTitle}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const jobHref = (apps, id) => {
  const a = apps.find((x) => x.id === id);
  return a ? `/jobs/${a.job.id}` : "/applications";
};

const DOT = { running: "bg-brand animate-pulse motion-reduce:animate-none", needs_you: "bg-warning", failed: "bg-danger", done: "bg-brand" };

export function BotRow({ bots, applications = [] }) {
  const items = bots?.items || [];
  if (!items.length) return null;
  const parts = [
    bots.running && `${bots.running} working`,
    bots.needsYou && `${bots.needsYou} need you`,
    bots.failed && `${bots.failed} stuck`,
    bots.done && `${bots.done} done`,
  ].filter(Boolean);
  return (
    <section aria-label="bot team" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] bg-soft px-4 py-3">
      <PipAvatar outfit="detective" size="sm" working={bots.running > 0} alt="" />
      <span className="text-sm text-text">your bots: <span className="text-muted">{parts.join(" · ")}</span></span>
      <ul className="flex flex-wrap gap-2">
        {items.slice(0, 4).map((b) => (
          <li key={b.applicationId}>
            <Link href={jobHref(applications, b.applicationId)} className="inline-flex min-h-11 items-center gap-1.5 rounded-[9px] bg-panel px-3 text-xs text-text sm:min-h-8">
              <span className={cn("size-1.5 rounded-full", DOT[b.state] || "bg-faint")} aria-hidden="true" />
              <span className="max-w-32 truncate">{b.company || b.title || "job"}</span>
              <span className="text-muted">{b.completedCount}/{b.total}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Old "other targets from your documents": companies and roles found in your letters, emails and ats checks. */
export function Targets({ targets = [], total, onAdd }) {
  const [state, setState] = useState({}); // id -> "adding" | "added" | error text
  if (!targets.length) return null;
  const add = async (t) => {
    setState((m) => ({ ...m, [t.key]: "adding" }));
    const msg = await onAdd(t);
    setState((m) => ({ ...m, [t.key]: msg === true ? "added" : msg }));
  };
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-sm text-sm text-muted hover:text-text [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
        other targets from your documents ({total ?? targets.length})
      </summary>
      <ul className="mt-2 space-y-2">
        {targets.map((t) => {
          const st = state[t.key];
          return (
            <li key={t.key} className="flex items-center gap-3 rounded-[14px] border border-line bg-panel px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-text">
                  {t.role || "role not set"} <span className="text-muted">· {t.company || "company not set"}</span>
                </span>
                <span className="block truncate text-xs text-muted">
                  {typeof st === "string" && st !== "adding" && st !== "added"
                    ? st
                    : [t.ats && `ats ${t.ats.score}/100`, t.coverLetter && "cover letter", t.coldEmail && "cold email"].filter(Boolean).join(" · ") || "from your documents"}
                </span>
              </span>
              <button
                type="button"
                disabled={st === "adding" || st === "added"}
                onClick={() => add(t)}
                className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-4 text-sm font-medium text-text transition hover:border-brand/50 disabled:opacity-60 sm:min-h-9"
              >
                {st === "adding" ? "adding…" : st === "added" ? "added" : "add as job"}
              </button>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
