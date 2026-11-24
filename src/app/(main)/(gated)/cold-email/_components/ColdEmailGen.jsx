"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { generateColdEmail } from "@/actions/ColdEmail";
import { generationErrorMessage } from "@/components/shared/generationError";
import JobStart from "@/components/shared/JobStart";
import JobDetailsFields from "@/components/shared/JobDetailsFields";
import ToolFrame from "@/components/shared/ToolFrame";
import { FieldError, FieldLabel, InkButton, More, Note, fieldClass } from "@/components/shared/ToolBits";
import PipStatus from "@/components/ui/PipStatus";
import { cn } from "@/lib/utils";

const EMPTY = { companyName: "", jobTitle: "", jobDescription: "", recipientName: "", recipientRole: "", recipientEmail: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ColdEmailGenerator({ source, generate = generateColdEmail, onDone }) {
  const router = useRouter();
  const [jobId, setJobId] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const set = (k, v) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.jobDescription.trim()) next.jobDescription = "paste the job description, or pick one of your jobs.";
    if (values.recipientEmail.trim() && !EMAIL_RE.test(values.recipientEmail.trim())) next.recipientEmail = "that email doesn't look right.";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await generate({ ...values, ...(jobId ? { jobId } : {}) });
      if (res?.error || res?.code || !res?.id) {
        setError(generationErrorMessage(res));
        return;
      }
      toast.success("cold email ready");
      if (onDone) onDone(res);
      else router.push(`/cold-email/${res.id}`);
    } catch (err) {
      setError(err?.message || "we couldn't write that email. try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolFrame
      title="cold email"
      line="a short note to a real person. pip writes it, you send it."
      outfit="rocket"
      back={{ href: "/cold-email", label: "your emails" }}
      windowTitle="ascendai · new cold email"
    >
      <form onSubmit={submit} className="space-y-6" noValidate>
        <JobStart
          source={source}
          disabled={busy}
          hasErrors={!!errors.jobDescription}
          onPick={({ jobId: id, company, title, jdText }) => {
            setJobId(id);
            setValues((s) => ({ ...s, companyName: company, jobTitle: title, jobDescription: jdText }));
            setErrors({});
          }}
          onClear={() => {
            setJobId(null);
            setValues((s) => ({ ...s, companyName: "", jobTitle: "", jobDescription: "" }));
          }}
        >
          <JobDetailsFields idPrefix="ce" values={values} onChange={set} errors={errors} placeholder="paste the job description or what you know about the role." />
        </JobStart>

        <More open={moreOpen} onToggle={() => setMoreOpen((v) => !v)} forceOpen={!!errors.recipientEmail} label="more: who it's for (optional)">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="ce-rname">name</FieldLabel>
              <input id="ce-rname" value={values.recipientName} onChange={(e) => set("recipientName", e.target.value)} placeholder="priya sharma" maxLength={100} autoComplete="off" className={cn(fieldClass, "mt-1.5 h-11")} />
            </div>
            <div>
              <FieldLabel htmlFor="ce-rrole">role</FieldLabel>
              <input id="ce-rrole" value={values.recipientRole} onChange={(e) => set("recipientRole", e.target.value)} placeholder="engineering manager" maxLength={150} autoComplete="off" className={cn(fieldClass, "mt-1.5 h-11")} />
            </div>
            <div>
              <FieldLabel htmlFor="ce-remail">email</FieldLabel>
              <input id="ce-remail" type="email" value={values.recipientEmail} onChange={(e) => set("recipientEmail", e.target.value)} placeholder="name@company.com" maxLength={254} autoComplete="off" aria-invalid={!!errors.recipientEmail} className={cn(fieldClass, "mt-1.5 h-11")} />
              <FieldError>{errors.recipientEmail}</FieldError>
            </div>
          </div>
          <p className="text-xs text-muted">the email is only kept for the &quot;open in mail&quot; button. it never goes to the ai and nothing is sent for you.</p>
        </More>

        {error && <Note tone="error">{error}</Note>}
        {busy ? (
          <PipStatus outfit="rocket" text="writing your email, about 20 seconds" />
        ) : (
          <InkButton type="submit" busy={busy} busyText="writing…">
            <Send className="size-4" aria-hidden="true" /> write my email
          </InkButton>
        )}
      </form>
    </ToolFrame>
  );
}
