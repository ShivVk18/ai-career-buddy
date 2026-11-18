import { Link2, Check, Loader2, Circle, ScrollText, ClipboardCheck, Sparkles, FileText, Mail, BrainCircuit, Inbox } from "lucide-react";

const NAV = [
  { Icon: ScrollText, label: "Resume" },
  { Icon: ClipboardCheck, label: "ATS scan" },
  { Icon: Sparkles, label: "Interview" },
  { Icon: FileText, label: "Cover letter" },
  { Icon: Mail, label: "Cold email" },
  { Icon: BrainCircuit, label: "Roadmap" },
];

const STEPS = [
  { name: "Match", state: "done" },
  { name: "Tailor", state: "done" },
  { name: "Write", state: "active" },
  { name: "Prep", state: "todo" },
];

const APPS = [
  { role: "Product Designer", co: "Northwind", status: "Drafting" },
  { role: "Frontend Engineer", co: "Brightfork", status: "Applied" },
  { role: "UX Researcher", co: "Lumenly", status: "Saved" },
];

// Tilted app window mock, built from divs. Fictional data, labelled sample.
export default function HeroWindow() {
  return (
    <figure className="lp-win-in relative mx-auto w-full max-w-xl text-left [perspective:1600px] lg:max-w-none" aria-label="Sample product window">
      <div className="lp-float overflow-hidden rounded-2xl border border-white/40 bg-panel text-text shadow-[0_40px_80px_-30px_rgba(10,20,90,0.6)] motion-safe:lg:[transform:rotateY(-12deg)_rotateX(4deg)] lg:origin-left">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-soft px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
          </span>
          <span className="truncate text-xs text-muted">ascend · dashboard</span>
          <span className="shrink-0 rounded-full border border-line bg-panel px-2 py-0.5 text-[10px] font-medium text-muted">sample</span>
        </div>
        <div className="grid grid-cols-[auto_1fr]">
          <aside className="hidden w-36 space-y-1 border-r border-line bg-soft/60 p-3 sm:block" aria-hidden="true">
            <p className="mb-2 flex items-center gap-2 rounded-lg bg-sky-solid px-2.5 py-1.5 text-xs font-medium text-white">
              <Inbox className="h-3.5 w-3.5" /> Needs you <span className="ml-auto rounded-full bg-white/25 px-1.5 text-[10px]">3</span>
            </p>
            {NAV.map(({ Icon, label }) => (
              <p key={label} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted">
                <Icon className="h-3.5 w-3.5" /> {label}
              </p>
            ))}
          </aside>
          <div className="min-w-0 space-y-4 p-4 sm:p-5">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Paste a job</p>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-muted">
                <Link2 className="h-4 w-4 shrink-0 text-primary-ink" aria-hidden="true" />
                <span className="truncate">northwind.example/jobs/product-designer</span>
              </div>
            </div>
            <ol className="grid grid-cols-4 gap-2">
              {STEPS.map((s) => (
                <li key={s.name} className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-bg px-1 py-2.5 text-center">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${s.state === "done" ? "bg-lime text-lime-foreground" : s.state === "active" ? "bg-sky-solid text-white" : "border border-line text-faint"}`}>
                    {s.state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : s.state === "active" ? <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" /> : <Circle className="h-2.5 w-2.5" aria-hidden="true" />}
                  </span>
                  <span className="text-xs font-medium">{s.name}</span>
                </li>
              ))}
            </ol>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Applications</p>
              <ul className="divide-y divide-line rounded-xl border border-line">
                {APPS.map((a) => (
                  <li key={a.role} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate"><span className="font-medium">{a.role}</span> <span className="text-muted">· {a.co}</span></span>
                    <span className="shrink-0 rounded-full bg-sky-tint px-2 py-0.5 text-[11px] text-primary-ink">{a.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted lg:text-left">Sample data, fictional companies</figcaption>
    </figure>
  );
}
