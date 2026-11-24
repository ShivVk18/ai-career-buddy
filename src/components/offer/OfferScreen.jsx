"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Loader2, RotateCw } from "lucide-react";
import AppWindow from "@/components/ui/AppWindow";
import Confetti from "@/components/ui/Confetti";
import EmptyState from "@/components/ui/EmptyState";
import PipAvatar from "@/components/ui/PipAvatar";
import PipStatus from "@/components/ui/PipStatus";
import SceneScreen from "@/components/ui/SceneScreen";
import Skeleton from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];
const FIELDS = [
  { key: "base", label: "base", none: false },
  { key: "bonus", label: "bonus", none: true },
  { key: "equity", label: "equity", none: true },
  { key: "other", label: "other", none: true },
];
const pill = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 sm:min-h-10";

export const money = (n, cur) => (n == null ? null : `${cur ? `${cur} ` : ""}${Number(n).toLocaleString("en-IN")}`);
const dayLabel = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).toLowerCase() : null);
const toNum = (v) => {
  const t = String(v ?? "").replace(/[,\s]/g, "");
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

function Loading() {
  return (
    <div aria-busy="true" aria-label="loading offer" className="space-y-5 p-6 sm:p-10">
      <PipStatus text="pip is opening your offer…" />
      <Skeleton className="h-9 w-2/5" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
    </div>
  );
}

function Heading({ outfit, kicker, company, title, line }) {
  return (
    <div className="flex flex-col items-center px-5 py-7 text-center sm:py-9">
      <PipAvatar outfit={outfit} size={96} alt="" />
      <p className="mt-2 font-doc text-base text-brand-ink">{kicker}</p>
      <h2 className="mt-1 text-2xl font-bold normal-case leading-tight text-text sm:text-3xl">{[company, title].filter(Boolean).join(" · ") || "this job"}</h2>
      {line && <p className="mt-2 max-w-md text-sm text-muted">{line}</p>}
    </div>
  );
}

function Amounts({ offer }) {
  const parts = FIELDS.filter((f) => offer?.[f.key] != null);
  if (!parts.length) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-2 px-5 pb-6" aria-label="the numbers you entered">
      {parts.map((f) => (
        <li key={f.key} className="rounded-[9px] bg-soft px-3 py-1.5 font-doc text-sm text-text">
          {f.label} · {money(offer[f.key], offer.currency)}
        </li>
      ))}
      {offer.total != null && <li className="rounded-[9px] bg-brand-soft px-3 py-1.5 font-doc text-sm text-brand-ink">total a year · {money(offer.total, offer.currency)}</li>}
    </ul>
  );
}

function Field({ id, label, value, onChange, chip }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block font-doc text-sm text-muted">{label}</label>
      <Input id={id} inputMode="numeric" autoComplete="off" placeholder="0" value={value} onChange={(e) => onChange(e.target.value)} />
      {chip}
    </div>
  );
}

function Compare({ data, actions }) {
  const saved = data.offer || {};
  const [vals, setVals] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, saved[f.key] != null ? String(saved[f.key]) : ""])));
  const [cur, setCur] = useState(saved.currency || "INR");
  const [target, setTarget] = useState(data.targetBase != null ? String(data.targetBase) : "");
  const [st, setSt] = useState("idle"); // idle | busy
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [msg, setMsg] = useState(null);
  const [result, setResult] = useState(data.compare || null);
  const savedTarget = useRef(data.targetBase ?? undefined);

  const run = async (e) => {
    e.preventDefault();
    setMsg(null);
    const body = { currency: cur };
    for (const f of FIELDS) {
      const n = toNum(vals[f.key]);
      if (Number.isNaN(n)) return setMsg(`${f.label} should be a number, 0 or more.`);
      if (n !== undefined) body[f.key] = n;
    }
    const t = toNum(target);
    if (Number.isNaN(t) || (t !== undefined && (t < 1 || !Number.isInteger(t)))) return setMsg("your target should be a whole number.");
    setSt("busy");
    try {
      if (t !== savedTarget.current) {
        const r = await actions.setTarget(t === undefined ? null : t);
        if (r?.error) return setMsg(r.error);
        savedTarget.current = t;
      }
      const res = await actions.compare(data.id, body);
      if (!res || res.error) return setMsg(res?.error || "we couldn't compare that. try again.");
      setResult(res);
    } catch {
      setMsg("we couldn't reach the server. try again.");
    } finally {
      setSt("idle");
    }
  };

  const r = result;
  const vs = r?.vsTarget;
  const field = (f) => (
    <Field
      key={f.key}
      id={`offer-${f.key}`}
      label={f.label}
      value={vals[f.key]}
      onChange={(v) => setVals((s) => ({ ...s, [f.key]: v }))}
      chip={
        f.none && vals[f.key] === "" ? (
          <button type="button" onClick={() => setVals((s) => ({ ...s, [f.key]: "0" }))} className="mt-1 min-h-9 rounded-full px-2 text-xs text-muted underline outline-none focus-visible:ring-2 focus-visible:ring-brand">
            none
          </button>
        ) : null
      }
    />
  );
  if (!open && !r)
    return (
      <section aria-label="compare" className="min-w-0">
        <button type="button" onClick={() => setOpen(true)} aria-expanded="false" className={cn(pill, "w-full bg-ink text-ink-foreground hover:opacity-90 sm:w-auto")}>
          compare it
        </button>
      </section>
    );
  return (
    <section aria-label="compare" className="min-w-0">
      <h3 className="font-doc text-xl text-text">compare</h3>
      <p className="mt-1 text-sm text-muted">your numbers, a year. nothing here comes from market data.</p>
      <form onSubmit={run} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">{FIELDS.slice(0, 2).map(field)}</div>
        <div role="group" aria-label="currency" className="flex flex-wrap items-center gap-2">
          <span className="font-doc text-sm text-muted">currency</span>
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cur === c}
              onClick={() => setCur(c)}
              className={cn("inline-flex h-9 items-center rounded-full px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand", cur === c ? "bg-brand-soft text-brand-ink" : "bg-soft text-text hover:bg-line")}
            >
              {c}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="min-h-9 text-sm text-muted underline outline-none focus-visible:ring-2 focus-visible:ring-brand">
          {more ? "less" : "more"}
        </button>
        {more && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">{FIELDS.slice(2).map(field)}</div>
            <Field id="offer-target" label="the base you're aiming for (optional)" value={target} onChange={setTarget} />
          </div>
        )}
        <button type="submit" disabled={st === "busy"} className={cn(pill, "w-full bg-ink text-ink-foreground hover:opacity-90")}>
          {st === "busy" && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          compare
        </button>
        {msg && <p role="alert" className="text-sm text-gap-ink">{msg}</p>}
      </form>

      {r && (
        <div role="status" aria-live="polite" className="mt-5 space-y-3 rounded-[14px] bg-soft p-4">
          <p className="font-doc text-base text-text">
            {r.offer?.total != null ? <>total a year · {money(r.offer.total, r.offer.currency)}</> : "no amounts saved yet. add them above."}
          </p>
          {vs ? (
            <p className="text-sm text-text">
              {vs.meets ? "meets" : "below"} your target base of {money(vs.targetBase, r.offer?.currency)}
              {vs.diff ? ` (${vs.diff > 0 ? "+" : "-"}${money(Math.abs(vs.diff))})` : ""}.
            </p>
          ) : (
            <p className="text-sm text-muted">add a target base and your base pay to see how this compares.</p>
          )}
          {r.others?.length > 0 && (
            <ul className="space-y-1.5 border-t border-dashed border-line pt-3">
              {r.others.map((o) => (
                <li key={o.applicationId} className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="text-text">{[o.company, o.title].filter(Boolean).join(" · ")}</span>
                  <span className="text-muted">
                    {o.total != null ? money(o.total, o.currency) : "no amounts"}
                    {o.totalDiff ? ` (${o.totalDiff > 0 ? "+" : "-"}${money(Math.abs(o.totalDiff))})` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(r.notes || []).map((n, i) => (
            <p key={i} className="text-xs text-muted">{n}</p>
          ))}
        </div>
      )}
    </section>
  );
}

function Draft({ data, actions }) {
  const [st, setSt] = useState("idle"); // idle | busy | error | ready
  const [err, setErr] = useState(null);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [notes, setNotes] = useState([]);
  const [copied, setCopied] = useState(false);

  const make = async () => {
    setSt("busy");
    setErr(null);
    try {
      const res = await actions.draft(data.id);
      if (!res || res.error) {
        setErr(res?.error || "we couldn't write the draft. try again.");
        setSt("error");
        return;
      }
      setSubject(res.subject || "");
      setText(res.text || "");
      setNotes(res.notes || []);
      setSt("ready");
    } catch {
      setErr("we couldn't reach the server. try again.");
      setSt("error");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${subject ? `subject: ${subject}\n\n` : ""}${text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErr("we couldn't copy. select the text and copy it yourself.");
    }
  };

  return (
    <section aria-label="negotiation draft" className="min-w-0">
      {st === "ready" && (
        <>
          <h3 className="font-doc text-xl text-text">negotiation draft</h3>
          <p className="mt-1 text-sm text-muted">a starting point in your voice. edit it. nothing is sent.</p>
        </>
      )}
      {st !== "ready" ? (
        <div>
          <button type="button" onClick={make} disabled={st === "busy"} className={cn(pill, "w-full bg-brand-soft text-brand-ink hover:brightness-95 sm:w-auto")}>
            {st === "busy" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
            {st === "error" ? "try again" : "write a negotiation draft"}
          </button>
          {err && <p role="alert" className="mt-2 text-sm text-gap-ink">{err}</p>}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="neg-subject" className="mb-1 block font-doc text-sm text-muted">subject</label>
            <Input id="neg-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label htmlFor="neg-text" className="mb-1 block font-doc text-sm text-muted">email</label>
            <Textarea id="neg-text" value={text} onChange={(e) => setText(e.target.value)} className="min-h-56 font-doc text-base leading-relaxed" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={copy} className={cn(pill, "bg-ink text-ink-foreground hover:opacity-90")}>
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "copied" : "copy"}
            </button>
            <button type="button" onClick={make} className={cn(pill, "btn-pill-secondary")}>start over</button>
            <span role="status" className="sr-only">{copied ? "copied to clipboard" : ""}</span>
          </div>
          {err && <p role="alert" className="text-sm text-gap-ink">{err}</p>}
          {notes.map((n, i) => (
            <p key={i} className="text-xs text-muted">{n}</p>
          ))}
        </div>
      )}
    </section>
  );
}

function OfferBody({ data, actions }) {
  return (
    <>
      <Heading outfit="rocket" kicker="offer received" company={data.company} title={data.title} line="pip can compare it and draft your negotiation email." />
      <Amounts offer={data.offer} />
      <div className="grid items-start gap-8 border-t border-line bg-panel p-5 sm:p-8 md:grid-cols-2 md:gap-10">
        <Compare data={data} actions={actions} />
        <Draft data={data} actions={actions} />
      </div>
    </>
  );
}

function ClosedBody({ data }) {
  const tasks = data.tasks || [];
  return (
    <>
      <Heading outfit="coffee" kicker="not this time" company={data.company} title={data.title} line="this one closed. that is allowed to sting for a minute. pip kept what it learned." />
      <div className="border-t border-line p-5 sm:p-8">
        <h3 className="font-doc text-xl text-text">next week</h3>
        {tasks.length === 0 ? (
          <p className="mt-2 max-w-md text-sm text-muted">pip found no skill gaps for this job, so there is nothing to add to next week. your plan stays as it is.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">the gaps pip saw in this one, as tasks for next week.</p>
            <ul className="mt-3">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 border-b border-dashed border-line py-3 last:border-b-0">
                  <span className="min-w-0 text-sm lowercase text-text">{t.title}</span>
                  {t.dueAt && <span className="shrink-0 rounded-[9px] bg-soft px-2.5 py-1 font-doc text-sm text-muted">{dayLabel(t.dueAt)}</span>}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {tasks.length > 0 && (
            <Link href="/dashboard" className={cn(pill, "bg-ink text-ink-foreground hover:opacity-90")}>
              see them on home <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
          <Link href="/applications" className={cn(pill, "btn-pill-secondary")}>back to applications</Link>
        </div>
      </div>
    </>
  );
}

/**
 * Offer / rejection screen (scene 7). Presentational.
 * status: "loading" | "error" | "empty" | "ready"
 * data: { kind: "offer" | "closed" | "other", id, jobId, company, title, statusLabel,
 *   offer: {base,bonus,equity,other,currency,total}|null, targetBase, compare, tasks: [{ id, title, dueAt }] }
 * actions: { compare(id, body), draft(id), setTarget(n|null) }
 */
export default function OfferScreen({ status, error, onRetry, data, actions }) {
  const kind = status === "ready" ? data?.kind : null;
  const [boom, setBoom] = useState(true);
  useEffect(() => {
    if (kind !== "offer") return;
    const t = setTimeout(() => setBoom(false), 6500);
    return () => clearTimeout(t);
  }, [kind]);

  let body;
  if (status === "loading") {
    body = <Loading />;
  } else if (status === "error") {
    body = (
      <div role="alert" className="p-6 sm:p-10">
        <EmptyState outfit="detective" title="we couldn't open this one" text={error || "something went wrong on our side."} action={onRetry && (
          <button type="button" onClick={onRetry} className={cn(pill, "btn-pill-secondary")}>
            <RotateCw className="size-4" aria-hidden="true" /> retry
          </button>
        )} />
      </div>
    );
  } else if (status === "empty" || !data) {
    body = (
      <div className="p-6 sm:p-10">
        <EmptyState title="no offer here" text="we can't find that application. offers show up once you move a job to offer." action={<Link href="/applications" className={cn(pill, "bg-ink text-ink-foreground")}>back to applications</Link>} />
      </div>
    );
  } else if (data.kind === "offer") {
    body = <OfferBody data={data} actions={actions} />;
  } else if (data.kind === "closed") {
    body = <ClosedBody data={data} />;
  } else {
    body = (
      <div className="p-6 sm:p-10">
        <EmptyState
          title="this one isn't an offer yet"
          text={`it's marked ${data.statusLabel || "open"}. the offer helper opens once you move it to offer.`}
          action={<Link href={data.jobId ? `/jobs/${data.jobId}` : "/applications"} className={cn(pill, "bg-ink text-ink-foreground")}>open the job</Link>}
        />
      </div>
    );
  }

  const night = kind === "offer" || status === "loading";
  return (
    <SceneScreen
      variant={kind === "closed" ? "dusk" : night ? "night" : "dusk"}
      seed={kind === "closed" ? 808 : 707}
      center
      label="offer"
      overlay={kind === "offer" ? <Confetti active={boom} seed={7} /> : null}
    >
      <h1 className="sr-only">{kind === "closed" ? "closed application" : "offer"}</h1>
      <AppWindow title={kind === "closed" ? "ascendai · closed" : "ascendai · offer"} className="relative mx-auto max-w-[900px]" bodyClassName="p-0">
        {body}
      </AppWindow>
    </SceneScreen>
  );
}
