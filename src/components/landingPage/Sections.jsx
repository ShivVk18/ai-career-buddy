import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Link2, ShieldCheck, Target, Gauge, Check, ScrollText, ClipboardCheck, Sparkles, FileText, BrainCircuit, Mail } from "lucide-react";
import Reveal from "./Reveal";

const WHY = [
  { icon: Link2, title: "Sourced edits", desc: "Every change points back to your resume, profile or the job.", hot: true },
  { icon: Target, title: "Built for one job", desc: "Match, resume, letter and prep all run against the role you paste." },
  { icon: ShieldCheck, title: "You stay in control", desc: "Nothing is sent without you. Accept, edit or reject each change." },
  { icon: Gauge, title: "Six tools, one memory", desc: "Gaps from your ATS scan feed your roadmap and interview practice." },
];

export function WhyRow() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {WHY.map((w, i) => (
        <Reveal as="li" key={w.title} delay={i * 60}>
          <div className={`group relative h-full overflow-hidden rounded-2xl border p-6 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_14px_30px_-12px_rgba(30,60,160,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${w.hot ? "lp-shimmer border-sky-solid bg-sky-solid text-white" : "border-sky-tint-line bg-sky-tint text-text"}`}>
            <span className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:transform-none ${w.hot ? "bg-white/20 text-white" : "bg-panel text-primary-ink"}`}>
              <w.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mb-1.5 text-lg font-semibold tracking-tight">{w.title}</h3>
            <p className={`text-sm leading-relaxed ${w.hot ? "text-white/90" : "text-muted"}`}>{w.desc}</p>
          </div>
        </Reveal>
      ))}
    </ul>
  );
}

function Tag() {
  return <span className="rounded-full border border-line bg-panel px-2 py-0.5 text-[10px] font-medium text-muted">sample</span>;
}

function Chip({ children }) {
  return <span className="rounded-full bg-sky-tint px-2 py-0.5 text-[11px] text-primary-ink">{children}</span>;
}

const CHECKS = [["Keywords match", true], ["Single-column layout", true], ["Measurable results", false]];
const RUBRIC = [["Structure", 4], ["Evidence", 3], ["Clarity", 5]];
const ROAD = ["Learn design systems", "Ship a case study", "Practise critique"];

const CARDS = [
  { name: "Resume builder", href: "/resume", icon: ScrollText, span: "md:col-span-4", desc: "Tracked changes with sources, accepted one by one.",
    prev: (
      <p className="rounded-xl border border-line bg-panel p-3 text-sm leading-relaxed">
        <s className="bt-strike text-faint">Responsible for improving the checkout page.</s>{" "}
        <ins className="bt-ins rounded bg-lime/30 px-1 no-underline">Redesigned checkout, cutting drop-off by 12%.</ins>{" "}
        <span className="mt-2 flex gap-1.5"><Chip>resume</Chip><Chip>job post</Chip></span>
      </p>
    ) },
  { name: "ATS scanner", href: "/resume-parser", icon: ClipboardCheck, span: "md:col-span-2", desc: "A score and sourced fixes.",
    prev: (
      <ul className="space-y-1.5 rounded-xl border border-line bg-panel p-3 text-xs">
        {CHECKS.map(([l, ok], i) => (
          <li key={l} className="flex items-center gap-2"><span className={`flex h-4 w-4 items-center justify-center rounded-full ${ok ? "bg-lime text-lime-foreground" : "border border-line text-faint"}`}>{ok && <Check style={{ "--i": i }} className="bt-tick h-3 w-3" aria-hidden="true" />}</span>{l}</li>
        ))}
      </ul>
    ) },
  { name: "Interview prep", href: "/interview", icon: Sparkles, span: "md:col-span-2", desc: "Scored against a rubric.",
    prev: (
      <ul className="space-y-1.5 rounded-xl border border-line bg-panel p-3 text-xs">
        {RUBRIC.map(([l, n], i) => (
          <li key={l} className="flex items-center gap-2"><span className="w-16">{l}</span><span className="h-1.5 flex-1 rounded-full bg-soft"><span className="bt-bar block h-1.5 rounded-full bg-sky-solid" style={{ width: `${n * 20}%`, "--i": i }} /></span>{n}/5</li>
        ))}
      </ul>
    ) },
  { name: "Career roadmap", href: "/roadmap", icon: BrainCircuit, span: "md:col-span-2", desc: "Steps tied to your own gaps.",
    prev: (
      <ol className="space-y-1.5 rounded-xl border border-line bg-panel p-3 text-xs">
        {ROAD.map((r, i) => <li key={r} className="flex items-center gap-2" style={{ "--i": i }}><span className={`bt-badge relative flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${i < 2 ? "bt-done bg-lime text-lime-foreground" : "bg-sky-tint text-primary-ink"}`}><span className="bt-num">{i + 1}</span>{i < 2 && <Check className="bt-tick absolute h-3 w-3" aria-hidden="true" />}</span>{r}</li>)}
      </ol>
    ) },
  { name: "Cover letter", href: "/cover-letter", icon: FileText, span: "md:col-span-2", desc: "Tone, cliché flags, 250 to 350 words.",
    prev: (
      <div className="rounded-xl border border-line bg-panel p-3 font-doc text-sm leading-relaxed">
        Dear Northwind team, your checkout work caught my eye&hellip;
        <span className="mt-2 flex gap-1.5 font-sans"><Chip>profile</Chip><Chip>job post</Chip></span>
      </div>
    ) },
  { name: "Cold email", href: "/cold-email", icon: Mail, span: "md:col-span-2", desc: "Opens in your own mail app.",
    prev: (
      <p className="rounded-xl border border-line bg-panel p-3 text-xs leading-relaxed text-muted">Subject: Checkout redesign, quick question<br />Hi Sam, I read your case study&hellip;</p>
    ) },
];

export function Bento() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
      {CARDS.map((c, i) => (
        <Reveal key={c.name} delay={i * 50} className={c.span}>
          <Link href={c.href} className="group flex h-full flex-col gap-4 rounded-2xl border border-line bg-panel p-5 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-tint text-primary-ink"><c.icon className="h-4 w-4" aria-hidden="true" /></span>
              <h3 className="text-base font-semibold tracking-tight">{c.name}</h3>
              <ArrowRight className="ml-auto h-4 w-4 -rotate-45 text-muted transition-transform group-hover:rotate-0 motion-reduce:transform-none" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted">{c.desc}</p>
            <div className="mt-auto rounded-xl bg-soft p-3">
              <div className="mb-2 flex justify-end"><Tag /></div>
              {c.prev}
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

const SPOKES = [
  { name: "Checker", role: "Matches requirements", pos: "left-[4%] top-[6%]", line: "M50 50 L16 16", dx: "-34%", dy: "-34%" },
  { name: "Tailor", role: "Proposes resume edits", pos: "right-[4%] top-[6%]", line: "M50 50 L84 16", dx: "34%", dy: "-34%" },
  { name: "Writer", role: "Drafts letter and email", pos: "left-[4%] bottom-[6%]", line: "M50 50 L16 84", dx: "-34%", dy: "34%" },
  { name: "Connector", role: "Finds who to contact", pos: "right-[4%] bottom-[6%]", line: "M50 50 L84 84", dx: "34%", dy: "34%" },
];

export function BotHub() {
  return (
    <Reveal className="relative mx-auto h-[28rem] max-w-3xl rounded-3xl border border-sky-tint-line bg-sky-tint sm:h-[26rem]">
      <svg className="absolute inset-0 h-full w-full text-sky-solid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {SPOKES.map((s, i) => <path key={s.name} d={s.line} pathLength="1" className="hub-line" style={{ "--i": i }} stroke="currentColor" strokeWidth="0.4" strokeLinecap="round" fill="none" opacity="0.5" />)}
      </svg>
      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-sky-solid bg-panel text-center shadow-card">
        <Image src="/pip/pip-coffee.svg" alt="" width={40} height={40} unoptimized style={{ imageRendering: "pixelated" }} />
        <span className="text-sm font-semibold">Pip</span>
      </div>
      {SPOKES.map((s) => (
        <div key={s.name + "-dot"} className="hub-dot" style={{ "--i": SPOKES.indexOf(s), "--dx": s.dx, "--dy": s.dy }} aria-hidden="true" />
      ))}
      {SPOKES.map((s, i) => (
        <div key={s.name} style={{ "--i": i }} className={`hub-node absolute ${s.pos} w-36 rounded-2xl border border-line bg-panel p-3 text-center shadow-card sm:w-44`}>
          <p className="text-sm font-semibold">{s.name}</p>
          <p className="text-xs text-muted">{s.role}</p>
        </div>
      ))}
    </Reveal>
  );
}

export function Pricing() {
  const free = ["Up to 50 AI actions per day", "Open-question interview practice", "Resume tailoring and ATS fixes", "Cover letters and cold emails grounded in your details", "Pip, your AI career assistant"];
  return (
    <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
      <Reveal>
        <div className="h-full rounded-3xl border-2 border-sky-solid bg-panel p-6 shadow-card transition-shadow duration-300 hover:shadow-[0_0_0_4px_rgba(47,85,217,0.12),0_0_36px_-6px_rgba(47,85,217,0.45)] sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xl font-bold tracking-tight">Free</p>
          <span className="rounded-full bg-lime px-3 py-1 text-xs font-semibold text-lime-foreground">Available now</span>
        </div>
        <ul className="mb-8 space-y-3 text-sm">
          {free.map((f) => <li key={f} className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" /> {f}</li>)}
        </ul>
        <Link href="/dashboard" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-solid text-sm font-medium text-white transition duration-200 hover:opacity-90 active:scale-[0.98]">Get started free</Link>
        </div>
      </Reveal>
      <Reveal delay={60} className="rounded-3xl border border-line bg-soft p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-xl font-bold tracking-tight">Pro</p>
          <span className="rounded-full border border-line px-3 py-1 text-xs font-medium text-muted">Planned</span>
        </div>
        <p className="mb-8 text-sm text-muted">No price and no date yet. We will say so here when a paid plan exists.</p>
        <button type="button" disabled className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-xl border border-line text-sm font-medium text-muted opacity-70">Not available yet</button>
      </Reveal>
    </div>
  );
}
