"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PenTool } from "lucide-react";
import { generateCoverLetter } from "@/actions/CoverLetter";
import { generationErrorMessage } from "@/components/shared/generationError";
import JobStart from "@/components/shared/JobStart";
import JobDetailsFields from "@/components/shared/JobDetailsFields";
import ToolFrame from "@/components/shared/ToolFrame";
import { ChoiceChips, FieldLabel, InkButton, Note } from "@/components/shared/ToolBits";
import PipStatus from "@/components/ui/PipStatus";
import { COVER_LETTER_TONES, DEFAULT_TONE, TONE_LABELS } from "@/lib/writing";

const EMPTY = { companyName: "", jobTitle: "", jobDescription: "" };

export default function CoverLetterGenerator({ source, generate = generateCoverLetter, onDone }) {
  const router = useRouter();
  const [tone, setTone] = useState(DEFAULT_TONE);
  const [jobId, setJobId] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k, v) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!values.jobDescription.trim()) {
      setErrors({ jobDescription: "paste the job description, or pick one of your jobs." });
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await generate({ ...values, tone, ...(jobId ? { jobId } : {}) });
      if (res?.error || res?.code || !res?.id) {
        setError(generationErrorMessage(res));
        return;
      }
      toast.success("cover letter ready");
      if (onDone) onDone(res);
      else router.push(`/cover-letter/${res.id}`);
    } catch (err) {
      setError(err?.message || "we couldn't write that letter. try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame
      title="cover letter"
      line="pick a job and pip writes it from your resume. nothing is invented."
      outfit="wizard"
      back={{ href: "/cover-letter", label: "your letters" }}
      windowTitle="ascendai · new cover letter"
    >
      <form onSubmit={submit} className="space-y-6" noValidate>
        <JobStart
          source={source}
          disabled={busy}
          hasErrors={!!errors.jobDescription}
          onPick={({ jobId: id, company, title, jdText }) => {
            setJobId(id);
            setValues({ companyName: company, jobTitle: title, jobDescription: jdText });
            setErrors({});
          }}
          onClear={() => {
            setJobId(null);
            setValues(EMPTY);
          }}
        >
          <JobDetailsFields idPrefix="cl" values={values} onChange={set} errors={errors} placeholder="paste the job requirements. pip uses them to pick your most relevant work." />
        </JobStart>

        <div className="space-y-2">
          <FieldLabel>tone</FieldLabel>
          <ChoiceChips label="tone" value={tone} onChange={setTone} options={COVER_LETTER_TONES.map((t) => [t, TONE_LABELS[t]?.toLowerCase?.() || t])} />
        </div>

        {error && <Note tone="error">{error}</Note>}
        {busy ? (
          <PipStatus outfit="wizard" text="writing your letter, about 20 seconds" />
        ) : (
          <InkButton type="submit" busy={busy} busyText="writing…">
            <PenTool className="size-4" aria-hidden="true" /> write my letter
          </InkButton>
        )}
      </form>
    </ToolFrame>
  );
}
