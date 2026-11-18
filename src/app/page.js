import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ClipboardPaste,
  Bot,
  ThumbsUp,
  Send,
  ScrollText,
  ClipboardCheck,
  Sparkles,
  FileText,
  Mail,
  BrainCircuit,
  ShieldCheck,
  Trash2,
  Link2,
  ChevronDown,
} from "lucide-react";
import LandingNav from "@/components/landingPage/LandingNav";
import SampleDemo from "@/components/landingPage/SampleDemo";
import { BackgroundGrid } from "@/components/ui/aceternity/background-grid";
import { TextGenerateEffect } from "@/components/ui/aceternity/text-generate-effect";
import { HoverBorderGradient } from "@/components/ui/aceternity/hover-border-gradient";
import { BentoGrid, BentoGridItem } from "@/components/ui/aceternity/bento-grid";
import { GlowCard } from "@/components/ui/aceternity/glow-card";

const STEPS = [
  { icon: ClipboardPaste, title: "paste a job", desc: "A link or the description text. Pip pulls out the requirements." },
  { icon: Bot, title: "bots work", desc: "Match, resume edits, cover letter and prep run for that job, step by step." },
  { icon: ThumbsUp, title: "you approve", desc: "Review tracked changes with sources. Accept, edit or reject each one." },
  { icon: Send, title: "you apply", desc: "You send it yourself. Nothing leaves the app without you." },
];

const TOOLS = [
  { name: "resume builder", href: "/resume", icon: ScrollText, span: "md:col-span-2", desc: "A paper document with match highlights, struck weak lines, and source chips pointing back to your resume, profile and the job description." },
  { name: "ats scanner", href: "/resume-parser", icon: ClipboardCheck, desc: "A score per role, with sourced fixes you can accept for a real re-score." },
  { name: "interview prep", href: "/interview", icon: Sparkles, desc: "One question at a time, scored against a rubric with evidence quotes and timers." },
  { name: "cover letter", href: "/cover-letter", icon: FileText, desc: "Pick a tone, get clichés flagged as you edit, and aim for 250 to 350 words." },
  { name: "cold email", href: "/cold-email", icon: Mail, desc: "A 100 to 140 word note with matched projects, opened in your own mail app." },
  { name: "career roadmap", href: "/roadmap", icon: BrainCircuit, span: "md:col-span-3", desc: "Phase-by-phase steps tied to the gaps in your own ATS results, with progress you can undo." },
];

const TRUST = [
  { icon: Link2, title: "every line has a source", desc: "Edits show where they came from: your resume, your profile or the job description, so you can check each one." },
  { icon: ShieldCheck, title: "it never sends for you", desc: "Cold emails open in your mail app. You submit applications yourself. Pip drafts, you decide." },
  { icon: Trash2, title: "your data, your call", desc: "Delete all your data, or your whole account, from settings at any time." },
];

const FAQS = [
  { q: "why not just use a general ai chat?", a: "General chat tools will happily invent metrics and fill your resume with clichés. Pip works from what you provide, strikes weak lines, asks for measurable evidence, and adds a source to each change so you can defend every word in an interview." },
  { q: "are the six tools connected?", a: "Yes. Gaps found in your ATS results feed your roadmap, which ranks gaps by frequency and shows which gaps each step closes. Interview practice can use a job description you paste in. Each tool works from your profile and what you give it." },
  { q: "can i download my resume as a pdf?", a: "Yes. The paper document editor exports a clean, ATS-friendly PDF with no watermark." },
  { q: "what does the dashboard sky mean?", a: "The pixel sky mirrors your real job search. It starts at dawn, moves toward noon as you apply, turns to sunset while you interview, and shows stars when an offer comes in." },
];

function Pip({ name = "coffee", size = 24, className = "" }) {
  return (
    <Image src={`/pip/pip-${name}.svg`} alt="" width={size} height={size} style={{ imageRendering: "pixelated" }} unoptimized className={className} />
  );
}

function SectionHead({ id, eyebrow, title, sub }) {
  return (
    <div id={id} className="mx-auto mb-10 max-w-2xl scroll-mt-24 text-center">
      <span className="mb-3 inline-block rounded-full bg-pip-soft px-3 py-1 text-xs font-medium text-pip-ink">{eyebrow}</span>
      <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-sm text-muted sm:text-base">{sub}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg font-sans text-text selection:bg-lime selection:text-lime-foreground">
      <LandingNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <BackgroundGrid />
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs text-muted shadow-card">
              <Pip name="coffee" size={18} /> pip, your ai career assistant
            </span>
            <h1 className="mb-5 text-4xl font-bold leading-[1.05] tracking-tight text-text sm:text-6xl">
              <TextGenerateEffect words="nothing invented. every line cites a source." />
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Paste a job and Pip tailors your resume, cover letter and interview prep from what you actually provide. You review every change before anything is used.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <HoverBorderGradient as={Link} href="/dashboard" containerClassName="w-full sm:w-auto">
                start free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </HoverBorderGradient>
              <a href="#sample" className="btn-pill-secondary min-h-11 w-full text-sm sm:w-auto">see a sample</a>
            </div>
            <p className="mt-4 text-xs text-muted">free to start - up to 50 AI actions a day</p>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHead id="how" eyebrow="how it works" title="from job link to application, in four steps" />
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <GlowCard className="h-full p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pip-soft text-primary-ink">
                      <s.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-pixel text-sm text-muted">0{i + 1}</span>
                  </div>
                  <h3 className="mb-1 text-base font-semibold text-text">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{s.desc}</p>
                </GlowCard>
              </li>
            ))}
          </ol>
        </section>

        {/* Tools bento */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHead id="tools" eyebrow="six tools, one memory" title="everything for one job, in one place" sub="Each tool works from your profile and what you give it, and they share what they find." />
          <BentoGrid>
            {TOOLS.map((t) => (
              <BentoGridItem
                key={t.name}
                as={Link}
                href={t.href}
                className={t.span}
                icon={<t.icon className="h-5 w-5 text-primary-ink" aria-hidden="true" />}
                title={t.name}
                description={t.desc}
              >
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-ink">
                  open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/glow:translate-x-0.5" aria-hidden="true" />
                </span>
              </BentoGridItem>
            ))}
          </BentoGrid>
        </section>

        {/* Sample preview */}
        <section className="px-4 py-16 sm:px-6">
          <SectionHead id="sample" eyebrow="product preview" title="what a tailored resume looks like" sub="This is a sample with made-up names and numbers, shown to explain the format." />
          <SampleDemo />
        </section>

        {/* Trust */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <SectionHead id="trust" eyebrow="trust" title="built so you stay in control" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {TRUST.map((t) => (
              <GlowCard key={t.title} className="p-6">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-lime text-lime-foreground">
                  <t.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mb-1 text-base font-semibold text-text">{t.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{t.desc}</p>
              </GlowCard>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <SectionHead id="pricing" eyebrow="pricing" title="free while we build" />
          <GlowCard className="p-6 sm:p-8">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-xl font-semibold text-text">free</h3>
              <span className="text-sm text-muted">paid plans are planned, not available yet</span>
            </div>
            <ul className="mb-6 grid grid-cols-1 gap-3 text-sm text-text sm:grid-cols-2">
              {["Up to 50 AI actions per day", "Open-question interview practice", "Resume tailoring and ATS fixes", "Cover letters and cold emails grounded in your details", "Pip, your AI career assistant"].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/dashboard" className="btn-pill-primary min-h-11 text-sm">start free</Link>
          </GlowCard>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <SectionHead id="faq" eyebrow="faq" title="questions, answered" />
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-panel shadow-card">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-sm font-medium text-text [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-line bg-panel px-6 py-14 text-center shadow-card">
            <BackgroundGrid />
            <div className="relative z-10">
              <Pip name="rocket" size={40} className="mx-auto mb-4" />
              <h2 className="mb-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">ready for your next role?</h2>
              <p className="mx-auto mb-6 max-w-md text-sm text-muted">No hype words and no generic templates. Just your work, sharpened for the job.</p>
              <Link href="/dashboard" className="btn-pill-primary min-h-11 px-7 text-sm">start free with pip</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-panel px-4 py-10 text-xs text-muted sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <Pip name="coffee" size={20} />
            <span className="font-semibold text-text">ascendai</span>
            <span aria-hidden="true">-</span>
            <span>pip by stick it up (mit)</span>
          </div>
          <nav aria-label="Tools" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/resume" className="hover:text-text">resume builder</Link>
            <Link href="/interview" className="hover:text-text">interview prep</Link>
            <Link href="/cover-letter" className="hover:text-text">cover letter</Link>
            <Link href="/cold-email" className="hover:text-text">cold email</Link>
            <Link href="/roadmap" className="hover:text-text">career roadmap</Link>
            <Link href="/resume-parser" className="hover:text-text">ats scanner</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
