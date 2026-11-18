import Image from "next/image";
import { Link2, Check, Loader2, Circle, FileText, Target, Mail, PenLine, Mic, Map } from "lucide-react";

export function HeroGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-0 h-[34rem] w-[48rem] max-w-[140%] -translate-x-1/2 -translate-y-1/4 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.22),rgba(56,189,248,0.12)_55%,transparent)] blur-2xl dark:opacity-60" />
    </div>
  );
}

const CHIPS = [
  { Icon: FileText, label: "Resume", rot: "sm:-rotate-2" },
  { Icon: Target, label: "ATS scan", rot: "sm:rotate-1" },
  { Icon: Mail, label: "Cold email", rot: "sm:-rotate-1" },
  { Icon: PenLine, label: "Cover letter", rot: "sm:rotate-2" },
  { Icon: Mic, label: "Interview", rot: "sm:-rotate-1" },
  { Icon: Map, label: "Roadmap", rot: "sm:rotate-1" },
];

export function ToolChips() {
  return (
    <ul className="mx-auto mt-10 flex max-w-xl flex-wrap justify-center gap-2" aria-label="Tools">
      {CHIPS.map(({ Icon, label, rot }) => (
        <li key={label} className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-medium text-text shadow-sm ${rot}`}>
          <Icon className="h-3.5 w-3.5 text-primary-ink" aria-hidden="true" /> {label}
        </li>
      ))}
    </ul>
  );
}

const STEPS = [
  { name: "Match", note: "Requirements pulled out", state: "done" },
  { name: "Tailor", note: "3 edits proposed", state: "done" },
  { name: "Writer", note: "Cover letter drafting", state: "active" },
  { name: "Prep", note: "Waiting", state: "todo" },
];

const NEEDS = [
  { pip: true, text: "Tailor proposed 3 edits for Product Designer at Northwind (fictional)", meta: "2 min ago" },
  { initials: "WR", text: "Cover letter ready to review", meta: "Writer step" },
  { initials: "BF", text: "Follow-up due: Brightfork, applied 5 days ago", meta: "Reminder" },
];

function Col({ label, children }) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      {children}
    </div>
  );
}

export default function HeroWindow() {
  return (
    <figure className="relative mx-auto w-full max-w-5xl text-left" aria-label="Sample product window">
      <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_24px_60px_-28px_rgba(30,30,80,0.35)]">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-soft px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
          </span>
          <span className="truncate text-xs text-muted">Product Designer · Northwind (fictional)</span>
          <span className="shrink-0 rounded-full border border-line bg-panel px-2 py-0.5 text-[10px] font-medium text-muted">sample</span>
        </div>

        <div className="grid divide-y divide-line lg:grid-cols-[1fr_1.1fr_1.5fr] lg:divide-x lg:divide-y-0">
          <Col label="1 · Paste a job">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-muted">
              <Link2 className="h-4 w-4 shrink-0 text-primary-ink" aria-hidden="true" />
              <span className="truncate">northwind.example/jobs/product-designer</span>
            </div>
            <p className="text-xs leading-relaxed text-muted">A link or the pasted description. Pip lists the requirements and checks them against your resume.</p>
          </Col>

          <Col label="2 · Bots work">
            <ol className="space-y-2.5">
              {STEPS.map((s) => (
                <li key={s.name} className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.state === "done" ? "bg-lime text-lime-foreground" : s.state === "active" ? "bg-primary text-white" : "border border-line text-faint"}`}>
                    {s.state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : s.state === "active" ? <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" /> : <Circle className="h-2.5 w-2.5" aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 text-sm leading-tight">
                    <span className="font-medium text-text">{s.name}</span>
                    <span className="block text-xs text-muted">{s.note}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Col>

          <Col label="3 · Needs you">
            <ul className="space-y-2">
              {NEEDS.map((n) => (
                <li key={n.text} className="flex items-center gap-3 rounded-xl border border-line bg-bg p-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soft text-[11px] font-semibold text-primary-ink">
                    {n.pip ? <Image src="/pip/pip-coffee.svg" alt="" width={22} height={22} unoptimized style={{ imageRendering: "pixelated" }} /> : n.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-snug text-text">{n.text}</span>
                    <span className="block text-xs text-muted">{n.meta}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Col>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">Sample data with made-up names</figcaption>
    </figure>
  );
}
