"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileUp, Loader2, PencilLine, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import PipStatus from "@/components/pixel/PipStatus";
import EditableChips from "@/components/shared/EditableChips";
import { generationErrorMessage } from "@/components/shared/generationError";
import { parseResumeToProfile, saveProfileChips, saveOnboardingAnswers, getProfileStrength } from "@/actions/Onboarding";

const MAX_BYTES = 5 * 1024 * 1024;
const GROUPS = [
  { kind: "role", title: "roles", add: "add a role" },
  { kind: "project", title: "projects", add: "add a project" },
  { kind: "skill", title: "skills", add: "add a skill" },
];
const STAGES = [
  { value: "JUST_STARTING", label: "just starting" },
  { value: "APPLYING", label: "applying" },
  { value: "INTERVIEWING", label: "interviewing" },
];

let localId = 0;
const newId = () => `local-${++localId}`;

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function StrengthRing({ percent }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent || 0));
  return (
    <div className="relative h-36 w-36" role="img" aria-label={`Profile strength ${pct} percent`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#ECEAE4" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#2F9E77"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-pixel text-3xl text-text">{pct}%</span>
    </div>
  );
}

export default function OnboardingFlow({ editing = false }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [step, setStep] = useState("start"); // start | parsing | chips | questions | strength
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const [chips, setChips] = useState([]); // { id, kind, label, detail?, source? }
  const [industry, setIndustry] = useState("");
  const [suggestedRole, setSuggestedRole] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [stage, setStage] = useState(null);
  const [strength, setStrength] = useState(null);

  const handleFile = async (file) => {
    setError(null);
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("That isn't a PDF. Drop a PDF resume, or add your details by hand.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That PDF is over 5 MB. Try a smaller file, or add your details by hand.");
      return;
    }
    setStep("parsing");
    try {
      const resumeBase64 = await toBase64(file);
      const res = await parseResumeToProfile({ resumeBase64, resumeType: file.type || "application/pdf" });
      if (!res || res.error) {
        setError(generationErrorMessage(res, "We couldn't read that resume."));
        setStep("start");
        return;
      }
      setChips((res.chips || []).map((c) => ({ ...c, id: newId() })));
      setIndustry(res.suggestedIndustry || "");
      setSuggestedRole(res.suggestedTargetRole || null);
      if (res.suggestedTargetRole) setTargetRole(res.suggestedTargetRole);
      setStep("chips");
    } catch {
      setError("We couldn't read that resume. Please try again.");
      setStep("start");
    }
  };

  const manual = () => {
    setError(null);
    setChips([]);
    setStep("chips");
  };

  // chip edits (local until Continue)
  const editChip = (id, value) =>
    setChips((cs) => cs.map((c) => (c.id === id ? { ...c, label: value, source: undefined } : c)));
  const removeChip = (id) => setChips((cs) => cs.filter((c) => c.id !== id));
  const addChip = (kind, value) => setChips((cs) => [...cs, { id: newId(), kind, label: value }]);

  const yearsChip = chips.find((c) => c.kind === "years");

  const saveChips = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = chips
        .filter((c) => c.label.trim())
        .map((c) => ({ kind: c.kind, label: c.label.trim(), ...(c.detail ? { detail: c.detail } : {}) }));
      const res = await saveProfileChips({ chips: payload, ...(industry.trim() ? { industry: industry.trim() } : {}) });
      if (!res || res.error) {
        setError(generationErrorMessage(res, "We couldn't save your details."));
        return;
      }
      setStrength(res.strength || null);
      setStep("questions");
    } catch {
      setError("We couldn't save your details. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const saveAnswers = async () => {
    if (!targetRole.trim() || !stage) return;
    setBusy(true);
    setError(null);
    try {
      const res = await saveOnboardingAnswers({ targetRole: targetRole.trim(), stage });
      if (!res || res.error) {
        setError(generationErrorMessage(res, "We couldn't save your answers."));
        return;
      }
      const s = await getProfileStrength();
      if (s && !s.error) setStrength(s);
      setStep("strength");
    } catch {
      setError("We couldn't save your answers. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const goHome = () => {
    toast.success("You're all set. Welcome aboard!");
    router.push("/dashboard");
  };

  const roleSuggestions = Array.from(
    new Set([suggestedRole, ...chips.filter((c) => c.kind === "role").map((c) => c.label.trim())].filter(Boolean))
  ).slice(0, 5);
  const customRole = targetRole && !roleSuggestions.includes(targetRole) ? targetRole : "";

  const errorBox = error && (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E8C9C0] bg-[#FDF3F0] px-4 py-3 text-xs text-text">
      <span className="flex-1 min-w-0">{error}</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-6">
      <div className="flex items-center justify-between">
        <span className="font-pixel text-[11px] uppercase tracking-wider text-muted">
          {editing ? "add to your profile" : "set up your profile"}
        </span>
        <span className="font-pixel text-[11px] text-muted">
          {["start", "parsing", "chips"].includes(step) ? "1" : step === "questions" ? "2" : "3"} / 3
        </span>
      </div>

      {step === "start" && (
        <div className="space-y-5">
          <PipStatus step="coffee" text="drop your resume and i'll pull out the details. you can fix anything after." />
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload your resume PDF"
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-[0.99] ${
              dragging ? "border-pip bg-pip-soft" : "border-line bg-white hover:border-pip"
            }`}
          >
            <FileUp className="h-8 w-8 text-pip" aria-hidden="true" />
            <p className="text-sm font-medium text-text">Drop your resume here, or tap to choose</p>
            <p className="text-xs text-muted">PDF, up to 5 MB. It's read once and not stored.</p>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          {errorBox}
          <button
            type="button"
            onClick={manual}
            className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-pip-ink underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-pip/50 rounded"
          >
            <PencilLine className="h-3.5 w-3.5" aria-hidden="true" />
            No resume? Add chips yourself
          </button>
        </div>
      )}

      {step === "parsing" && (
        <div className="space-y-4" aria-live="polite">
          <PipStatus step="detective" text="reading your resume and checking every detail against it…" />
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-soft" />
                <div className="flex gap-2">
                  <div className="h-8 w-24 animate-pulse rounded-full bg-soft" />
                  <div className="h-8 w-32 animate-pulse rounded-full bg-soft" />
                  <div className="h-8 w-20 animate-pulse rounded-full bg-soft" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === "chips" && (
        <div className="space-y-6">
          <PipStatus
            step="thinking"
            text={chips.length ? "here's what i found. tap a chip to fix it, × to remove, + to add." : "add a few details. tap + to start."}
          />
          {GROUPS.map((g) => (
            <section key={g.kind} aria-label={g.title} className="space-y-2">
              <h2 className="font-pixel text-xs uppercase tracking-wider text-muted">{g.title}</h2>
              <EditableChips
                items={chips.filter((c) => c.kind === g.kind)}
                addLabel={g.add}
                onEditItem={editChip}
                onRemoveItem={removeChip}
                onAddItem={(v) => addChip(g.kind, v)}
              />
            </section>
          ))}
          <section aria-label="years and industry" className="space-y-2">
            <h2 className="font-pixel text-xs uppercase tracking-wider text-muted">years and industry</h2>
            <div className="flex flex-wrap items-center gap-2">
              <EditableChips
                items={yearsChip ? [yearsChip] : []}
                addLabel={yearsChip ? "years" : "add years, e.g. 3 years"}
                onEditItem={editChip}
                onRemoveItem={removeChip}
                onAddItem={yearsChip ? undefined : (v) => addChip("years", v)}
              />
              <EditableChips
                items={industry ? [{ id: "industry", label: industry }] : []}
                addLabel={industry ? "industry" : "add your industry"}
                onEditItem={(_, v) => setIndustry(v)}
                onRemoveItem={() => setIndustry("")}
                onAddItem={industry ? undefined : (v) => setIndustry(v)}
              />
            </div>
          </section>
          {errorBox}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={saveChips} disabled={busy} className="btn-pill-primary min-h-11 px-6 text-sm inline-flex items-center gap-2 disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {error ? "Try again" : "Looks right"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("start");
              }}
              className="inline-flex min-h-10 items-center gap-1.5 text-xs text-muted hover:text-text rounded focus-visible:ring-2 focus-visible:ring-pip/50"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              start over
            </button>
          </div>
        </div>
      )}

      {step === "questions" && (
        <div className="space-y-7">
          <PipStatus step="rocket" text="two quick taps and you're in." />
          <section aria-label="target role" className="space-y-2">
            <h2 className="text-sm font-semibold text-text">What role are you aiming for?</h2>
            <div className="flex flex-wrap items-center gap-2">
              {roleSuggestions.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={targetRole === r}
                  onClick={() => setTargetRole(r)}
                  className={`h-9 max-w-full truncate rounded-full border px-4 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95 ${
                    targetRole === r ? "border-pip bg-pip text-white" : "border-line bg-white text-text hover:border-pip"
                  }`}
                >
                  {r}
                </button>
              ))}
              <EditableChips
                items={customRole ? [{ id: "custom", label: customRole }] : []}
                addLabel={customRole ? "role" : "type another"}
                maxLength={100}
                onEditItem={(_, v) => setTargetRole(v)}
                onRemoveItem={() => setTargetRole("")}
                onAddItem={customRole ? undefined : (v) => setTargetRole(v)}
              />
            </div>
          </section>
          <section aria-label="where you are" className="space-y-2">
            <h2 className="text-sm font-semibold text-text">Where are you in your search?</h2>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={stage === s.value}
                  onClick={() => setStage(s.value)}
                  className={`h-9 rounded-full border px-4 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-pip/50 active:scale-95 ${
                    stage === s.value ? "border-pip bg-pip text-white" : "border-line bg-white text-text hover:border-pip"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>
          {errorBox}
          <button
            type="button"
            onClick={saveAnswers}
            disabled={busy || !targetRole.trim() || !stage}
            className="btn-pill-primary min-h-11 px-6 text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {error ? "Try again" : "Continue"}
          </button>
        </div>
      )}

      {step === "strength" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <PipStatus step="coffee" text="your profile is saved." />
          {strength ? (
            <>
              <StrengthRing percent={strength.percent} />
              <p className="text-sm text-text">Your profile strength</p>
              {strength.nextAction && (
                <div className="space-y-1">
                  <p className="font-pixel text-[11px] uppercase tracking-wider text-muted">next best step</p>
                  <Link
                    href={strength.nextAction.href}
                    className="btn-pill-secondary inline-flex min-h-10 items-center px-4 text-xs"
                  >
                    {strength.nextAction.label}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">We couldn't work out your strength just now, but everything is saved.</p>
          )}
          <button type="button" onClick={goHome} className="btn-pill-primary min-h-11 px-8 text-sm">
            Go to home
          </button>
        </div>
      )}
    </div>
  );
}
