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
import HeroWindow from "@/components/landingPage/HeroWindow";
import Reveal from "@/components/landingPage/Reveal";
import { WhyRow, Bento, BotHub, Pricing } from "@/components/landingPage/Sections";

const STEPS = [
  { icon: ClipboardPaste, title: "paste a job", desc: "A link or the description text. Pip pulls out the requirements." },
  { icon: Bot, title: "bots work", desc: "Match, resume edits, cover letter and prep run for that job, step by step." },
  { icon: ThumbsUp, title: "you approve", desc: "Review tracked changes with sources. Accept, edit or reject each one." },
  { icon: Send, title: "you apply", desc: "You send it yourself. Nothing leaves the app without you." },
];

const TOOLS = [
  { name: "resume builder", href: "/resume", icon: ScrollText, span: "md:col-span-4 md:row-span-2", desc: "A paper document with match highlights, struck weak lines, and source chips pointing back to your resume, profile and the job description." },
  { name: "ats scanner", href: "/resume-parser", icon: ClipboardCheck, span: "md:col-span-2", desc: "A score per role, with sourced fixes you can accept for a real re-score." },
  { name: "interview prep", href: "/interview", icon: Sparkles, span: "md:col-span-2", desc: "One question at a time, scored against a rubric with evidence quotes and timers." },
  { name: "cover letter", href: "/cover-letter", icon: FileText, span: "md:col-span-2", desc: "Pick a tone, get clichés flagged as you edit, and aim for 250 to 350 words." },
  { name: "cold email", href: "/cold-email", icon: Mail, span: "md:col-span-2", desc: "A 100 to 140 word note with matched projects, opened in your own mail app." },
  { name: "career roadmap", href: "/roadmap", icon: BrainCircuit, span: "md:col-span-4", desc: "Phase-by-phase steps tied to the gaps in your own ATS results, with progress you can undo." },
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

const INPUTS = ["Your resume PDF", "Pasted job posts", "Job links", "Your profile", "Interview practice", "Roadmap"];

function SectionHead({ id, eyebrow, children, sub }) {
  return (
    <Reveal id={id} className="mx-auto mb-12 max-w-2xl scroll-mt-24 text-center">
      <p className="mb-4 inline-flex rounded-full border border-line bg-panel px-3 py-1 text-xs font-medium text-primary-ink">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight text-text sm:text-5xl">{children}</h2>
      {sub && <p className="mx-auto mt-4 max-w-lg text-muted">{sub}</p>}
    </Reveal>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-bg font-sans text-text selection:bg-lime selection:text-lime-foreground">
      <main>
        {/* Hero */}
        <section className="hero-sky relative overflow-hidden pb-16 text-white sm:pb-24">
          <LandingNav />
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
            <div className="text-center lg:text-left">
              <p className="glass mb-6 inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium sm:text-sm">
                AI career copilot · every line cites a source
              </p>
              <h1 className="text-balance text-[clamp(2.5rem,7vw,4.5rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
                Land your next job, <em className="font-doc font-normal italic">without the busywork</em>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg lg:mx-0">
                Paste a job and Pip tailors your resume, letter and prep from what you provide. You approve every change before anything is sent.
              </p>
              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/dashboard" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-sky-solid transition hover:bg-white/90 sm:w-auto">
                  Get started free <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href="#how" className="glass inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 text-sm font-medium text-white transition hover:bg-white/20 sm:w-auto">
                  See how it works
                </a>
              </div>
              <p className="mt-4 text-xs text-white/85">Free to start, up to 50 AI actions a day</p>
            </div>
            <HeroWindow />
          </div>
        </section>

        {/* Why ascend */}
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6 sm:pt-24">
          <SectionHead id="why" eyebrow="Why ascend">
            Made for one job at a time
          </SectionHead>
          <WhyRow />
        </section>

        {/* Inputs */}
        <div className="px-4 pb-8 pt-8 text-center sm:px-6">
          <p className="mb-4 text-sm text-muted">Works from what you already have</p>
          <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
            {INPUTS.map((c) => (
              <li key={c} className="rounded-full border border-line bg-panel px-3.5 py-1.5 text-sm text-text">{c}</li>
            ))}
          </ul>
        </div>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHead id="how" eyebrow="How it works" sub="From a pasted link to an application you send yourself.">
            Four steps, one job
          </SectionHead>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 60} className="rounded-2xl border border-line bg-panel p-6">
                <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-soft text-primary-ink">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mb-1 text-xs font-medium text-faint">Step {i + 1}</p>
                <h3 className="mb-2 text-lg font-semibold capitalize tracking-tight text-text">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{s.desc}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Tools bento */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          <SectionHead id="tools" eyebrow="Six tools, one memory">
            Everything for your job search
          </SectionHead>
          <Bento />
        </section>

        {/* Bots hub */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          <SectionHead id="bots" eyebrow="How the bots work" sub="Pip coordinates four helpers. Each hands its result back for you to review.">
            One assistant, four helpers
          </SectionHead>
          <BotHub />
        </section>

        {/* Sample preview */}
        <section className="border-y border-line bg-soft px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionHead id="sample" eyebrow="Product preview, sample" sub="A sample with made-up names and numbers, shown to explain the format.">
              What a tailored resume looks like
            </SectionHead>
            <SampleDemo />
          </div>
        </section>

        {/* Trust */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHead id="trust" eyebrow="Trust">
            Nothing invented. Nothing sent without you.
          </SectionHead>
          <div className="grid gap-4 md:grid-cols-3">
            {TRUST.map((t) => (
              <div key={t.title} className="rounded-2xl border border-line bg-panel p-6 text-center">
                <span className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-soft text-primary-ink">
                  <t.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mb-2 text-base font-semibold capitalize tracking-tight text-text">{t.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          <SectionHead id="pricing" eyebrow="Pricing" sub="Paid plans are planned, not available yet.">
            Free, while we build
          </SectionHead>
          <Pricing />
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 sm:pb-28">
          <SectionHead id="faq" eyebrow="FAQ">
            Questions, answered
          </SectionHead>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-panel px-5">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 text-base font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-muted sm:text-base">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-panel px-4 py-12 text-xs text-muted sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
          <p className="text-2xl font-bold tracking-tight text-text">ascend</p>
          <nav aria-label="Tools" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link href="/resume" className="hover:text-text">Resume builder</Link>
            <Link href="/resume-parser" className="hover:text-text">ATS scanner</Link>
            <Link href="/interview" className="hover:text-text">Interview prep</Link>
            <Link href="/cover-letter" className="hover:text-text">Cover letter</Link>
            <Link href="/cold-email" className="hover:text-text">Cold email</Link>
            <Link href="/roadmap" className="hover:text-text">Career roadmap</Link>
            <a href="#trust" className="hover:text-text">Trust</a>
          </nav>
          <p className="flex items-center gap-2"><Pip name="coffee" size={20} /> Pip by stick it up (MIT)</p>
        </div>
      </footer>
    </div>
  );
}
