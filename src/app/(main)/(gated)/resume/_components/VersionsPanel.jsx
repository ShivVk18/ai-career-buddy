"use client";

import { useCallback, useEffect, useState } from "react";
import { History, Link2, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SourceChips from "@/components/shared/SourceChips";
import { generationErrorMessage } from "@/components/shared/generationError";
import {
  listResumeVersions,
  saveResumeVersion,
  restoreResumeVersion,
  getResumeVersion,
} from "@/actions/Resume";
import { SECTION_CLASS, HEADING_CLASS, LABEL_CLASS } from "./MatchCard";

const UNDO_KEY = "resume-restore-undo";

/** Sources panel: what the accepted edits of one version cited. */
function VersionSources({ versionId }) {
  const [state, setState] = useState({ loading: true, error: "", applied: [], jd: false });

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await getResumeVersion(versionId);
        if (!live) return;
        if (!res || res.error) setState({ loading: false, error: generationErrorMessage(res), applied: [] });
        else setState({ loading: false, error: "", applied: res.applied || [] });
      } catch {
        if (live) setState({ loading: false, error: "We couldn't load this version.", applied: [] });
      }
    })();
    return () => {
      live = false;
    };
  }, [versionId]);

  return (
    <div className="mt-4 border border-line rounded-xl p-4 space-y-4 bg-divider/5">
      <p className={`${LABEL_CLASS} flex items-center gap-2`}>
        <Link2 className="size-3 text-brand-ink" aria-hidden="true" /> sources for accepted edits
      </p>
      {state.loading && <p className="text-xs text-muted">Loading...</p>}
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      {!state.loading && !state.error && state.applied.length === 0 && (
        <p className="text-xs text-muted">
          This version has no tailored edits, so there are no sources to show.
        </p>
      )}
      {state.applied.map((a) => (
        <div key={a.proposalId} className="space-y-2">
          <p className="text-xs text-text font-general">{a.proposed}</p>
          <SourceChips sources={a.sources} />
        </div>
      ))}
    </div>
  );
}

export default function VersionsPanel({ ensureSaved, refreshKey, onChanged }) {
  const [versions, setVersions] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [label, setLabel] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [restoringId, setRestoringId] = useState(null);
  const [openSources, setOpenSources] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await listResumeVersions();
      if (!Array.isArray(res)) {
        setLoadError(generationErrorMessage(res, "We couldn't load your versions."));
        setVersions([]);
      } else {
        setLoadError("");
        setVersions(res);
      }
    } catch {
      setLoadError("We couldn't load your versions.");
      setVersions([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleSave = async () => {
    if (!label.trim()) {
      setSaveError("Give this version a label.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      // Versions snapshot the SAVED resume, so save the form first.
      if (!(await ensureSaved())) return;
      const res = await saveResumeVersion({
        label: label.trim(),
        jobTitle: jobTitle.trim() || undefined,
        companyName: companyName.trim() || undefined,
      });
      if (!res || res.error) {
        setSaveError(generationErrorMessage(res));
        return;
      }
      toast.success("Version saved");
      setLabel("");
      setJobTitle("");
      setCompanyName("");
      await load();
      onChanged?.();
    } catch {
      setSaveError("We couldn't save the version. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // The page must reload to show a restored resume, which would wipe the toast. So the Undo token is kept in
  // sessionStorage and the Undo toast is shown right after the reload (5 s).
  useEffect(() => {
    let raw = null;
    try {
      raw = sessionStorage.getItem(UNDO_KEY);
      sessionStorage.removeItem(UNDO_KEY);
    } catch {}
    if (!raw) return;
    let undo;
    try {
      undo = JSON.parse(raw);
    } catch {
      return;
    }
    if (!undo?.id) return;
    toast.success(`Restored "${undo.label || "version"}"`, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: async () => {
          const res = await restoreResumeVersion(undo.id).catch(() => null);
          if (!res || res.error) {
            toast.error(generationErrorMessage(res, "Couldn't undo that. Your resume is unchanged."));
            return;
          }
          toast.success("Undone. Reloading your resume...");
          setTimeout(() => window.location.reload(), 400);
        },
      },
    });
  }, []);

  // No confirm: the current resume is snapshotted by the server first (undoVersionId), and Undo restores it.
  const handleRestore = async (v) => {
    if (restoringId) return;
    setRestoringId(v.id);
    try {
      // Save pending form edits first so they end up in the "Before restore" copy and
      // autosave cannot overwrite the restored resume.
      if (!(await ensureSaved())) return;
      const res = await restoreResumeVersion(v.id);
      if (!res || res.error) {
        toast.error(generationErrorMessage(res));
        return;
      }
      const undoId = res.undoVersionId || res.backupVersionId;
      try {
        if (undoId) sessionStorage.setItem(UNDO_KEY, JSON.stringify({ id: undoId, label: v.label }));
      } catch {}
      toast.success("Version restored. Reloading your resume...");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("We couldn't restore this version. Your resume was not changed.");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className={SECTION_CLASS}>
      <h3 className={HEADING_CLASS}>
        <History className="size-4 text-brand-ink" aria-hidden="true" />
        versions
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <Input placeholder="label (e.g. backend at stripe)" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={120} />
        <Input placeholder="job title (optional)" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={200} />
        <Input placeholder="company (optional)" value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={200} />
      </div>
      <div className="flex items-center gap-4 flex-wrap mb-8">
        <Button type="button" variant="ink" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          save version
        </Button>
        <span className="text-xs text-muted">
          saves your current form first, then snapshots it.
        </span>
      </div>
      {saveError && <p className="text-xs text-danger mb-4">{saveError}</p>}

      {versions === null && <p className="text-xs text-muted">loading versions…</p>}
      {loadError && <p className="text-xs text-danger">{loadError}</p>}
      {versions && versions.length === 0 && !loadError && (
        <p className="text-xs text-muted">no versions yet. save one above or tailor your resume to a job.</p>
      )}
      <ul className="space-y-3">
        {versions?.map((v) => (
          <li key={v.id} className="border border-line rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-text truncate">{v.label}</p>
                <p className="text-xs text-muted mt-1">
                  {new Date(v.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
                  {v.matchPercentage != null && ` / ${v.matchPercentage}% match`}
                  {!v.restorable && " / plain text copy"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpenSources(openSources === v.id ? null : v.id)}>
                  <Link2 className="size-3" /> sources
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={!v.restorable || !!restoringId} onClick={() => handleRestore(v)}>
                  {restoringId === v.id ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />} restore
                </Button>
              </div>
            </div>
            {openSources === v.id && <VersionSources versionId={v.id} />}
          </li>
        ))}
      </ul>

    </div>
  );
}
