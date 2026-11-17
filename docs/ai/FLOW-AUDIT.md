# Flow audit

This audit was produced by the scout on branch `ux-flow-pass` (HEAD `6bc3423`), 2026-11-17, by reading the code only. Nothing was run in a browser. It checks the app against the intended user flow and UX rules.

The status values are MATCHES, PARTIAL and MISSING. Sizes are S, M or L. "Side" is BE (backend) or FE (frontend).

## 1. Summary

### Onboarding
| Item | Status | Note |
|---|---|---|
| Clerk sign-in with Google one-tap | PARTIAL | The default `SignIn` component; one-tap isn't configured in code |
| One screen: resume drop, optional GitHub | MISSING | |
| Parse the resume into editable chips | MISSING | |
| At most 2 quick-tap questions | MISSING | |
| Strength ring with one next action | MISSING | |
| Done goes to home | MATCHES | |

### Home
| Item | Status | Note |
|---|---|---|
| Single input: URL, job description or question | PARTIAL | Accepts a question only, which is sent to chat |
| Needs-you inbox with a badge | MISSING | |
| Applications, one next action each | PARTIAL | Targets are derived from other records and have no status |
| This week's tasks | PARTIAL | |
| Bot team status and activity feed | MISSING | |
| Scout matches | MISSING | |
| Greeting scene, dawn to night | PARTIAL | There's no night variant |

### Paste a job
| Item | Status |
|---|---|
| Auto-create a job and application with chips | MISSING |
| Live progress with Pip at each step | MISSING |
| Continues in the background and notifies | MISSING |

### Needs you
| Item | Status | Note |
|---|---|---|
| A single approval place | PARTIAL | |
| Tracked changes, hover source, Accept all | PARTIAL | The tracked-changes view exists only on the landing page sample |
| Letter and email editable inline, tone chip, quick switches | PARTIAL | |
| Nothing sent without approval | MATCHES | |

### Apply and track
| Item | Status | Note |
|---|---|---|
| Copy, PDF and open job page | PARTIAL | |
| Mark applied, or Gmail detects it | MISSING | |
| Board with drag between stages | MISSING | |
| Follow-up after 5 quiet days (max 2) | PARTIAL | The follow-up date is set by hand only |

### Interview
| Item | Status | Note |
|---|---|---|
| Invite detected, or "I got an interview" plus a date | MISSING | |
| A prep pack appears | PARTIAL | |
| One question at a time, voice or typing, timer | MATCHES | |
| Rubric score with quoted reasons | MATCHES | |
| Weak areas saved automatically | PARTIAL | Computed on each request, not stored |

### Result
| Item | Status |
|---|---|
| Offer celebration and offer helper | MISSING |
| Rejection: one-tap "closed", gaps become tasks | MISSING |

### Loops
| Item | Status |
|---|---|
| Each new job reuses the profile | PARTIAL |
| Monday plan from real gaps | PARTIAL |
| Checking a task adds proof | MISSING |
| Daily digest | MISSING |

### Shortcuts
| Item | Status | Note |
|---|---|---|
| Six tools in the sidebar, each standalone | MATCHES | |
| Chat slide-over from anywhere | PARTIAL | Not on the landing page, and there's no keyboard shortcut |
| Interactive tool cards | PARTIAL | The cards are read-only links (D19) |

### UX rules
| Rule | Status | Note |
|---|---|---|
| Never ask for anything extractable or inferable | MISSING | Broken in 5 forms |
| Input preference ladder | PARTIAL | There's no editable chip component |
| Edit in place, save on blur or Enter | PARTIAL | Nothing saves on blur or Enter |
| Smart defaults | PARTIAL | |
| Undo toast for 5 s instead of a confirm dialog | PARTIAL | Undo exists only on the roadmap; there are 7 confirm dialogs |
| Optimistic UI with rollback | PARTIAL | |
| Feedback within 100 ms | PARTIAL | |
| Loading, empty and error states on every page | PARTIAL | See §6 |
| Keyboard: ⌘K, Enter, Esc, visible focus | PARTIAL | There's no ⌘K menu |
| Mobile at 390px, with a tap alternative to drag | PARTIAL | Not checked in a browser |
| Progressive disclosure | PARTIAL | |

## 2. Top 10 gaps by user impact

| # | Gap | Size | Side |
|---|---|---|---|
| 1 | Pasting a job description or URL creates a job and an application, with editable chips for company, title and location | L | BE+FE |
| 2 | An application model and board (Saved, Applied, Interviewing, Offer, Closed), with "Mark applied" and a tap alternative to drag | L | BE+FE |
| 3 | A needs-you queue with a count badge, bringing together tailoring, the ATS fix, letters and emails | M | FE+BE |
| 4 | Onboarding takes a resume and parses it into chips (roles, projects, skills, years), replacing the profile form | L | BE+FE |
| 5 | A background pipeline (Checker, Tailor, Writer, Connector) with step progress and a notification. Needs a job runner | L | BE |
| 6 | Tracked changes on the real resume: source on hover, accept or reject each line, inline edit, and Accept all saved as a version | M | FE |
| 7 | Onboarding cut to 2 quick-tap questions (target role, stage), plus a strength ring with one next action | M | FE+BE |
| 8 | "I got an interview" plus a date, an automatic prep pack, and follow-up drafts after 5 quiet days | M | BE+FE |
| 9 | Results: an offer helper, a one-tap "closed" for rejections, and gaps turned into next week's tasks | M | BE+FE |
| 10 | A way to delete your account and all data. `deleteResume` (`Resume.js:315`) has no UI, and no action deletes the account | S-M | BE+FE |

The scout also found a HIGH security issue: `seedResumeTemplates` (`src/actions/Resume.js:377`) is an exported server action with no `auth()` check, and it writes global `ResumeTemplate` rows.

## 3. Forms inventory

There are 18 form surfaces with 54 fields in total (EntryForm is counted once, though it repeats for every resume entry). About 22 of the fields are required. The job description textarea appears in six places: ATS, cover letter, cold email, tailoring, practice and the match card.

| Form | File | Fields (required) | How to shrink it |
|---|---|---|---|
| ATS scan | `ResumeParserForm.jsx:187-243` (`schema.js:68-80`) | 4 (4): company, title, JD, PDF | Extract company and title from the JD; reuse the stored resume instead of re-uploading |
| Onboarding | `OnboardingForm.jsx:102-226` | 5 (3) | Replace with a resume drop, parsed chips and 2 tap questions |
| Cold email generator | `ColdEmailGen.jsx:90-172` | 6 (3) | Pick an existing job; put the recipient fields behind "more" |
| Roadmap modal | `CreateRoadmapModal.jsx:82-155` | 4 (3) | Infer the current and target role from the profile |
| Cover letter generator | `CoverLetterGen.jsx:92-160` | 4 (3) | Pick an existing job; the tone is a chip |
| Resume entry | `EntryForm.jsx:188-305` | 6 per entry (4) | Fill from the parsed resume; edit inline |
| Other | Practice setup, match card, tailoring, versions dialog and so on | Small | Pre-fill from the selected job |

## 4. Audit by item (evidence)

### Onboarding
- **Google one-tap:** PARTIAL. `src/app/(auth)/sign-in/[[...sign-in]]/page.jsx:1-4`. Needs Clerk dashboard config. S, FE. Google OAuth asks for basic profile scope only.
- **Resume drop and GitHub:** MISSING. Onboarding is a profile form (`OnboardingForm.jsx:102`). Upload exists only in `ResumeParserForm.jsx:225-243`. M, FE+BE. Resume text retention (D42) and the GitHub scopes apply.
- **Parsed chips:** MISSING. The PDF's text is used only for scoring (`src/lib/ai/pdf.js`, `ResumeParser.js:85`). Nothing writes to `Resume` or `User`. L, BE+FE. Each extracted item needs a source (D26); parse in memory.
- **Two tap questions:** MISSING. Onboarding asks for industry and specialization (`OnboardingForm.jsx:108-160`). There's no target role or stage field. M, BE+FE.
- **Strength ring:** MISSING. M, FE.
- **Done goes home:** MATCHES. `OnboardingForm.jsx:74-77`; gate at `(gated)/layout.jsx:9-11`; `User.js:94`.

### Home
- **Main input:** PARTIAL. `DashboardView.jsx:174-192`, sent to chat at `:138-141`. Needs an intake router and job creation. Fetching URLs would need SSRF protection and a terms-of-service review. Conflicts with D19.
- **Needs-you inbox:** MISSING. Only follow-ups exist (`Dashboard.js:62-82`, `DashboardView.jsx:323`). M.
- **Applications:** PARTIAL. The derived "targets & pipeline" (`DashboardView.jsx:248-322`, D18). L.
- **This week's tasks:** PARTIAL. Roadmap `nextTasks` (`DashboardView.jsx:366-420`). S.
- **Bot status:** MISSING. Needs a job runner. L.
- **Activity feed:** MISSING. Needs an event table (ids only). M.
- **Scout matches:** MISSING. Needs a third-party job API and consent. L.
- **Greeting scene:** PARTIAL. The scene is chosen at `DashboardView.jsx:52-68`. A night palette exists (`PixelScene.jsx:23-37`) but is never selected. S.

### Paste a job and bots
- **Auto-create:** MISSING. Company and title are required (`ResumeParserForm.jsx:187-205`, `schema.js:68-71`), and there's no extraction. L. Each extracted field needs a JD line as its source.
- **Live progress:** MISSING. Each action only has a spinner. `PipStatus` appears only on the dashboard. L.
- **Background work:** MISSING. AI runs inside the request (90 s timeout in `src/lib/ai/index.js`). L. Notifications must hold ids only.

### Needs you
- **Single place:** PARTIAL. Approvals live in separate places: `TailorPanel.jsx:144-176`, `AtsResult.jsx:199-224`, `CoverLetterPreview.jsx` and `ColdEmailPreview.jsx`. M.
- **Tracked changes:** PARTIAL. Tailoring shows an accept/strike list (`TailorPanel.jsx:158-164`). Source chips are always visible, not on hover. The tracked-changes document exists only as the landing sample (`ResumePaperDoc.jsx:62-88`). M. "Accept all" must not edit the main resume (D36).
- **Inline letter and email:** PARTIAL. The letter uses MDEditor with a Save button (`CoverLetterPreview.jsx:57-63`), and the tone switches open a confirm dialog (`:37-41, 231-241`). There's no "warmer" switch. M. Conflicts with D43.
- **No send without approval:** MATCHES. `ColdEmailPreview.jsx:109-120, 293`.

### Apply and track
- **Copy, PDF, job page:** PARTIAL. Letters and emails can be copied or downloaded as TXT; only the resume has a PDF (`ResumeBuilder.jsx:368-387`). There's no job URL field. S to M.
- **Mark applied, Gmail:** MISSING. There's no application status. `ColdEmail.status` exists but nothing uses it. L. Gmail read access is a restricted scope.
- **Board:** MISSING. L. Needs a tap alternative to drag.
- **Follow-up after 5 quiet days:** PARTIAL. The date is set by hand (`ColdEmailPreview.jsx:48-60`, `ColdEmail.js:343`), with a due list on the dashboard (`Dashboard.js:62-82`). M. The follow-up draft must not send (D35).

### Interview
- **Invite or "I got an interview":** MISSING. S by hand, L with Gmail.
- **Prep pack:** PARTIAL. The practice setup (`practice/page.jsx:173-200`) and `generateOpenQuestions` (`Practice.js:96`) aren't tied to an application. M.
- **Practice:** MATCHES. `practice/page.jsx:24-41, 107`; browser-only speech (D46). Firefox needs a typed-only message.
- **Rubric:** MATCHES. `Practice.js:304`, `verify.js:13`.
- **Weak areas:** PARTIAL. Computed on each request (`Practice.js:419`), not stored. S.

### Result
- **Offer:** MISSING. S for the celebration, M for the helper. Offer figures must be sourced.
- **Rejection:** MISSING. The gap logic exists (`derive.js`, `CareerRoadmap.js:456`). M.

### Loops and shortcuts
- **Reuse the profile:** PARTIAL. Letters and emails already read `db.resume` (`CoverLetter.js:121`, `ColdEmail.js:94`).
- **Monday plan:** PARTIAL. There's no scheduler.
- **Proof upload:** MISSING. There's no file storage and no retention rule.
- **Digest:** MISSING. There's no email provider (`resend` was removed in Phase 7).
- **Six tools:** MATCHES. `AppSidebar.jsx:41-46`.
- **Chat slide-over:** PARTIAL. Mounted in the app shell (`AppSidebar.jsx:277`), but there's no shortcut.
- **Tool cards:** PARTIAL. Read-only links (`ToolResultCard.jsx:34-48`, D19).

### UX rules
- **Extractable fields:** `ResumeParserForm.jsx:187-216`, `CoverLetterGen.jsx:96-135`, `ColdEmailGen.jsx:94-172`, `CreateRoadmapModal.jsx:85-155`, `OnboardingForm.jsx:104-188`.
- **Edit in place:** nothing saves on blur or Enter. Small edits open dialogs (`CreateRoadmapModal.jsx:56`, `VersionsPanel.jsx:80`).
- **Undo:** only on the roadmap (`RoadmapDetailView.jsx:83`), with Sonner's default duration rather than 5 s.
- **Keyboard:** there's no ⌘K menu. Esc works through the Radix dialogs. Visible focus wasn't audited.
- **Mobile:** a bottom bar (`AppSidebar.jsx:228`). Not checked at 390px.
- **Progressive disclosure:** the cold email recipient block is optional (`ColdEmailGen.jsx:131-155`). Onboarding shows every field at once.

## 5. Confirm dialogs (all AlertDialog)

1. Delete ATS result: `resume-parser/_components/DeleteAtsButton.jsx:49-64`
2. Delete cold email: `cold-email/_components/ColdEmailList.jsx:155-185`
3. Delete cover letter: `cover-letter/_components/CoverLetterList.jsx:160-186`
4. Regenerate letter: `cover-letter/_components/CoverLetterPreview.jsx:37-41, 231-241`
5. Make the letter more formal: the same file
6. Shorten the letter: the same file
7. Restore resume version: `resume/_components/VersionsPanel.jsx:80, 136`

Deleting a resume entry (`EntryForm.jsx:88-91`) has no confirm and no undo. There's no way in the UI to delete your account or all your data.

## 6. Pages missing their own loading, empty or error state

- `/chat`: no loading or empty state.
- `/onboarding`: no page-level empty or error state; errors are toasts only.
- `/resume`: no empty state (an empty builder is shown) and no error state.
- `/resume-parser`: no page-level empty or error state (the history list has its own).
- `/cover-letter`, `/cover-letter/new`, `/cold-email`, `/cold-email/new`: no page-level states (the lists have empty-state copy).
- `/cover-letter/[id]`: no error state.
- `/roadmap/[id]`: no empty or error state.
- `/dashboard`: an error shows a banner with no retry, then the empty state, which reads as "no targets".
- `/interview/practice/[sessionId]`: no empty state.
- Only the global `(main)/loading.jsx` and `(main)/error.jsx` exist. No feature folder has its own `loading.jsx`.

## 7. Conflicts with DECISIONS.md and how the app works today

| Decision | Conflict | Scout's recommendation |
|---|---|---|
| D18: targets are derived, with no job model | The flow needs jobs, applications, statuses and tasks | Replace D18 with Job and Application models; keep the derived view for older data |
| D19: chat is read-only | The home input creates records | Keep chat read-only; use a separate intake action |
| D35: never send | Gmail read access and a digest email | Nothing sends in v1. Gmail would be read-only and opt-in, storing ids and labels only. Digest off |
| D34: the recipient's email is only typed by the user | The Connector step could fill it in | Keep D34 |
| D36: accept each edit; the main resume is untouched | "Accept all" reads as editing the resume | "Accept all" saves a version |
| D43: confirm before regenerating | The flow wants undo toasts | Save the current letter as a version first, then show an undo toast |
| D50: the limit counts one per action | A pipeline run is several actions | Give the whole run one action id |
| No job runner | The pipeline, the Monday plan, follow-ups and the digest | Vercel Cron plus checks when a page loads; Inngest or Vercel Workflow for the pipeline |
| D42: resume text kept for 90 days | Onboarding parsing and proof uploads | Parse in memory; store only sourced chips; give proof files their own retention rule |
| D46: voice is browser-only | Matches the flow | Add a typed-only message for Firefox |
| D1: `/api/chat` is guarded | The middleware doesn't list it; the route checks `auth()` itself (`route.js:27`) | Low priority: add it to the list |
| Onboarding is complete when `industry` is set (`User.js:94`) | The new onboarding ends with a resume and 2 chips | Change the check to "has a resume or answered the 2 questions"; existing users aren't affected |

## 8. Data model gaps

- **Job:** userId, source, url, jdText, company, title, location, sourceIds. Needs a migration, a retention rule for job descriptions, and SSRF protection if URLs are fetched.
- **Application:** userId, jobId, status (SAVED / APPLIED / INTERVIEWING / OFFER / CLOSED), appliedAt, interviewAt, nextActionAt, followUpCount, closedReason. Needs a migration.
- **Approval / needs-you:** userId, kind, status, ref ids, dueAt.
- **Pipeline run and steps:** step, status, attempts, errorCode. Needs a job runner and one limit action per run.
- **Notification and ActivityEvent:** ids only, plus readAt.
- **Profile:** targetRole, jobSearchStage, and sourced chips.
- **Gmail and GitHub connections:** encrypted tokens and scopes. Gmail's read scope is restricted and needs Google verification.
- **Proof uploads:** needs file storage and a retention rule.
- **Scout:** a third-party job API and consent.
- **Digest:** an opt-in, plus an email provider.
- **Delete everything:** a plan for deleting every child row first. `InterviewAnswer` is RESTRICT, so answers have to be deleted before the user.
