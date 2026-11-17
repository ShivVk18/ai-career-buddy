# PLAN: UX flow pass

Branch `ux-flow-pass`. Decisions: D55–D63 in DECISIONS.md. The audit is in FLOW-AUDIT.md.

**Done when:**
- Onboarding is a resume drop, then chips, then 2 taps, with no multi-field form.
- Pasting a job (text or URL) creates a job and application with editable chips, and the 4 steps run with visible progress.
- "Needs you" is the single place to approve things, and resume edits show as tracked changes.
- The applications board works with drag and with taps.
- "Mark applied", "I got an interview", Offer and Closed each take one tap.
- Confirm dialogs are replaced by Undo, except for deleting the account or all data.
- Every page has loading, empty and error states, and ⌘K works.
- All six tools still work on their own.
- `npm test`, lint and the build pass.

Rules: never edit `.env`; migrations are SQL files only and are never applied; every query is scoped by userId; zod on every input; expected failures return `{error, code}`; sources (D26–D28), the number check and the per-action limit (D50) apply to every AI step; nothing is ever sent (D35); chat stays read-only (D62); no feature removed. Any multi-field form that remains needs a one-line reason in the plan's notes.

**Deferred:** Gmail, GitHub, Scout, the daily digest, notifications while away, scheduled Monday plans, proof uploads, the offer negotiation draft.

---

### 1. BACKEND: Security fix, contract and the job and application migration
- **Files:** `src/actions/Resume.js` (`seedResumeTemplates`), `prisma/schema.prisma`, new migration `job_application_flow`, `docs/ai/API-CONTRACT.md` §11
- **What:**
  - `seedResumeTemplates` stops being callable from the app: make it script-only or require an admin check, without removing seeding.
  - Add `Job` (userId, url?, jdText, company, title, location, sources Json, createdAt).
  - Add `Application` (userId, jobId, status enum SAVED/APPLIED/INTERVIEWING/OFFER/CLOSED, appliedAt, interviewAt, nextActionAt, followUpCount, closedReason, pipeline Json, deletedAt).
  - Add an optional `jobId` on CoverLetter, ColdEmail, ATSScore and ResumeVersion.
  - Add `deletedAt` on CoverLetter, ColdEmail and ATSScore.
  - Add `User.targetRole` and `User.jobSearchStage`.
  - Write the contract first.
- **Why:** D55, D60 and the HIGH security finding.
- **Test:** `prisma validate` passes. The seed action can no longer be called by a signed-in user.

### 2. BACKEND: Job intake from text or URL
- **Files:** new `src/actions/Jobs.js`, new `src/lib/jobs/fetch.js` (the guarded fetch), `src/lib/ai/schemas.js`
- **What:**
  - `intakeJob({input})` works out whether the input is a URL, job text or a question. A question returns `{kind:"question"}` for chat.
  - A URL goes through the guarded fetch (D56), then a readable-text extraction.
  - The text goes through one `fast` call that extracts company, title and location, each sourced to a job-description line and number-checked.
  - It creates the Job and an Application in SAVED.
  - `updateJobField(id, field, value)` handles inline chip edits.
  - `deleteJob` / `restoreJob` give the 5 s undo.
  - Add tests for the URL guard: private IPs, redirects, size, content type.
- **Why:** D55, D56 and gap #1.
- **Test:** Pasted text creates a job with sourced chips. Internal or private URLs are refused. A blocked site falls back with `PASTE_NEEDED`.

### 3. BACKEND: Resumable pipeline
- **Files:** new `src/actions/Pipeline.js`
- **What:**
  - `runNextStep(applicationId)` runs one step at a time, stores it in `Application.pipeline`, and is safe to repeat:
    - **Checker:** the computed match % plus an ATS score of your saved resume text against the job description.
    - **Tailor:** a `tailorResume` draft.
    - **Writer:** a cover letter linked to the job.
    - **Connector:** a cold email draft, never with a recipient (D34).
  - The whole run shares one `actionId` (D50).
  - `getPipeline(applicationId)` returns each step's status.
- **Why:** D57 and gap #5.
- **Test:** Calling it repeatedly finishes all 4 steps, once each. A rerun doesn't duplicate anything. The daily limit counts one action per run.

### 4. BACKEND: Needs you, application status and the result taps
- **Files:** `src/actions/Applications.js`, `src/actions/Dashboard.js`
- **What:**
  - `getNeedsYou()` is derived: pending tailor drafts, unreviewed letters and emails, ATS fix proposals, follow-ups due (5 quiet days after applying, at most 2, created lazily on load, and drafted only when you click), and upcoming interviews without a prep session.
  - `setApplicationStatus(id, status)` returns the previous status for undo.
  - `markApplied` and `setInterviewDate(id, date)` (the date also creates a prep session from the job description).
  - `closeApplication(id, reason)` turns that job's ATS gaps into roadmap tasks, with no AI.
  - The dashboard gets applications with one next action each, plus a `hasOffer` flag.
- **Why:** gaps #2, #3, #8 and #9.
- **Test:** The needs-you count matches the pending items. Closing an application adds gap tasks. A follow-up appears after 5 quiet days, at most twice.

### 5. BACKEND: Resume parsing to chips, onboarding answers and profile strength
- **Files:** `src/actions/Onboarding.js` (new), `src/actions/User.js`, `src/lib/ai/schemas.js`
- **What:**
  - `parseResumeToProfile(pdf)` extracts the PDF text in memory (unpdf), then one `write` call returns roles, projects, skills and years. Each item carries a quote verified against the text; unverified items are dropped.
  - It returns the chips (nothing is stored until you confirm).
  - `saveProfileChips(chips)` writes the builder entries (with ids) and the user's skills and experience. Industry is inferred and editable.
  - `saveOnboardingAnswers(targetRole, stage)`.
  - `getProfileStrength()` returns a % and one next action.
  - The onboarded rule becomes "has a resume or answered the 2 questions" (D59).
- **Why:** gaps #4 and #7.
- **Test:** A real PDF gives sourced chips, and invented items are dropped. Existing users stay onboarded.

### 6. BACKEND: Undo support, letter snapshots and deleting data
- **Files:** `src/actions/CoverLetter.js`, `ColdEmail.js`, `ResumeParser.js`, `Resume.js`, new `src/actions/Account.js`
- **What:**
  - Deletes set `deletedAt`, and `restore*` undoes them. Every reader filters out deleted rows. Rows are hard-deleted lazily after 7 days.
  - Regenerate, more formal, shorten and a new **warmer** option save the previous content and sources first. `undoLetterChange(id)` restores them.
  - `restoreResumeVersion` returns an undo token.
  - `deleteAllMyData()` and `deleteAccount()` (which also deletes the Clerk user) need a typed confirmation phrase, delete child rows in dependency order (InterviewAnswer first), and never touch other users.
- **Why:** D60 and D61, plus gap #10.
- **Test:** Delete then Undo restores the row. Deleting all data leaves the user with no data rows.

### 7. FRONTEND: Onboarding
- **Files:** `(main)/onboarding/**`, new `src/components/shared/EditableChips.jsx`
- **What:**
  - A drop zone (drag and drop or click).
  - Pip's parsing status, then the chips: click to edit inline (Enter or blur saves, Esc cancels), × to remove, + to add, with the source shown on hover.
  - 2 tap questions as chips, with the target role suggested from the resume.
  - The strength ring with one next action, then on to home.
  - A "no resume? add chips" manual path.
  - No multi-field form remains.
- **Why:** D59.
- **Test:** Onboarding takes under 2 minutes with a resume, using taps and chip edits only.

### 8. FRONTEND: Home
- **Files:** `(gated)/dashboard/**`
- **What:**
  - One main input, "paste a job link, or ask pip anything", routed by `intakeJob`. A job goes to the job page; a question opens chat with the text already sent.
  - A "needs you" inbox with a count badge.
  - Applications, each with one next action.
  - This week's tasks.
  - The night scene when there's an offer.
  - Skeletons, an empty state (Pip plus one action) and an error state with retry.
- **Why:** home flow and gap #3.
- **Test:** Pasting text, pasting a URL and asking a question each go to the right place.

### 9. FRONTEND: Job page with progress and one-tap actions
- **Files:** new `(gated)/jobs/[id]/**`
- **What:**
  - Editable chips for company, title and location.
  - Live progress through Checker → Tailor → Writer → Connector with Pip's outfit for each step. The page drives `runNextStep` and resumes when you return.
  - Copy, Download PDF and Open job page buttons.
  - One-tap Mark applied, "I got an interview" (only a date picker), Offer (a celebration) and Closed.
  - Undo toasts on each of these.
- **Why:** flow steps 3, 5, 6 and 7.
- **Test:** The full run reaches needs-you, and every tap is optimistic with undo.

### 10. FRONTEND: Applications board
- **Files:** new `(gated)/applications/**`, plus a sidebar link
- **What:**
  - Columns Saved, Applied, Interviewing, Offer and Closed.
  - Drag between columns, plus a tap alternative: a status menu on each card.
  - Optimistic moves that roll back on error, with Undo.
  - Works with touch at 390px.
- **Why:** gap #2.
- **Test:** Drag and tap both move cards and persist after a reload.

### 11. FRONTEND: "Needs you" review
- **Files:** new `(gated)/needs-you/**`, `TailorPanel.jsx`, `CoverLetterPreview.jsx`, `ColdEmailPreview.jsx`
- **What:**
  - One queue for everything awaiting approval.
  - Resume edits as tracked changes on the document: the source on hover, accept or reject each line, edit a line inline, and "Accept all" (saves a version, D63).
  - Letters and emails editable inline, saving on blur.
  - The tone as a chip with quick switches (shorter, more formal, warmer) and no dialogs, each with Undo.
- **Why:** gap #6, D60 and D63.
- **Test:** Approving every item empties the queue, and the main resume stays unchanged until you restore a version.

### 12. FRONTEND: UX rules pass
- **Files:** the lists and previews with confirms (FLOW-AUDIT §5), new `(gated)/settings/**`, a ⌘K menu component, per-route `loading.jsx` and `error.jsx`, `ResumeParserForm.jsx`, `CoverLetterGen.jsx`, `ColdEmailGen.jsx`, `CreateRoadmapModal.jsx`
- **What:**
  - Replace the 6 remaining confirms with 5 s Undo toasts.
  - Settings with delete all data and delete account (typed confirmation).
  - A ⌘K command menu (tools, jobs, chat), with Esc closing it and visible focus.
  - Loading, empty and error states on every page listed in FLOW-AUDIT §6.
  - Shrink the forms:
    - The ATS, cover letter and cold email generators pick an existing job (pre-filling company, title and job description), with manual entry behind "more".
    - The roadmap pre-fills from the profile.
    - The cold email recipient fields go behind "more".
  - All six tools keep working on their own.
- **Why:** the UX rules and the forms inventory.
- **Test:** No confirm dialog is left besides account and data deletion. ⌘K works. The tools work without picking a job.

---

**New env var names:** none expected.
**New migration (you apply it):** `job_application_flow`.
