"use client"

import { useState } from "react"
import MDEditor from "@uiw/react-md-editor"
import { Button } from "@/components/ui/button"
import { Mail, Briefcase, CalendarClock, Download, Copy, Edit3, FileText, CheckCircle2, Eye, Sparkles, Zap, Save, FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { ParagraphSources } from "@/components/shared/SourceChips";
import { generationErrorMessage } from "@/components/shared/generationError";
import SourceChips from "@/components/shared/SourceChips";
import { WordCount } from "@/components/shared/WritingHints";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COLD_EMAIL_WORDS } from "@/lib/writing";
import { updateColdEmail, setColdEmailFollowUp } from "@/actions/ColdEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAILTO_MAX = 1800;

const ColdEmailPreview = ({
  id,
  content,
  sources,
  recipientName = "",
  recipientRole = "",
  recipientEmail = "",
  subject = "",
  followUpAt = "",
}) => {
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

  const paragraphMeta = Array.isArray(sources?.paragraphs) ? sources.paragraphs : null
  const paragraphs = (editedContent || "").split(/\n{2,}/).filter(Boolean)
  const canMatch = paragraphMeta && paragraphs.length === paragraphMeta.length
  const hasProject = (i) =>
    !!canMatch && (paragraphMeta[i]?.sources || []).some((s) => typeof s?.id === "string" && s.id.startsWith("proj:"))

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent)
      toast.success("Cold email copied to clipboard! ✨")
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
    toast.success("Cold email downloaded! 📄")
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Action Bar */}
      <div className="border border-border bg-background rounded-sm p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-divider/10"></div>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-sm border border-divider bg-divider/10 flex items-center justify-center transition-editorial shadow-sm">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-clash font-bold text-foreground uppercase tracking-tight">Preview & Edit</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Ready to send</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-1 p-1 border border-divider bg-divider/5 rounded-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode("edit")}
                className={`h-10 px-6 text-[10px] font-bold tracking-widest uppercase transition-editorial rounded-sm ${
                  previewMode === "edit"
                    ? "bg-accent text-accent-foreground border border-accent hover:bg-accent/90"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode("preview")}
                className={`h-10 px-6 text-[10px] font-bold tracking-widest uppercase transition-editorial rounded-sm ${
                  previewMode === "preview"
                    ? "bg-accent text-accent-foreground border border-accent hover:bg-accent/90"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving || !isDirty || !id}
              className="h-12 px-6 border-divider hover:border-accent text-[10px] font-bold tracking-widest uppercase transition-editorial"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-3 animate-spin" /> : <Save className="h-4 w-4 mr-3" />}
              {saving ? "Saving..." : isDirty ? "Save changes" : "Saved"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-12 px-6 border-divider hover:border-accent text-[10px] font-bold tracking-widest uppercase transition-editorial"
            >
              <Copy className="h-4 w-4 mr-3" />
              Copy Text
            </Button>

            <Button
              onClick={handleDownload}
              className="h-12 px-8 text-[10px] font-bold tracking-widest uppercase shadow-lg"
            >
              <FileDown className="h-4 w-4 mr-3" />
              Download TXT
            </Button>
          </div>
        </div>
      </div>

      {/* Recipient, subject, follow-up, mail client */}
      <div className="border border-border bg-background rounded-sm p-8 shadow-2xl space-y-8">
        <h3 className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase flex items-center gap-4">
          <Mail className="h-4 w-4 text-accent" />
          Recipient & Subject
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="ce-name" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Name</Label>
            <Input id="ce-name" value={fields.recipientName} onChange={setField("recipientName")} maxLength={100} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ce-role" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Role</Label>
            <Input id="ce-role" value={fields.recipientRole} onChange={setField("recipientRole")} maxLength={150} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ce-email" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Email</Label>
            <Input id="ce-email" type="email" value={fields.recipientEmail} onChange={setField("recipientEmail")} maxLength={254} className="h-12" />
            {!emailValid && (
              <p className="text-[10px] text-destructive font-bold uppercase tracking-widest">Enter a valid email address</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ce-subject" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Subject</Label>
          <Input
            id="ce-subject"
            value={fields.subject}
            onChange={setField("subject")}
            maxLength={200}
            placeholder={fields.subject ? "" : "No subject yet. Type one."}
            className="h-12"
          />
          <SourceChips sources={sources?.subject?.sources} heading="Subject based on" />
        </div>
        <Button
          variant="outline"
          onClick={handleSaveFields}
          disabled={savingFields || !fieldsDirty || !emailValid || !id}
          className="h-12 px-6 border-divider hover:border-accent text-[10px] font-bold tracking-widest uppercase"
        >
          {savingFields ? <Loader2 className="h-4 w-4 mr-3 animate-spin" /> : <Save className="h-4 w-4 mr-3" />}
          {savingFields ? "Saving..." : fieldsDirty ? "Save details" : "Details saved"}
        </Button>

        <div className="border-t border-divider pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label htmlFor="ce-followup" className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
              <CalendarClock className="h-3 w-3 text-accent" /> Follow-up reminder
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="ce-followup"
                type="date"
                value={followUp}
                disabled={savingFollowUp || !id}
                onChange={(e) => handleFollowUp(e.target.value)}
                className="h-12 max-w-[220px]"
              />
              {followUp && (
                <Button variant="ghost" size="sm" disabled={savingFollowUp} onClick={() => handleFollowUp("")} className="text-[10px] font-bold tracking-widest uppercase">
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">A reminder on your dashboard. Nothing is sent.</p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Send</span>
            <div>
              <Button
                onClick={handleMailto}
                disabled={!mailtoUrl}
                className="h-12 px-6 text-[10px] font-bold tracking-widest uppercase"
              >
                <Mail className="h-4 w-4 mr-3" />
                Open in mail client
              </Button>
            </div>
            {!mailtoUrl ? (
              <p className="text-xs text-muted-foreground">Add a valid recipient email to enable this.</p>
            ) : mailtoTooLong ? (
              <p className="text-xs text-destructive">Too long for a mail link; it may be cut off. Use Copy Text instead.</p>
            ) : (
              <p className="text-xs text-muted-foreground">Opens your mail app with this draft. You send it yourself.</p>
            )}
          </div>
        </div>
      </div>

      {/* Editor Container */}
      <div className="border border-border bg-background rounded-sm overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-divider/10"></div>
        <div className="border-b border-divider p-6 bg-divider/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent/60 rounded-full"></div>
              <div className="w-2 h-2 bg-accent/40 rounded-full"></div>
              <div className="w-2 h-2 bg-accent/20 rounded-full"></div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">cold-email.md</span>
          </div>
        </div>

        <div className="relative">
          <MDEditor
            value={editedContent || content}
            onChange={setEditedContent}
            preview={previewMode}
            hideToolbar={previewMode === "preview"}
            visibleDragbar={false}
            height={600}
            data-color-mode="dark"
            className="custom-md-editor"
            style={{
              backgroundColor: "transparent",
            }}
            textareaProps={{
              className: "bg-transparent text-foreground placeholder:text-muted border-none outline-none resize-none font-general text-sm leading-relaxed p-10",
              style: {
                backgroundColor: "transparent",
                color: "var(--foreground)",
              },
            }}
            previewOptions={{
              className: "prose prose-invert max-w-none p-12",
              style: {
                backgroundColor: "transparent",
                color: "var(--foreground)",
              },
            }}
          />
        </div>
      </div>

      <div className="border border-border bg-background rounded-sm p-8 shadow-2xl space-y-6">
        <WordCount text={editedContent} range={COLD_EMAIL_WORDS} />
        {paragraphs.length > 0 && (
          <ol className="space-y-3">
            {paragraphs.map((text, i) => (
              <li
                key={i}
                className={`text-xs leading-relaxed font-general p-3 rounded-sm border ${
                  hasProject(i) ? "border-accent bg-accent/10" : "border-divider bg-divider/5"
                }`}
              >
                {hasProject(i) && (
                  <span className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-accent">
                    <Briefcase className="h-3 w-3" /> Matched project
                  </span>
                )}
                <p className="whitespace-pre-wrap">{text}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <ParagraphSources content={editedContent} sources={sources} />


      {/* Optimization Tips */}
      <div className="border border-border bg-background rounded-sm p-8 md:p-12 shadow-2xl">
        <h3 className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase mb-10 flex items-center gap-4">
          <Sparkles className="h-4 w-4 text-accent" />
          Pro Tips from your Buddy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-divider bg-divider/10 p-6 rounded-sm transition-editorial hover:border-accent group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-sm bg-divider/20 border border-divider/30 group-hover:border-accent transition-editorial flex items-center justify-center flex-shrink-0 mt-1">
                <Zap className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-accent mb-3 tracking-widest uppercase">Be Brief</h4>
                <p className="text-muted-foreground text-xs leading-relaxed font-general font-light">
                  Decision makers are busy. Keep your email under 100 words for the best response rate.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-divider bg-divider/10 p-6 rounded-sm transition-editorial hover:border-accent group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-sm bg-divider/20 border border-divider/30 group-hover:border-accent transition-editorial flex items-center justify-center flex-shrink-0 mt-1">
                <FileText className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-accent mb-3 tracking-widest uppercase">The Subject Line</h4>
                <p className="text-muted-foreground text-xs leading-relaxed font-general font-light">
                  Make it catchy but professional. Try something like &quot;Question about [Company]&apos;s [Role]&quot;.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-divider bg-divider/10 p-6 rounded-sm transition-editorial hover:border-accent group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-sm bg-divider/20 border border-divider/30 group-hover:border-accent transition-editorial flex items-center justify-center flex-shrink-0 mt-1">
                <Edit3 className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-accent mb-3 tracking-widest uppercase">Call to Action</h4>
                <p className="text-muted-foreground text-xs leading-relaxed font-general font-light">
                  End with a clear, low-pressure request like &quot;Open to a 5-minute chat next week?&quot;
                </p>
              </div>
            </div>
          </div>

          <div className="border border-divider bg-divider/10 p-6 rounded-sm transition-editorial hover:border-accent group">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-sm bg-divider/20 border border-divider/30 group-hover:border-accent transition-editorial flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle2 className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-accent mb-3 tracking-widest uppercase">Final Check</h4>
                <p className="text-muted-foreground text-xs leading-relaxed font-general font-light">
                  Make sure you&apos;ve addressed the recipient by name and there are no placeholder brackets left.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-md-editor {
          background: transparent !important;
          border: none !important;
        }
        
        .custom-md-editor .w-md-editor-text-pre,
        .custom-md-editor .w-md-editor-text-textarea {
          background: transparent !important;
          color: var(--foreground) !important;
        }
        
        .custom-md-editor .w-md-editor-text {
          background: rgba(var(--accent-rgb), 0.05) !important;
        }
        
        .custom-md-editor .wmde-markdown {
          background: transparent !important;
          color: var(--foreground) !important;
          font-family: 'General Sans', sans-serif !important;
        }
        
        .custom-md-editor .w-md-editor-preview {
          background: transparent !important;
          border-left: 1px solid var(--divider) !important;
        }

        .custom-md-editor .w-md-editor-toolbar {
          background: var(--background) !important;
          border-bottom: 1px solid var(--divider) !important;
          color: var(--foreground) !important;
        }

        .custom-md-editor .w-md-editor-toolbar button {
          color: var(--foreground) !important;
        }

        .custom-md-editor .w-md-editor-content {
          background: transparent !important;
        }
      `}</style>
    </div>
  )
}

export default ColdEmailPreview