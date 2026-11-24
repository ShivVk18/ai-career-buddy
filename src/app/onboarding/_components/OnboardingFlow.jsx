"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import PixelScene from "@/components/ui/PixelScene";
import AppWindow from "@/components/ui/AppWindow";
import PipAvatar from "@/components/ui/PipAvatar";
import PipStatus from "@/components/ui/PipStatus";
import ProgressRing from "@/components/ui/ProgressRing";
import Skeleton from "@/components/ui/Skeleton";
import { Chip, AddChip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/button";
import { generationErrorMessage } from "@/components/shared/generationError";
import * as realActions from "@/actions/Onboarding";
import { saveResumeVersion as realSaveVersion, restoreResumeVersion as realRestoreVersion } from "@/actions/Resume";

const MAX_BYTES = 5 * 1024 * 1024;
const GROUPS = [
  { kind: "skill", title: "skills", add: "add skill", tone: "brand" },
  { kind: "project", title: "projects", add: "add project", tone: "neutral" },
  { kind: "role", title: "roles", add: "add role", tone: "neutral" },
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

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function Choice({ selected, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex h-8 max-w-full items-center rounded-[9px] px-3 text-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px ${
        selected ? "bg-brand-ink text-white" : "bg-soft text-text hover:bg-line"
      }`}
    >
      <span className="truncate">{children}</span>
    </button>
  );
}

/**
 * One screen: drop -> reading -> chips -> two taps -> continue.
 * `actions` lets the dev route swap in mock server actions; real ones are the default.
 */
// Stepped pixel clouds, drawn as rows of [offset, width] in 1-unit cells, like the reference scene.
const CLOUD_A = [[8, 8], [5, 14], [2, 20], [0, 24]];
const CLOUD_B = [[10, 10], [6, 18], [3, 24], [0, 30]];
const CLOUD_C = [[4, 8], [2, 12], [0, 15]];

function PixelCloud({ rows, className }) {
  const w = Math.max(...rows.map(([o, n]) => o + n));
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${w} ${rows.length}`}
      shapeRendering="crispEdges"
      className={`absolute h-auto ${className}`}
    >
      {rows.map(([o, n], y) => (
        <rect key={y} x={o} y={y} width={n} height="1.02" fill={y === rows.length - 1 ? "#E2EEF8" : "#FFFFFF"} />
      ))}
    </svg>
  );
}

export default function OnboardingFlow({ editing = false, actions }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const lastFileRef = useRef(null);
  const originalRef = useRef({ chips: [], industry: "" }); // edit mode: profile as loaded, for Undo
  const a = {
    parseResumeToProfile: actions?.parseResumeToProfile ?? realActions.parseResumeToProfile,
    saveProfileChips: actions?.saveProfileChips ?? realActions.saveProfileChips,
    saveOnboardingAnswers: actions?.saveOnboardingAnswers ?? realActions.saveOnboardingAnswers,
    getProfileChips: actions?.getProfileChips ?? realActions.getProfileChips,
    saveResumeVersion: actions?.saveResumeVersion ?? realSaveVersion,
    restoreResumeVersion: actions?.restoreResumeVersion ?? realRestoreVersion,
  };

  const [phase, setPhase] = useState(editing ? "loading" : "drop"); // loading | drop | reading | review
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState(null);
  const [errorKind, setErrorKind] = useState(null); // load | parse | save
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [chips, setChips] = useState([]); // { id, kind, label, detail?, source? }
  const [industry, setIndustry] = useState("");
  const [suggestedRole, setSuggestedRole] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [stage, setStage] = useState(null);
  const [revealed, setRevealed] = useState(0);

  const fail = (kind, msg) => {
    setErrorKind(kind);
    setError(msg);
  };
  const clearError = () => {
    setError(null);
    setErrorKind(null);
  };

  // Chips appear one by one (all at once under reduced motion).
  useEffect(() => {
    if (phase !== "review") return;
    const total = chips.length;
    if (revealed >= total) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRevealed(total);
      return;
    }
    const t = setTimeout(() => setRevealed((r) => r + 1), 70);
    return () => clearTimeout(t);
  }, [phase, revealed, chips.length]);

  const loadProfile = useCallback(async () => {
    clearError();
    setPhase("loading");
    try {
      const res = await a.getProfileChips();
      if (!res || res.error) {
        fail("load", generationErrorMessage(res, "we couldn't load your profile."));
        return;
      }
      const loaded = (res.chips || []).map((c) => ({ ...c, orig: true }));
      const ind = res.industry || "";
      originalRef.current = { chips: loaded, industry: ind };
      setChips(loaded);
      setRevealed(loaded.length);
      setIndustry(ind);
      if (res.targetRole) setTargetRole(res.targetRole);
      if (res.jobSearchStage) setStage(res.jobSearchStage);
      setPhase("review");
    } catch {
      fail("load", "we couldn't load your profile. try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editing) loadProfile();
  }, [editing, loadProfile]);

  const handleFile = async (file) => {
    clearError();
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      fail("parse-input", "that isn't a pdf. drop a pdf resume, or add details by hand.");
      return;
    }
    if (file.size > MAX_BYTES) {
      fail("parse-input", "that pdf is over 5 mb. try a smaller one, or add details by hand.");
      return;
    }
    lastFileRef.current = file;
    setFileName(file.name);
    setPhase("reading");
    try {
      const resumeBase64 = await toBase64(file);
      const res = await a.parseResumeToProfile({ resumeBase64, resumeType: file.type || "application/pdf" });
      if (!res || res.error) {
        fail("parse", generationErrorMessage(res, "we couldn't read that resume."));
        setPhase("drop");
        return;
      }
      const parsed = (res.chips || []).map((c) => ({ ...c, id: newId() }));
      let startAt = 0;
      if (editing) {
        // Add to what's already there; never drop saved chips because a new PDF was read.
        const key = (c) => `${c.kind}|${c.label.trim().toLowerCase()}`;
        const have = new Set(chips.map(key));
        startAt = chips.length;
        setChips([...chips, ...parsed.filter((c) => !have.has(key(c)))]);
        setIndustry((cur) => cur || res.suggestedIndustry || "");
      } else {
        setChips(parsed);
        setIndustry(res.suggestedIndustry || "");
      }
      setRevealed(startAt);
      setSuggestedRole(res.suggestedTargetRole || null);
      if (res.suggestedTargetRole && !targetRole) setTargetRole(res.suggestedTargetRole);
      setPhase("review");
    } catch {
      fail("parse", "we couldn't read that resume. try again.");
      setPhase("drop");
    }
  };

  const byHand = () => {
    clearError();
    if (!editing) setChips([]);
    setRevealed(0);
    setPhase("review");
  };

  const editChip = (id, value) =>
    setChips((cs) => cs.map((c) => (c.id === id ? { ...c, label: value, source: undefined } : c)));
  const removeChip = (id) => setChips((cs) => cs.filter((c) => c.id !== id));
  const addChip = (kind, value) => {
    setChips((cs) => [...cs, { id: newId(), kind, label: value }]);
    setRevealed((r) => r + 1);
  };

  const yearsChip = chips.find((c) => c.kind === "years");
  const roleOptions = Array.from(
    new Set([suggestedRole, ...chips.filter((c) => c.kind === "role").map((c) => c.label.trim())].filter(Boolean))
  ).slice(0, 5);
  const customRole = targetRole && !roleOptions.includes(targetRole) ? targetRole : "";

  const counts = {
    skill: chips.filter((c) => c.kind === "skill").length,
    project: chips.filter((c) => c.kind === "project").length,
    role: chips.filter((c) => c.kind === "role").length,
  };
  const revealFrac = chips.length ? Math.min(revealed, chips.length) / chips.length : phase === "review" ? 1 : 0;
  const ring = phase === "review" ? Math.round(70 * revealFrac + (targetRole ? 15 : 0) + (stage ? 15 : 0)) : phase === "reading" ? 5 : 0;

  const payloadFor = (withIds) =>
    chips
      .filter((c) => c.label.trim())
      .map((c) => ({
        ...(withIds && c.orig ? { id: c.id } : {}),
        kind: c.kind,
        label: c.label.trim(),
        ...(c.detail ? { detail: c.detail } : {}),
      }));

  // Persist chips, then the two answers, then go home. Same actions and payloads as before.
  const finish = async () => {
    if (!targetRole.trim() || !stage) return;
    setBusy(true);
    clearError();
    try {
      let undo = null;
      if (editing) {
        // Replace can remove resume entries for good, so snapshot first and offer a 5 s undo.
        const backup = await a.saveResumeVersion({ label: "Before profile edit" });
        const noResume = backup?.code === "NOT_FOUND";
        if ((!backup || backup.error) && !noResume) {
          fail("save", generationErrorMessage(backup, "we couldn't back up your resume first, so nothing was changed."));
          return;
        }
        undo = backup?.id ?? null;
      }
      const res = await a.saveProfileChips(
        editing
          ? { chips: payloadFor(true), mode: "replace", industry: industry.trim() }
          : { chips: payloadFor(false), ...(industry.trim() ? { industry: industry.trim() } : {}) }
      );
      if (!res || res.error) {
        fail("save", generationErrorMessage(res, "we couldn't save your details."));
        return;
      }
      const ans = await a.saveOnboardingAnswers({ targetRole: targetRole.trim(), stage });
      if (!ans || ans.error) {
        fail("save", generationErrorMessage(ans, "we couldn't save your answers."));
        return;
      }
      if (editing) {
        const previous = originalRef.current;
        toast.success("profile updated", {
          duration: 5000,
          action: {
            label: "undo",
            onClick: async () => {
              const restored = undo ? await a.restoreResumeVersion(undo).catch(() => null) : { ok: true };
              const prevPayload = previous.chips.map((c) => ({
                id: c.id,
                kind: c.kind,
                label: c.label,
                ...(c.detail ? { detail: c.detail } : {}),
              }));
              const back = await a.saveProfileChips({ chips: prevPayload, mode: "replace", industry: previous.industry }).catch(() => null);
              if (!restored || restored.error || !back || back.error) {
                toast.error("couldn't undo that fully. your earlier version is in resume versions.");
                return;
              }
              toast.success("profile restored");
            },
          },
        });
      } else {
        toast.success("you're all set");
      }
      router.push("/dashboard");
    } catch {
      fail("save", "we couldn't save your details. try again.");
    } finally {
      setBusy(false);
    }
  };

  const openPicker = () => fileRef.current?.click();
  const reading = phase === "reading";
  const showDropTitle = phase === "drop" || phase === "loading";

  return (
    <div className="relative isolate min-h-dvh px-4 py-8 sm:px-8 sm:py-12">
      <div className="absolute inset-0 -z-10">
        <PixelScene variant="meadow" seed={5} />
        <PixelCloud className="left-[2%] top-1 w-[130px] sm:w-[190px]" rows={CLOUD_A} />
        <PixelCloud className="right-0 top-[15%] w-[110px] sm:w-[150px]" rows={CLOUD_B} />
        <PixelCloud className="right-[1%] top-[26%] w-[70px] sm:w-[90px]" rows={CLOUD_C} />
      </div>

      <AppWindow title="ascendai · getting to know you" className="mx-auto max-w-[1040px]" bodyClassName="p-5 sm:p-10">
        <h1 className="font-sans text-xl font-bold tracking-tight text-text sm:text-2xl">
          {editing ? "add to your profile. pip reads the rest." : "drop your resume. pip reads the rest."}
        </h1>

        {phase === "loading" ? (
          <div className="mt-6 space-y-4" aria-busy={!error}>
            <PipStatus text="getting your profile…" />
            {error ? (
              <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[14px] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-text">
                <span className="min-w-0 flex-1">{error}</span>
                <Button size="sm" variant="outline" onClick={loadProfile}>
                  try again
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {[88, 112, 72, 96, 80].map((w, i) => (
                  <Skeleton key={i} className="h-8" style={{ width: w }} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              role="button"
              tabIndex={reading ? -1 : 0}
              aria-disabled={reading}
              aria-label="upload your resume pdf"
              onClick={() => !reading && openPicker()}
              onKeyDown={(e) => {
                if (!reading && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  openPicker();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!reading) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (!reading) handleFile(e.dataTransfer.files?.[0]);
              }}
              className={`mt-5 flex items-center gap-4 rounded-[16px] border-[1.5px] border-dashed px-5 py-5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:px-10 sm:py-7 ${
                reading ? "cursor-default" : "cursor-pointer"
              } ${dragging ? "border-brand bg-brand-soft" : "border-faint/50 bg-panel hover:border-brand"}`}
            >
              <PipAvatar outfit="detective" size="lg" working={reading} alt="" />
              <div className="min-w-0 font-doc">
                {reading ? (
                  <>
                    <p className="text-base text-text">reading your resume…</p>
                    <p className="truncate text-sm text-muted">{fileName}</p>
                  </>
                ) : phase === "review" && fileName ? (
                  <>
                    <p className="truncate text-base text-text">{fileName} · read</p>
                    <p className="text-sm text-muted">
                      {plural(counts.skill, "skill", "skills")} · {plural(counts.project, "project", "projects")} · {plural(counts.role, "role", "roles")}
                    </p>
                  </>
                ) : phase === "review" ? (
                  <>
                    <p className="text-base text-text">{editing ? "your saved profile" : "adding by hand"}</p>
                    <p className="text-sm text-muted">drop a pdf to add more</p>
                  </>
                ) : (
                  <>
                    <p className="text-base text-text">drag a pdf here</p>
                    <p className="text-sm text-muted">or click to browse</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                tabIndex={-1}
                data-testid="resume-input"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>

            {error && errorKind !== "save" && (
              <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-text">
                <span className="min-w-0 flex-1">{error}</span>
                {errorKind === "parse" && lastFileRef.current && (
                  <Button size="sm" variant="outline" onClick={() => handleFile(lastFileRef.current)}>
                    <RotateCcw /> try again
                  </Button>
                )}
              </div>
            )}

            {phase === "drop" && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                <button type="button" onClick={byHand} className="min-h-10 rounded text-sm text-brand-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                  no resume? add by hand
                </button>
              </div>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:gap-10">
              <div className="min-w-0">
                <p className="font-doc text-sm text-muted">
                  {phase === "review" ? "what pip found · click any chip to fix it" : "what pip finds shows up here"}
                </p>

                {reading && (
                  <div className="mt-3 space-y-3" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex flex-wrap gap-2">
                        {[72, 104, 64, 88, 76].slice(0, 5 - i).map((w, j) => (
                          <Skeleton key={j} className="h-8" style={{ width: w }} />
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {phase === "drop" && (
                  <div className="mt-3 flex flex-wrap gap-2" aria-hidden="true">
                    {[72, 104, 64, 88].map((w, j) => (
                      <Skeleton key={j} className="h-8 opacity-50" style={{ width: w }} />
                    ))}
                  </div>
                )}

                {phase === "review" && (
                  <div className="mt-3 space-y-4">
                    {chips.length === 0 && (
                      <p className="text-sm text-muted">nothing yet. tap + to add a skill, project or role.</p>
                    )}
                    {GROUPS.map((g) => {
                      const items = chips.filter((c) => c.kind === g.kind);
                      return (
                        <section key={g.kind} aria-label={g.title} className="space-y-2">
                          <h2 className="font-pixel text-[11px] uppercase tracking-wider text-muted">{g.title}</h2>
                          <div className="flex flex-wrap gap-2">
                            {items
                              .filter((c) => chips.indexOf(c) < revealed)
                              .map((c) => (
                                <Chip
                                  key={c.id}
                                  value={c.label}
                                  tone={g.tone}
                                  onChange={(v) => editChip(c.id, v)}
                                  onRemove={() => removeChip(c.id)}
                                />
                              ))}
                            <AddChip label={g.add} onAdd={(v) => addChip(g.kind, v)} />
                          </div>
                        </section>
                      );
                    })}
                    <section aria-label="years and industry" className="space-y-2">
                      <h2 className="font-pixel text-[11px] uppercase tracking-wider text-muted">years and industry</h2>
                      <div className="flex flex-wrap gap-2">
                        {yearsChip ? (
                          <Chip value={yearsChip.label} onChange={(v) => editChip(yearsChip.id, v)} onRemove={() => removeChip(yearsChip.id)} />
                        ) : (
                          <AddChip label="add years" onAdd={(v) => addChip("years", v)} />
                        )}
                        {industry ? (
                          <Chip value={industry} onChange={setIndustry} onRemove={() => setIndustry("")} />
                        ) : (
                          <AddChip label="add industry" onAdd={setIndustry} />
                        )}
                      </div>
                    </section>
                  </div>
                )}
              </div>

              <div className="flex justify-center md:items-start md:justify-end">
                <ProgressRing value={ring} size={120} stroke={12} label="profile progress">
                  <span className="font-doc text-[28px] font-normal leading-none text-text">{Math.round(ring)}%</span>
                </ProgressRing>
              </div>
            </div>

            {phase === "review" && (
              <div className="fade-up mt-8 space-y-6 border-t border-line pt-6">
                <section aria-label="target role" className="space-y-2">
                  <h2 className="font-doc text-base text-text">which role are you aiming for?</h2>
                  <div className="flex flex-wrap gap-2">
                    {roleOptions.map((r) => (
                      <Choice key={r} selected={targetRole === r} onClick={() => setTargetRole(r)}>
                        {r}
                      </Choice>
                    ))}
                    {customRole && (
                      <Choice selected onClick={() => setTargetRole("")}>
                        {customRole}
                      </Choice>
                    )}
                    <AddChip label="something else" onAdd={(v) => setTargetRole(v.slice(0, 100))} />
                  </div>
                </section>

                <section aria-label="where you are" className="space-y-2">
                  <h2 className="font-doc text-base text-text">where are you in your search?</h2>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map((s) => (
                      <Choice key={s.value} selected={stage === s.value} onClick={() => setStage(s.value)}>
                        {s.label}
                      </Choice>
                    ))}
                  </div>
                </section>

                <section aria-label="suggested next step" className="flex flex-wrap items-center gap-3 rounded-[14px] bg-soft px-4 py-3">
                  <PipAvatar outfit="rocket" size="sm" alt="" />
                  <p className="min-w-0 flex-1 text-sm text-text">
                    <span className="font-pixel text-[11px] uppercase tracking-wider text-muted">next step </span>
                    paste a job link on home. pip checks the match and tailors your resume.
                  </p>
                </section>

                {error && errorKind === "save" && (
                  <div role="alert" className="rounded-[14px] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-text">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={finish} disabled={busy || !targetRole.trim() || !stage} size="lg" className="bg-ink text-ink-foreground hover:opacity-90">
                    {busy ? <Loader2 className="animate-spin" /> : null}
                    {errorKind === "save" ? "try again" : "continue"}
                    {!busy && <ArrowRight />}
                  </Button>
                  {(!targetRole.trim() || !stage) && <span className="text-xs text-muted">pick a role and a stage to continue</span>}
                </div>
              </div>
            )}
          </>
        )}
      </AppWindow>
    </div>
  );
}
