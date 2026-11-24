"use client"

import { useState } from "react"
import MDEditor from "@uiw/react-md-editor"
import { useTheme } from "next-themes"
import { Mail, Briefcase, CalendarClock, Copy, Edit3, Eye, Save, FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import ToolFrame from "@/components/shared/ToolFrame"
import { FieldLabel, fieldClass } from "@/components/shared/ToolBits"
import { cn } from "@/lib/utils"

import { ParagraphSources, mapParagraphSources } from "@/components/shared/SourceChips";
import { generationErrorMessage } from "@/components/shared/generationError";
import SourceChips from "@/components/shared/SourceChips";
import { WordCount } from "@/components/shared/WritingHints";
import { COLD_EMAIL_WORDS } from "@/lib/writing";
import { updateColdEmail, setColdEmailFollowUp } from "@/actions/ColdEmail";

// Single address only: no whitespace, no second @, none of , ; < > " ( )
const EMAIL_RE = /^[^\s@,;<>"()]+@[^\s@,;<>"()]+\.[^\s@,;<>"()]+$/;
const MAILTO_MAX = 1800;

const ColdEmailPreview = ({
  title = "your cold email",
  id,
  content,
  sources,
  recipientName = "",
  recipientRole = "",
  recipientEmail = "",
  subject = "",
  followUpAt = "",
}) => {
  const { resolvedTheme } = useTheme()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const initialFields = { recipientName, recipientRole, recipientEmail, subject };
  const [fields, setFields] = useState(initialFields)
  const [savedFields, setSavedFields] = useState(initialFields)
  const [savingFields, setSavingFields] = useState(false)
  const [followUp, setFollowUp] = useState(followUpAt)
  const [savingFollowUp, setSavingFollowUp] = useState(false)
  const fieldsDirty = Object.keys(fields).some((k) => fields[k] !== savedFields[k])
  const emailTrim = fields.recipientEmail.trim()
  const emailValid = emailTrim === "" || EMAIL_RE.test(emailTrim)
  const setField = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }))
  const [editedContent, setEditedContent] = useState(content)
  const [previewMode, setPreviewMode] = useState("preview")
  const [savedContent, setSavedContent] = useState(content)
  const [saving, setSaving] = useState(false)
  const isDirty = (editedContent ?? "") !== (savedContent ?? "")

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateColdEmail(id, editedContent)
      if (!res || res.error) {
        toast.error(generationErrorMessage(res, "Failed to save your changes"))
        return
      }
      setSavedContent(editedContent)
      toast.success("Changes saved")
    } catch (error) {
      toast.error(error?.message || "Failed to save your changes")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFields = async () => {
    if (!emailValid) {
      toast.error("Enter a valid email address")
      return
    }
    setSavingFields(true)
    try {
      const payload = { ...fields, recipientEmail: emailTrim }
      const res = await updateColdEmail(id, null, payload)
      if (!res || res.error) {
        toast.error(generationErrorMessage(res, "Failed to save details"))
        return
      }
      setFields(payload)
      setSavedFields(payload)
      toast.success("Details saved")
    } catch (error) {
      toast.error(error?.message || "Failed to save details")
    } finally {
      setSavingFields(false)
    }
  }

  const handleFollowUp = async (value) => {
    const prev = followUp
    setFollowUp(value)
    setSavingFollowUp(true)
    try {
      const res = await setColdEmailFollowUp(id, value || null)
      if (!res || res.error) {
        setFollowUp(prev)
        toast.error(generationErrorMessage(res, "Failed to set reminder"))
        return
      }
      toast.success(value ? "Follow-up reminder set" : "Follow-up reminder cleared")
    } catch (error) {
      setFollowUp(prev)
      toast.error(error?.message || "Failed to set reminder")
    } finally {
      setSavingFollowUp(false)
    }
  }

  const inDays = (n) => {
    const d = new Date()
    d.setDate(d.getDate() + n)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }
  const summary = [fields.recipientName, fields.recipientRole, fields.recipientEmail].filter(Boolean).join(" · ")
  const detailsShown = detailsOpen || !emailValid || (!summary && !fields.subject)

  // D35: built only on an explicit click, from the address the user typed. Never sends anything.
  const mailtoUrl = emailTrim && emailValid
    ? `mailto:${encodeURIComponent(emailTrim).replace(/%40/g, "@")}?subject=${encodeURIComponent(fields.subject)}&body=${encodeURIComponent(editedContent || "")}`
    : null
  const mailtoTooLong = !!mailtoUrl && mailtoUrl.length > MAILTO_MAX

  const handleMailto = () => {
    if (!mailtoUrl) return
    if (mailtoTooLong) {
      toast.warning("This email is too long for a mail link and may be cut off. Copy the text instead.")
      return
    }
    window.location.href = mailtoUrl
  }

  const mappedParts = mapParagraphSources(editedContent, sources).parts
  const paragraphs = mappedParts.map((p) => p.text)
  const hasProject = (i) =>
    (mappedParts[i]?.sources || []).some((s) => typeof s?.id === "string" && s.id.startsWith("proj:"))

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent)
      toast.success("copied")
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([editedContent], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = "cold-email.txt"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success("downloaded")
  }

  const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-panel px-5 text-sm text-text outline-none transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
  const chipBtn = (on) => cn("inline-flex min-h-10 items-center rounded-[9px] px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60", on ? "bg-brand-soft text-brand-ink ring-1 ring-brand/50" : "bg-soft text-muted hover:text-text")

  return (
    <ToolFrame
      title={title}
      line="draft ready. edit it, copy it, send it yourself."
      outfit="rocket"
      back={{ href: "/cold-email", label: "your emails" }}
      windowTitle="ascendai · cold email"
      bodyClassName="space-y-8"
    >
      {/* actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div role="group" aria-label="view" className="inline-flex gap-1 rounded-full bg-soft p-1">
          {[["edit", Edit3, "edit"], ["preview", Eye, "preview"]].map(([m, Icon, text]) => (
            <button
              key={m}
              type="button"
              aria-pressed={previewMode === m}
              onClick={() => setPreviewMode(m)}
              className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring", previewMode === m ? "bg-ink text-ink-foreground" : "text-muted hover:text-text")}
            >
              <Icon className="size-4" aria-hidden="true" /> {text}
            </button>
          ))}
        </div>
        <button type="button" onClick={handleSave} disabled={saving || !isDirty || !id} className={btn}>
          {saving ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          {saving ? "saving…" : isDirty ? "save changes" : "saved"}
        </button>
        <button type="button" onClick={handleCopy} className={btn}>
          <Copy className="size-4" aria-hidden="true" /> copy
        </button>
        <button type="button" onClick={handleDownload} className={btn}>
          <FileDown className="size-4" aria-hidden="true" /> download txt
        </button>
        <button type="button" onClick={handleMailto} disabled={!mailtoUrl} className="btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50">
          <Mail className="size-4" aria-hidden="true" /> open in mail
        </button>
      </div>
      <p className="-mt-4 text-xs text-muted" role="status">
        {!mailtoUrl ? "add a valid recipient email to turn on open in mail." : mailtoTooLong ? "too long for a mail link, it may be cut off. use copy instead." : "opens your mail app with this draft. you send it yourself."}
      </p>

      {/* to + subject, collapsed to a summary */}
      <section aria-label="recipient and subject" className="space-y-3 rounded-[20px] border border-line p-4 sm:p-5">
        {!detailsShown ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-1 text-sm">
              <p className="truncate text-text"><span className="text-muted">to </span>{summary || "no recipient yet"}</p>
              <p className="truncate text-text"><span className="text-muted">subject </span>{fields.subject || "none yet"}</p>
            </div>
            <button type="button" onClick={() => setDetailsOpen(true)} className="min-h-10 rounded-full px-3 text-sm text-muted underline-offset-4 outline-none hover:text-text hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              edit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="ce-name">name</FieldLabel>
                <input id="ce-name" value={fields.recipientName} onChange={setField("recipientName")} maxLength={100} className={cn(fieldClass, "mt-1.5 h-11")} />
              </div>
              <div>
                <FieldLabel htmlFor="ce-role">role</FieldLabel>
                <input id="ce-role" value={fields.recipientRole} onChange={setField("recipientRole")} maxLength={150} className={cn(fieldClass, "mt-1.5 h-11")} />
              </div>
              <div>
                <FieldLabel htmlFor="ce-email">email</FieldLabel>
                <input id="ce-email" type="email" value={fields.recipientEmail} onChange={setField("recipientEmail")} maxLength={254} aria-invalid={!emailValid} className={cn(fieldClass, "mt-1.5 h-11")} />
                {!emailValid && <p role="alert" className="mt-1.5 text-xs text-danger">enter a valid email address</p>}
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="ce-subject">subject</FieldLabel>
              <input id="ce-subject" value={fields.subject} onChange={setField("subject")} maxLength={200} placeholder={fields.subject ? "" : "no subject yet. type one."} className={cn(fieldClass, "mt-1.5 h-11")} />
              {fields.subject === subject && <SourceChips sources={sources?.subject?.sources} heading="subject based on" />}
            </div>
            <button type="button" onClick={handleSaveFields} disabled={savingFields || !fieldsDirty || !emailValid || !id} className={btn}>
              {savingFields ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              {savingFields ? "saving…" : fieldsDirty ? "save details" : "details saved"}
            </button>
          </div>
        )}
      </section>

      {/* follow-up: quick chips, date only on request */}
      <section aria-label="follow-up reminder" className="space-y-2.5">
        <p className="flex items-center gap-2 text-xs font-medium text-muted"><CalendarClock className="size-3.5" aria-hidden="true" /> remind me to follow up</p>
        <div role="radiogroup" aria-label="follow-up reminder" className="flex flex-wrap items-center gap-2">
          {[[3, "in 3 days"], [7, "in 1 week"], [14, "in 2 weeks"]].map(([n, text]) => {
            const v = inDays(n)
            return (
              <button key={n} type="button" role="radio" aria-checked={followUp === v} disabled={savingFollowUp || !id} onClick={() => handleFollowUp(v)} className={chipBtn(followUp === v)}>
                {text}
              </button>
            )
          })}
          <label className="sr-only" htmlFor="ce-followup">pick a follow-up date</label>
          <input id="ce-followup" type="date" value={followUp} disabled={savingFollowUp || !id} onChange={(e) => handleFollowUp(e.target.value)} className={cn(fieldClass, "h-10 w-auto")} />
          {followUp && (
            <button type="button" disabled={savingFollowUp} onClick={() => handleFollowUp("")} className="min-h-10 rounded-full px-3 text-sm text-muted outline-none hover:text-text focus-visible:ring-2 focus-visible:ring-ring">
              clear
            </button>
          )}
        </div>
        <p className="text-xs text-muted">a reminder on your home screen. nothing is sent.</p>
      </section>

      {/* editor */}
      <div className="overflow-hidden rounded-[20px] border border-line">
        <MDEditor
          value={editedContent || content}
          onChange={setEditedContent}
          preview={previewMode}
          hideToolbar={previewMode === "preview"}
          visibleDragbar={false}
          height={520}
          data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
          className="custom-md-editor"
          style={{ backgroundColor: "transparent" }}
          textareaProps={{
            "aria-label": "cold email text",
            className: "bg-transparent text-foreground placeholder:text-muted border-none outline-none resize-none font-sans text-sm leading-relaxed p-6",
            style: { backgroundColor: "transparent", color: "var(--foreground)" },
          }}
          previewOptions={{
            className: "prose max-w-none p-6 dark:prose-invert",
            style: { backgroundColor: "transparent", color: "var(--foreground)" },
          }}
        />
      </div>

      <div className="space-y-4">
        <WordCount text={editedContent} range={COLD_EMAIL_WORDS} />
        <p className="text-xs text-muted">
          aim for about {COLD_EMAIL_WORDS.target} words ({COLD_EMAIL_WORDS.min} to {COLD_EMAIL_WORDS.max}). end with one low-pressure ask, and check no [brackets] are left.
        </p>
        {paragraphs.length > 0 && (
          <ol className="space-y-2.5">
            {paragraphs.map((text, i) => (
              <li key={i} className={cn("rounded-[9px] p-3 text-xs leading-relaxed", hasProject(i) ? "bg-brand-soft" : "bg-soft")}>
                {hasProject(i) && (
                  <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-brand-ink">
                    <Briefcase className="size-3" aria-hidden="true" /> matched project
                  </span>
                )}
                <p className="whitespace-pre-wrap text-text">{text}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <ParagraphSources content={editedContent} sources={sources} />

      <style jsx global>{`
        .custom-md-editor { background: transparent !important; border: none !important; box-shadow: none !important; }
        .custom-md-editor .w-md-editor-text-pre,
        .custom-md-editor .w-md-editor-text-textarea { background: transparent !important; color: var(--foreground) !important; }
        .custom-md-editor .wmde-markdown { background: transparent !important; color: var(--foreground) !important; }
        .custom-md-editor .w-md-editor-preview { background: transparent !important; border-left: 1px solid var(--line) !important; box-shadow: none !important; }
        .custom-md-editor .w-md-editor-toolbar { background: var(--soft) !important; border-bottom: 1px solid var(--line) !important; }
        .custom-md-editor .w-md-editor-toolbar button { color: var(--foreground) !important; }
        .custom-md-editor .w-md-editor-content { background: transparent !important; }
      `}</style>
    </ToolFrame>
  )
}

export default ColdEmailPreview
