import Link from "next/link";
import { ChevronDown, Check, Link2, ShieldCheck, Trash2 } from "lucide-react";
import LandingNav from "@/components/landingPage/LandingNav";
import Reveal from "@/components/landingPage/Reveal";
import { ChipsMock, BotsMock, ReviewMock, TrackMock } from "@/components/landingPage/Features";
import AppWindow from "@/components/ui/AppWindow";
import BotStepList from "@/components/ui/BotStepList";
import PixelScene from "@/components/ui/PixelScene";
import PipAvatar from "@/components/ui/PipAvatar";
import StepCaption from "@/components/ui/StepCaption";
import Chip from "@/components/ui/Chip";

export const metadata = {
  title: "ascendai · get hired as yourself",
  description: "paste a job. pip tailors your resume, letter and prep from what you provide. you approve every change.",
};

const FLOW = [
  { n: 1, cap: "upload once. no forms.", note: "pip reads your resume and turns it into chips you can fix." },
  { n: 2, cap: "paste a job link. that's the only input.", note: "company, title and requirements are pulled from the link." },
  { n: 3, cap: "the bots prepare everything. you can walk away.", note: "match, tailor, write and contact steps run for that job." },
  { n: 4, cap: "you review. every line has a source.", note: "accept, edit or reject each change." },
  { n: 5, cap: "you apply. pip tracks and follows up.", note: "you send it yourself. pip drafts the follow-up." },
  { n: 6, cap: "practise for that exact interview.", note: "one question at a time, scored with quotes from your answer." },
  { n: 7, cap: "offer. the sky turns to stars.", note: "compare offers and draft a negotiation email." },
];

const FEATURES = [
  { id: "profile", title: "your profile, as chips", body: "upload a resume once. skills, projects and roles become chips. click one to fix it. nothing else to fill in.", Mock: ChipsMock },
  { id: "bots", title: "four bots, one job", body: "checker, tailor, writer and connector run in order for the job you pasted, and show each step as it finishes.", Mock: BotsMock },
  { id: "review", title: "tracked changes with sources", body: "weak lines are struck and rewrites typed in beside them. each rewrite points to where it came from. you accept, edit or reject.", Mock: ReviewMock },
  { id: "track", title: "a board that follows up", body: "saved, applied, interviewing. move a card, mark applied in one tap, and approve the follow-up draft when it is due.", Mock: TrackMock },
];

const TRUST = [
  { Icon: Link2, title: "every line has a source", desc: "edits show where they came from: your resume, your profile or the job description." },
  { Icon: ShieldCheck, title: "it never sends for you", desc: "you submit applications yourself. cold emails open in your own mail app." },
  { Icon: Trash2, title: "your data, your call", desc: "delete your data, or your whole account, from settings at any time." },
];

const FAQS = [
  { q: "why not just use a general ai chat?", a: "pip works from what you provide, asks for evidence instead of inventing numbers, and adds a source to each change so you can check every line." },
  { q: "are the tools connected?", a: "yes. gaps from your ats results feed your roadmap, and interview practice can use the job you pasted. each tool also works on its own." },
  { q: "can i download my resume as a pdf?", a: "yes. the resume builder exports a clean pdf with no watermark." },
  { q: "what does the dashboard sky mean?", a: "it follows your search: morning at the start, brighter as you apply, sunset while you interview, stars when an offer arrives." },
];

const FREE = ["up to 50 ai actions a day", "resume tailoring and ats fixes", "cover letters and cold emails from your details", "interview practice", "pip, your career assistant"];

const cta = "inline-flex min-h-12 items-center justify-center rounded-xl px-6 text-base font-medium transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Head({ id, children, sub }) {
  return (
    <Reveal className="mx-auto mb-10 max-w-2xl scroll-mt-20 text-center" id={id}>
      <h2 className="font-doc text-4xl tracking-tight text-text sm:text-5xl">{children}</h2>
      {sub && <p className="mt-3 text-muted">{sub}</p>}
    </Reveal>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-bg font-sans text-text">
      <LandingNav />
      <main>
        {/* hero */}
        <section className="relative isolate overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <div className="absolute inset-0 -z-10"><PixelScene variant="morning" seed={3} /></div>
          <div className="mx-auto max-w-4xl text-center text-[#1D2633]">
            <PipAvatar outfit="rocket" size="xl" working className="mx-auto mb-3" alt="" />
            <h1 className="font-doc text-5xl leading-[1.05] tracking-tight sm:text-7xl">paste a job. pip does the rest.</h1>
            <p className="mt-4 font-pixel text-xl text-[#2E3A48] sm:text-3xl">ascendai · get hired as yourself.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/sign-up" className={`${cta} w-full bg-ink text-ink-foreground hover:opacity-90 sm:w-auto`}>start free</Link>
              <a href="#flow" className={`${cta} w-full bg-white/90 text-[#1D2633] hover:bg-white sm:w-auto`}>see the 7 steps</a>
            </div>
            <p className="mt-3 text-sm text-[#2E3A48]">free while we build. up to 50 ai actions a day.</p>
          </div>
          <Reveal className="mx-auto mt-12 max-w-3xl text-left">
            <AppWindow title="ascendai · home" className="shadow-soft">
              <p className="font-pixel text-sm text-muted">new job · details pulled from the link</p>
              <p className="mb-4 mt-1 font-doc text-2xl">frontend engineer · northwind</p>
              <BotStepList
                steps={[
                  { id: "a", label: "checker", status: "done", result: "6 of 9 match" },
                  { id: "b", label: "tailor", status: "done", result: "4 edits to review" },
                  { id: "c", label: "writer", status: "running", detail: "drafting your letter" },
                ]}
              />
              <p className="mt-3 text-xs text-muted">sample data, fictional company</p>
            </AppWindow>
          </Reveal>
        </section>

        {/* flow strip */}
        <section id="flow" className="relative isolate scroll-mt-14 overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
          <div className="absolute inset-0 -z-10"><PixelScene variant="meadowwide" seed={5} /></div>
          <div className="mx-auto max-w-6xl">
            <Reveal className="mb-10 text-center text-[#1D2633]">
              <h2 className="font-doc text-4xl tracking-tight sm:text-5xl">seven steps, one job</h2>
              <p className="mt-3 text-[#2E3A48]">from a resume upload to an offer.</p>
            </Reveal>
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FLOW.map((s, i) => (
                <Reveal as="li" key={s.n} delay={(i % 4) * 60} className="rounded-2xl bg-panel/90 p-4 shadow-card backdrop-blur-sm">
                  <StepCaption n={s.n} className="!bg-transparent !p-0 !text-base !shadow-none">{s.cap}</StepCaption>
                  <p className="mt-2 text-sm text-muted">{s.note}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-14 px-4 py-16 sm:px-6 sm:py-24">
          <Head sub="real components from the app, with sample content.">what you get</Head>
          <div className="space-y-16 sm:space-y-24">
            {FEATURES.map(({ id, title, body, Mock }, i) => (
              <div key={id} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
                <Reveal className={i % 2 ? "md:order-2" : ""}>
                  <h3 className="font-doc text-3xl tracking-tight">{title}</h3>
                  <p className="mt-3 text-muted">{body}</p>
                </Reveal>
                <Reveal delay={80} className="min-w-0"><Mock /></Reveal>
              </div>
            ))}
          </div>
          <Reveal className="mt-14 text-center">
            <p className="mb-3 text-sm text-muted">also in the box</p>
            <ul className="flex flex-wrap justify-center gap-2">
              {["resume builder", "ats scanner", "interview prep", "cover letter", "cold email", "career roadmap"].map((t) => (
                <li key={t}><Chip editable={false} value={t} /></li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* trust */}
        <section id="trust" className="mx-auto max-w-6xl scroll-mt-14 px-4 pb-16 sm:px-6 sm:pb-24">
          <Head>nothing invented. nothing sent without you.</Head>
          <div className="grid gap-4 md:grid-cols-3">
            {TRUST.map(({ Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 60} className="rounded-2xl border border-line bg-panel p-6 text-center">
                <span className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-ink"><Icon className="size-5" aria-hidden="true" /></span>
                <h3 className="mb-2 text-lg font-medium">{title}</h3>
                <p className="text-sm text-muted">{desc}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* pricing */}
        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-14 px-4 pb-16 sm:px-6 sm:pb-24">
          <Head sub="paid plans are planned, not available yet.">free, while we build</Head>
          <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
            <Reveal className="rounded-3xl border-2 border-brand bg-panel p-6 sm:p-8">
              <div className="mb-5 flex items-center justify-between"><p className="font-doc text-2xl">free</p><span className="rounded-[9px] bg-brand-soft px-3 py-1 text-sm text-brand-ink">available now</span></div>
              <ul className="mb-7 space-y-3 text-sm">
                {FREE.map((f) => <li key={f} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />{f}</li>)}
              </ul>
              <Link href="/sign-up" className={`${cta} w-full bg-ink text-ink-foreground hover:opacity-90`}>start free</Link>
            </Reveal>
            <Reveal delay={60} className="rounded-3xl border border-line bg-soft p-6 sm:p-8">
              <div className="mb-5 flex items-center justify-between"><p className="font-doc text-2xl">pro</p><span className="rounded-[9px] border border-line px-3 py-1 text-sm text-muted">planned</span></div>
              <p className="mb-7 text-sm text-muted">no price and no date yet. this page will say so when a paid plan exists.</p>
              <button type="button" disabled className={`${cta} w-full cursor-not-allowed border border-line text-muted`}>not available yet</button>
            </Reveal>
          </div>
        </section>

        {/* faq */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-14 px-4 pb-16 sm:px-6 sm:pb-24">
          <Head>questions</Head>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-panel px-5">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-muted sm:text-base">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* end card */}
        <section className="relative isolate overflow-hidden px-4 py-20 text-center text-white sm:px-6 sm:py-28">
          <div className="absolute inset-0 -z-10"><PixelScene variant="dusk" seed={9} /></div>
          <Reveal>
            <PipAvatar outfit="coffee" size="xl" className="mx-auto" alt="" />
            <h2 className="mt-2 font-doc text-4xl [text-shadow:0_3px_18px_rgba(40,20,70,0.6)] sm:text-6xl">paste a job. pip does the rest.</h2>
            <p className="mt-3 font-pixel text-xl sm:text-2xl">ascendai · get hired as yourself</p>
            <Link href="/sign-up" className={`${cta} mt-8 bg-white text-[#1D2633] hover:bg-white/90`}>start free</Link>
            <p className="mt-4 text-sm">already have an account? <Link href="/sign-in" className="underline underline-offset-4">sign in</Link></p>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line bg-panel px-4 py-10 text-sm text-muted sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 text-center">
          <p className="font-pixel text-2xl text-text">ascendai</p>
          <nav aria-label="footer" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link href="/sign-in" className="hover:text-text">sign in</Link>
            <Link href="/sign-up" className="hover:text-text">sign up</Link>
            <Link href="/resume" className="hover:text-text">resume builder</Link>
            <Link href="/resume-parser" className="hover:text-text">ats scanner</Link>
            <Link href="/interview" className="hover:text-text">interview prep</Link>
            <Link href="/cover-letter" className="hover:text-text">cover letter</Link>
            <Link href="/cold-email" className="hover:text-text">cold email</Link>
            <Link href="/roadmap" className="hover:text-text">career roadmap</Link>
          </nav>
          <p>pip by stick it up (mit)</p>
        </div>
      </footer>
    </div>
  );
}
