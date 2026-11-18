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
import HeroStack from "@/components/landingPage/HeroStack";
import Reveal from "@/components/landingPage/Reveal";
import { HoverBorderGradient } from "@/components/ui/aceternity/hover-border-gradient";

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

const DISPLAY = "font-bold leading-[0.9] tracking-[-0.045em] lowercase";
const SERIF = "font-doc font-normal italic tracking-[-0.03em]";
const MARQUEE = ["resume builder", "ats scanner", "interview prep", "cover letter", "cold email", "career roadmap"];

function SectionHead({ id, no, eyebrow, children }) {
  return (
    <Reveal id={id} className="mb-12 scroll-mt-24 sm:mb-16">
      <p className="mb-5 flex items-center gap-3 font-pixel text-sm text-faint">
        <span className="text-primary-ink">{no}</span>
        <span className="h-px w-10 bg-line" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2 className={`max-w-4xl text-[clamp(2.5rem,7vw,5.5rem)] text-text ${DISPLAY}`}>{children}</h2>
    </Reveal>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-bg font-sans text-text selection:bg-lime selection:text-lime-foreground">
      <LandingNav />

      <main>
        {/* Hero */}
        <section className="grain relative px-4 pb-24 pt-12 sm:px-6 sm:pt-20 lg:pt-24">
          <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-panel py-1.5 pl-2 pr-3 text-xs text-muted">
                <Pip name="coffee" size={18} /> pip, your ai career assistant
              </p>
              <h1 className={`mb-8 text-[clamp(3.25rem,12.5vw,8.5rem)] text-text ${DISPLAY}`}>
                nothing <span className={SERIF}>invented.</span>
                <br />
                every line <span className="highlight-match rounded-sm px-1">cited.</span>
              </h1>
              <p className="mb-10 max-w-md text-base leading-relaxed text-muted sm:text-lg">
                Paste a job. Pip tailors your resume, letter and prep from what you provide, and you approve every change.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <HoverBorderGradient as={Link} href="/dashboard" containerClassName="w-full sm:w-auto">
                  start free <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </HoverBorderGradient>
                <a href="#how" className="btn-pill-secondary min-h-11 w-full text-sm sm:w-auto">see how it works</a>
              </div>
              <p className="mt-5 text-xs text-muted">free to start - up to 50 AI actions a day</p>
            </div>
            <div className="pb-8 lg:col-span-5">
              <HeroStack />
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="marquee overflow-hidden border-y border-line bg-panel py-5" aria-label="The six tools: resume builder, ats scanner, interview prep, cover letter, cold email, career roadmap">
          <div className="marquee-track flex w-max gap-10" aria-hidden="true">
            {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap text-2xl font-bold tracking-tight text-text sm:text-3xl">
                {m}
                <span className="h-2.5 w-2.5 rounded-full bg-lime" />
              </span>
            ))}
          </div>
        </div>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <SectionHead id="how" no="01" eyebrow="how it works">
                  four steps, <span className={SERIF}>one</span> job.
                </SectionHead>
                <p className="-mt-4 max-w-sm text-muted">From a pasted link to an application you send yourself.</p>
              </div>
            </div>
            <ol className="lg:col-span-7">
              {STEPS.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 60} className="group grid grid-cols-[auto_1fr] gap-x-6 border-t border-line py-8 last:border-b sm:gap-x-10 sm:py-10">
                  <span className="text-[clamp(3.5rem,9vw,6.5rem)] font-bold leading-none tracking-[-0.06em] text-line transition-colors duration-300 group-hover:text-primary-ink">0{i + 1}</span>
                  <div className="pt-2">
                    <s.icon className="mb-3 h-5 w-5 text-primary-ink" aria-hidden="true" />
                    <h3 className="mb-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">{s.title}</h3>
                    <p className="max-w-md text-sm leading-relaxed text-muted sm:text-base">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Tools bento */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 sm:pb-32">
          <SectionHead id="tools" no="02" eyebrow="six tools, one memory">
            everything for the job, <span className={SERIF}>together.</span>
          </SectionHead>
          <div className="grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-6">
            {TOOLS.map((t, i) => (
              <Reveal key={t.name} delay={i * 50} className={t.span}>
                <Link
                  href={t.href}
                  className={`group relative flex h-full min-h-56 flex-col justify-between overflow-hidden rounded-3xl border border-line p-6 transition duration-300 hover:-translate-y-1 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-8 ${i === 0 ? "bg-primary text-white" : "bg-panel"}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transform-none ${i === 0 ? "bg-white/15 text-white" : "bg-soft text-primary-ink"}`}>
                      <t.icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full border transition duration-300 group-hover:bg-lime group-hover:text-lime-foreground ${i === 0 ? "border-white/40" : "border-line text-muted"}`}>
                      <ArrowRight className="h-4 w-4 -rotate-45 transition-transform duration-300 group-hover:rotate-0 motion-reduce:transform-none" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-10">
                    <h3 className={`mb-2 font-bold tracking-tight ${i === 0 ? "text-4xl sm:text-5xl" : "text-2xl"}`}>{t.name}</h3>
                    <p className={`max-w-md text-sm leading-relaxed ${i === 0 ? "text-white/85" : "text-muted"}`}>{t.desc}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Sample preview */}
        <section className="border-y border-line bg-soft px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-7xl">
            <SectionHead id="sample" no="03" eyebrow="product preview, sample">
              what a tailored resume <span className={SERIF}>looks like.</span>
            </SectionHead>
            <p className="-mt-6 mb-10 max-w-lg text-muted">This is a sample with made-up names and numbers, shown to explain the format.</p>
            <SampleDemo />
          </div>
        </section>

        {/* Trust: indigo block */}
        <section className="grain relative bg-primary px-4 py-24 text-white sm:px-6 sm:py-32">
          <div className="relative z-10 mx-auto max-w-7xl">
            <p id="trust" className="mb-10 flex scroll-mt-24 items-center gap-3 font-pixel text-sm text-white/80">
              <span className="text-lime">04</span><span className="h-px w-10 bg-white/40" aria-hidden="true" /> trust
            </p>
            <Reveal>
              <p className={`text-[clamp(3rem,11vw,9rem)] ${DISPLAY}`}>
                nothing <span className={SERIF}>invented.</span>
              </p>
              <p className={`text-[clamp(3rem,11vw,9rem)] ${DISPLAY}`}>
                nothing sent <span className="text-lime">without you.</span>
              </p>
            </Reveal>
            <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/25 bg-white/25 md:grid-cols-3">
              {TRUST.map((t) => (
                <div key={t.title} className="bg-primary p-6 sm:p-8">
                  <t.icon className="mb-6 h-6 w-6 text-lime" aria-hidden="true" />
                  <h3 className="mb-2 text-lg font-bold tracking-tight">{t.title}</h3>
                  <p className="text-sm leading-relaxed text-white/85">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing: lime break */}
        <section className="bg-lime px-4 py-24 text-lime-foreground sm:px-6 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
            <Reveal id="pricing" className="scroll-mt-24 lg:col-span-6">
              <p className="mb-5 flex items-center gap-3 font-pixel text-sm"><span>05</span><span className="h-px w-10 bg-lime-foreground/40" aria-hidden="true" /> pricing</p>
              <h2 className={`text-[clamp(3rem,9vw,7rem)] ${DISPLAY}`}>
                free, <span className={SERIF}>while</span> we build.
              </h2>
              <p className="mt-6 max-w-sm text-sm">Paid plans are planned, not available yet.</p>
            </Reveal>
            <Reveal delay={80} className="lg:col-span-6">
              <div className="rounded-3xl border border-lime-foreground/20 bg-bg p-6 text-text sm:p-8">
                <p className="mb-6 text-xl font-bold tracking-tight">free</p>
                <ul className="mb-8 space-y-3 text-sm">
                  {["Up to 50 AI actions per day", "Open-question interview practice", "Resume tailoring and ATS fixes", "Cover letters and cold emails grounded in your details", "Pip, your AI career assistant"].map((f) => (
                    <li key={f} className="flex items-start gap-3 border-b border-line pb-3 last:border-0">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard" className="btn-pill-primary min-h-11 w-full text-sm sm:w-auto">start free</Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHead id="faq" no="06" eyebrow="faq">
                questions, <span className={SERIF}>answered.</span>
              </SectionHead>
            </div>
            <div className="lg:col-span-7">
              {FAQS.map((f) => (
                <details key={f.q} className="group border-t border-line last:border-b">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-5 text-base font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="max-w-xl pb-6 text-sm leading-relaxed text-muted sm:text-base">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-panel px-4 pt-16 text-xs text-muted sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="mb-4 text-2xl font-bold tracking-tight text-text sm:text-3xl">ready for your next role?</p>
              <Link href="/dashboard" className="btn-pill-primary min-h-11 px-7 text-sm">start free with pip</Link>
            </div>
            <nav aria-label="Tools" className="flex flex-wrap gap-x-5 gap-y-2 md:max-w-sm md:justify-end">
              <Link href="/resume" className="hover:text-text">resume builder</Link>
              <Link href="/interview" className="hover:text-text">interview prep</Link>
              <Link href="/cover-letter" className="hover:text-text">cover letter</Link>
              <Link href="/cold-email" className="hover:text-text">cold email</Link>
              <Link href="/roadmap" className="hover:text-text">career roadmap</Link>
              <Link href="/resume-parser" className="hover:text-text">ats scanner</Link>
            </nav>
          </div>
          <p className="mt-10 flex items-center gap-2"><Pip name="coffee" size={20} /> pip by stick it up (mit)</p>
          <p aria-hidden="true" className="select-none overflow-hidden whitespace-nowrap pt-4 text-center text-[clamp(5rem,26vw,24rem)] font-bold leading-[0.78] tracking-[-0.06em] text-soft">
            ascend
          </p>
        </div>
      </footer>
    </div>
  );
}
