# Review: UX flow pass (branch `ux-flow-pass`, `git diff d2dbf7f..HEAD`, 7 commits, 117 files)

Phase 8 review (D54, industry insights removal): see `git show 6bc3423:docs/ai/REVIEW.md`.

Summary (original round): FAIL, 3 must-fix (all RESOLVED in fix round 1, see the last section). lint 0 errors (1 pre-existing font warning in `src/app/layout.js:22`), build OK, `npm test` 194/194 (24 files), `node scripts/selfcheck-matching.mjs` "all self-checks passed". No DB commands run, `.env` not read.

## MUST-FIX (all 3 RESOLVED in fix round 1)

| # | Owner | File:line | Problem | Fix |
|---|-------|-----------|---------|-----|
| 1 | BACKEND | `src/lib/jobs/fetch.js:181` (also the test gap in `src/lib/jobs/__tests__/fetch.test.js`) | The pinned `lookup: (_h,_o,cb) => cb(null, ip, family)` ignores `opts.all`. On Node 20+ (`autoSelectFamily` is on by default) `net.connect` calls lookup with `{all:true}` and needs an array. I reproduced this on Node 26: `ERR_INVALID_IP_ADDRESS: Invalid IP address: undefined`. Every real URL fetch therefore fails with `FETCH_FAILED` (error mapped from `network`). The home input's job link path never works in production. The tests pass only because they mock `request`. | `lookup: (_h, o, cb) => (o && o.all ? cb(null, [{ address: ip, family }]) : cb(null, ip, family))` (I confirmed this form returns 200). Add one test that runs `httpsRequest` against a local TLS server with an injected `lookup`. |
| 2 | BACKEND | `src/lib/jobs/common.js:49` (`APPLICATION_SELECT`), `publicJob` (`:35`), `src/lib/applications/derive.js:65` (`publicApplication`/`nextAction`) | The prep session created by "I got an interview" (`Application.prepSessionId`) is never exposed to the client. The board card and home card point to generic `/interview`, and the `PREP_INTERVIEW` needs-you item disappears once the session exists. `getPracticeHistory` excludes sessions with no scored answer. So after step "date -> prep session" nothing leads to the session. | Add `prepSessionId` to `APPLICATION_SELECT`, `publicJob.application`, `outApplication` and `publicApplication`. Make `nextAction` return `href: /interview/practice?session=<id>` (see #3). Update the contract §11. |
| 3 | FRONTEND | `src/app/(main)/(gated)/jobs/[id]/_components/StatusActions.jsx:157-165`, `src/app/(main)/(gated)/interview/practice/page.jsx:53,107`, `src/app/(main)/(gated)/interview/practice/[sessionId]/page.jsx:60-76`, `src/app/(main)/(gated)/needs-you/_components/NeedsYouQueue.jsx:284` | Practice step is not wired. `/interview/practice` only creates a NEW session from a pasted JD (spends a cap action). `/interview/practice/[sessionId]` is a read-only review that prints "Not answered." The needs-you toast "Practice" and the success toast on the job page (no link at all) both lead to that read-only page. A user cannot answer the prepared questions. | Let `/interview/practice` accept `?session=<id>`: call `getOpenSession(id)`, set `session`, and go straight to the answer UI (`scoreOpenAnswer(sessionId, index, text)` already works by id). Show "Practice for this interview" on the job page (when `application.prepSessionId` is set), in the INTERVIEWING card, and in the toast. Point the review page's unanswered items to it. |

## NICE-TO-HAVE (13)

| # | Owner | File:line | Note | Fix |
|---|-------|-----------|------|-----|
| 1 [RESOLVED] | BACKEND | `src/actions/Resume.js:376` | Comment points to `scripts/seed-resume-templates.mjs`, which does not exist. Seeding is `seeder/seedTemplates.js` / `seeder/seed.js`. | Fix the comment (or add the script). |
| 2 [RESOLVED] | BACKEND | `src/actions/ResumeParser.js:271` | Soft-deleting an ATS result keeps `evidence.resumeText` (a full resume) for up to 7 days, and the prune only runs when `getApplications`/dashboard load. D42's "Delete result" promised removal. | Strip `evidence.resumeText` in the same update as `deletedAt` (restore then needs a re-upload for the fix), or note it in the UI. |
| 3 [RESOLVED] | BACKEND | `src/lib/applications/derive.js:67` and `Applications.js:141-163` | A board move to INTERVIEWING has no date, so the card says "Add the result" and there is no date prompt on the board. Undoing an interview leaves `interviewAt` set. | Label "Add interview date" (link to job page) when `interviewAt` is null; clear `interviewAt` when undoing to SAVED/APPLIED. |
| 4 | BACKEND | `Applications.js:405` (`addGapTasks`) | Undo of Closed does not remove the roadmap tasks (documented in the toast). | Accept, or store task ids and remove them on undo. |
| 5 [PARTLY (PDF kept for the session, roadmap chips done; no saved-resume reuse)] | FRONTEND | `src/app/(main)/(gated)/resume-parser/_components/ResumeParserForm.jsx` | With a job picked the ATS form still needs a PDF re-upload (FLOW-AUDIT §3 suggested reusing the stored resume). Roadmap modal still shows 4 fields, only pre-filled. | Offer "use my saved resume" in the ATS form (pipeline Checker already scores `resumeToText`). |
| 6 [RESOLVED] | FRONTEND | `PipelineProgress.jsx:152` | Links to `/dashboard#needs-you` rather than `/needs-you`. | Link `/needs-you`. |
| 7 [RESOLVED] | BACKEND | `src/lib/onboarding/chips.js:86-89` | `suggestedIndustry` is checked only for an existing quote, not that the value appears in it. It is editable and labelled inferred (D59), so low risk. | Require a word of the value in the quote, or leave as is. |
| 8 [RESOLVED] | BACKEND | `src/lib/jobs/meta.js:28-30` | Word check is order-insensitive (a set of tokens), so a rearranged value could pass. | Also require the normalised value to be a contiguous substring of one cited line. |
| 9 | BACKEND | `src/lib/softDelete.js:16` | Lazy prune runs only from `getApplications`/dashboard. | Also call it from `deleteAllMyData`-free paths such as list pages, or accept. |
| 10 | FRONTEND | `OnboardingFlow.jsx:174-180` | If the version backup succeeds but the replace-save then fails, an extra "Before profile edit" version stays. Harmless. | None needed. |
| 11 | BACKEND | `src/actions/Resume.js` (`deleteResume`) and `CareerRoadmap.js` (`deleteCareerRoadmap`) | Still hard deletes (pre-existing, outside D60 scope). | Soft delete in a later pass. |
| 12 | BACKEND | `src/lib/ats/score.js:232` via `Pipeline.js:88` | The pipeline Checker stores the builder's `resumeText` in `ATSScore.evidence`, covered by the D42 90-day purge only. Not parsed-PDF text. | Fine; mention in DEPLOY/privacy copy. |
| 13 | FRONTEND | `src/app/layout.js:22` | Pre-existing font warning. | Move the font to `next/font`. |

## (A) Forms removed or reduced (FLOW-AUDIT §3)

| Form | Before (fields / required) | After: default visible | Result |
|---|---|---|---|
| ATS scan | 4 / 4 (company, title, JD, PDF) | Job picker + PDF. Company/title/JD hidden behind "enter details manually" (opens by itself with no jobs or on errors) | Reduced; PDF still required (nice #5) |
| Onboarding | 5 / 3 (`OnboardingForm`, deleted) | Drop zone, then chips (click to edit, x, +), then 2 tap questions, then ring. Only inputs: a hidden file input and one-chip inline editors | Removed. No multi-field form (`OnboardingFlow.jsx`) |
| Cold email | 6 / 3 | Job picker. Manual company/title/JD hidden; recipient name/role/email behind "more" | Reduced |
| Roadmap modal | 4 / 3 | Same 4 fields, pre-filled from `getProfileChips` ("Filled in from your profile") | Pre-filled only (matches the plan) |
| Cover letter | 4 / 3 | Job picker + tone chips. Manual fields hidden | Reduced |
| Resume entry (`EntryForm`) | 6 per entry / 4 | Unchanged form, but entries are filled from parsed chips and edited inline in onboarding | Partly (builder form is the editor of record) |
| Other (practice setup, match card, tailoring, versions) | small | Tailoring and letters open from needs-you with no form. Practice setup and match card unchanged | Mostly unchanged |

## (B) Flow steps and route paths

| Step | Route path (all hit) | Status |
|---|---|---|
| Onboarding | `/onboarding` drop PDF -> `parseResumeToProfile` -> chips (`EditableChips`) -> `saveProfileChips` -> 2 taps -> `saveOnboardingAnswers` -> ring (`getProfileStrength`) -> `/dashboard`. Gate: `(gated)/layout.jsx` + `getUserOnboardingStatus` (D59 rule) | OK. "No resume" path via manual chips |
| Home: job text | `/dashboard` input -> `intakeJob` -> `{kind:"job"}` -> `/jobs/[id]` | OK |
| Home: URL | same -> `fetchPublicPage` | OK (pinnedLookup handles `{all:true}`; local TLS tests). Fallback `PASTE_NEEDED`/`URL_BLOCKED` UI and saved-URL-on-paste work |
| Home: question | `intakeJob` -> `{kind:"question"}` -> chat opens with text | OK (D62; no records created) |
| Job page pipeline | `/jobs/[id]` -> `getJob` + `getPipeline` -> `drive()` loops `runNextStep` (Checker, Tailor, Writer, Connector), resumes on return, Retry on failure | OK |
| Needs you | `/needs-you` -> `getNeedsYou` -> `TailorReview` (`getTailorDraft`, tracked changes, inline edit, Accept all -> `saveTailoredVersion`, version only per D63), `LetterReview` (inline save on blur, shorter / more formal / warmer, 5 s Undo via `undoLetterChange`), approve + Undo (`approveNeedsYou`/`unapproveNeedsYou`) | OK |
| Apply and track | Job page: Copy job text / letter, Letter PDF, Resume PDF (`/resume`), Open job page (`rel=noopener`); Mark applied (`markApplied`); `/applications` board with drag and a per-card "Move to" menu (44 px target); follow-up item -> `createFollowUpDraft` (no AI, no recipient) | OK |
| Interview | Job page "I got an interview" -> date -> `setInterviewDate` (creates prep session, `prepSessionId` exposed) -> toast "Practice" or button "Practice for this interview" -> `/interview/practice?session=id` (`getOpenSession`, resumes at first unscored question) -> `scoreOpenAnswer` -> review page "Continue practising". Board move to Interviewing: date prompt (no prep created); card nextAction "Prepare for your interview" -> job page "Prepare practice questions" (`createInterviewPrep`) or needs-you "Prepare questions". Needs-you item switches to "Practice for this interview" once a session exists and stays until one answer is scored | OK |
| Result | Job page Offer (celebration card), dashboard night scene (`hasOffer`); Closed -> `closeApplication` -> gap tasks (`gapTasksAddedAt` once) toast shows count | OK. Offer celebration is only on the job page and home, not on the board (acceptable) |
| Deferred (D58) | Gmail, GitHub, Scout, daily digest, away notifications, Monday plans, proof uploads, offer negotiation draft | Not present, as planned |

## (C) Six tools standalone, no job needed

| Tool | Route | Standalone check |
|---|---|---|
| Resume builder | `/resume` | No job dependency; `loading`/`error` added. OK |
| Interview prep | `/interview`, `/interview/practice`, `/interview/mock` | Setup takes pasted JD; works with no job. (Prepared-session resume is must-fix #3) |
| Cover letter | `/cover-letter/new` | `JobStart`: `jobs===[]` or load failure or `hasErrors` sets `showManual`, so the manual fields show at once. Form schema unchanged. OK |
| Cold email | `/cold-email/new` | Same; recipient behind "more" (typed only, D34). OK |
| Roadmap | `/roadmap` modal | Pre-fill is optional and swallows errors; works empty. OK |
| Resume parser / ATS | `/resume-parser` | Same `JobStart` and manual fields; `jobId` optional and owner-checked (`ResumeParser.js:133`). OK |

## (D) Security and privacy

- URL guard (`fetch.js`): https and 443 only, no credentials, hostname/TLD block list, IPv4 ranges (RFC1918, CGNAT, loopback, link-local/metadata, multicast, reserved), IPv6 (loopback, mapped, NAT64, ULA, link-local, 6to4, Teredo, documentation) all checked; DNS resolved by us, ALL records vetted, connection pinned to the vetted IP plus a remote-address recheck, redirects handled by hand (max 3, each hop re-checked), 5 s deadline, 2 MB streamed cap, text/html only, `Accept-Encoding: identity`, no cookies. Logic is sound; the pinning callback is broken at runtime (must-fix #1). Stored `url` from a paste is `https` only (zod refine) and is never fetched.
- Seed action removed: no `seedResumeTemplates` in `src`; seeding is script-only (`seeder/`). OK.
- Middleware: `/jobs`, `/applications`, `/needs-you`, `/settings`, `/api/chat` added. OK.
- Every new action calls `requireUser()`/`auth()` (signed-out throws), is zod-validated, and every query by id carries `userId` (`Applications`, `Jobs`, `Pipeline`, `Onboarding`, `Account`). Optional `jobId` on letters, emails, ATS and tailoring is owner-checked before any AI call.
- `deleteAllMyData`/`deleteAccount`: typed phrases checked server-side; one `$transaction` array in dependency order (InterviewAnswer first, then every user-owned model; I compared against all `userId` models in the schema, none missing); scoped to the caller's id; recent AiUsage kept so the cap can't be reset; Clerk deletion only after the DB commit, and a retry after `CLERK_FAILED` skips the DB step. OK.
- Soft delete: grep of every `db.coverLetter|coldEmail|aTSScore|job` read, update and delete across `src` shows `deletedAt: null` on all readers (letters, emails, ATS, dashboard, chat context, roadmap gaps, needs-you, pipeline adopt checks). Restores are bounded to 7 days. OK.
- Resume text: `parseResumeToProfile` extracts in memory and returns chips only; `saveProfileChips` stores only labels/details. Not persisted. (Existing ATS flow keeps `evidence.resumeText` under D42; see nice #2, #12.)
- D34/D35: pipeline and follow-up pass no recipient; follow-up is a template, no AI; nothing is sent anywhere.

## (E) Trust

- Job chips: `chipsFromHeader`/`verifyJobField` need cited `jd:` ids that exist and every word and number present in them; unverified values are null. User edits are marked `origin: "user"` with empty sources.
- Resume chips: `verifyChips` needs the label as a whole word, a verbatim quote containing it, details also in the text, years only when written. Unverified items dropped.
- Pipeline: one `runNextStep` call runs one step, claimed by compare-and-swap, stale claim (3 min) takeover, finished steps never rerun, outputs adopted if already linked. One shared `actionId` (D50), cap checked once.
- Tailored versions: user-edited lines stored with `userEdited: true`, `sources: []`, still pass `inventedNumbers` against original and JD; re-verified against the current resume; main resume untouched (D63).
- Letters: shorten/formal/warmer keep `sources.previous`; numbers rechecked; Undo is one level.

## (F) UX rules

- No `AlertDialog` or `confirm()` outside `src/components/ui/alert-dialog.jsx` (unused). The only dialogs are the typed-phrase data/account deletes in `SettingsView.jsx`.
- Undo toasts all use `duration: 5000` (`undoDelete.js`, StatusActions, board, needs-you, letters, versions, onboarding, JobView). The older roadmap checkbox toast (`RoadmapDetailView.jsx:83`) still uses Sonner's default (about 4 s); not a confirm, so left.
- Optimistic flows roll back: board `move`, `StatusActions.apply`, `saveField`, needs-you `removeOptimistic`, `deleteWithUndo`.
- Cmd/Ctrl+K opens `CommandMenu` (Radix dialog, so Esc closes it); combobox/listbox ARIA; mounted in `AppSidebar`.
- Loading/error boundaries now exist for every §6 page (`chat`, `onboarding`, `resume`, `resume-parser`, `cover-letter`, `cold-email`, `roadmap/[id]`, `dashboard`, `practice/[sessionId]`, plus new routes); children inherit parents' `error.jsx`. Empty states present on board, needs-you, dashboard.
- Touch alternative to drag: per-card "Move to" menu with 44 px trigger, snap-scrolling columns at 390 px, `aria-live` announcement.
- Focus: `focus-visible:ring` on the new controls I read.

## Replace-mode save and Undo ordering (`OnboardingFlow.jsx:170-225`, `Onboarding.js:132`)

Safe. `saveResumeVersion({label:"Before profile edit"})` runs first; any failure other than `NOT_FOUND` (no resume yet, nothing to lose) sets an error and returns before `saveProfileChips` runs, so no entry is removed. Legacy entries get deterministic ids (`legacyEntryId`), so chip ids match on replace. Undo restores the version first, then re-saves the original chips with their ids; if either fails the user is told the earlier version is in resume versions. Residual risk: skills removed by replace are only recovered by the second save (they are not in a version).


## Fix round 1 (re-review, `git diff 4d33aba..HEAD`)

Result: PASS, 0 must-fix. lint 0 errors (same pre-existing font warning), build OK, `npm test` 198/198 (24 files), `node scripts/selfcheck-matching.mjs` all passed. No DB commands, `.env` not read.

- MUST-FIX 1 resolved: `pinnedLookup` (`src/lib/jobs/fetch.js:171`) handles `(host, cb)`, `(host, opts, cb)` and `{all:true}`. New tests run `httpsRequest` against a local openssl-signed TLS server on 127.0.0.1 (no external network), skip via `it.runIf(hasOpenssl)`, and a second test proves the remoteAddress guard still rejects. The `tls`/`isBlocked` options are test-only and `fetchPublicPage` never passes them. SSRF checks (URL, DNS vetting, redirects, caps) unchanged.
- MUST-FIX 2 resolved: `prepSessionId` in `APPLICATION_SELECT`, `publicJob`, `outApplication`, `publicApplication`; nextAction href `/interview/practice?session=<id>`; PREP_INTERVIEW item stays until a scored `InterviewAnswer` exists (query scoped by `userId`). Contract 11.9 matches.
- MUST-FIX 3 resolved: practice page loads `?session=` through `getOpenSession` (owner-checked), restores scored answers, starts at first unscored question, and has loading and not-found/error states. Review page shows "Continue practising". Job page, toast (8 s with Undo) and needs-you link to it.
- Board move to INTERVIEWING does NOT create a prep session (`setApplicationStatus` never calls prep). Not a must-fix: the card shows an optional date prompt, then nextAction "Prepare for your interview" (job page "Prepare practice questions" button) and a PREP_INTERVIEW needs-you item with a one-tap "Prepare questions". Nice-to-have only: the board date prompt could offer prep in the same step.
- Undo restores `previousInterviewAt` (null clears) on job page and board; board date prompt added (Skip, Esc).

New nit/should-fix (none blocking):
| Severity | File:line | Problem | Fix |
|---|---|---|---|
| nit | `src/actions/Applications.js:176` | Undo of an interview move leaves `prepSessionId` linked (harmless; reused on next date). Board date toast has no Practice action when no session exists. | Accept, or create prep when the board saves a date. |
| nit | `ResumeParserForm.jsx:127` | PDF is kept only in memory for the session; no "use my saved resume". | Later. |
| nit | `src/lib/jobs/fetch.js:167` | Doc comment for `httpsRequest` is now split by the `pinnedLookup` block. | Move the comment. |

## Final fixes (57dbec1 + frontend commit, afac29c..HEAD)

Summary: lint 0 errors/0 warnings, build pass, npm test 213/213, selfcheck-matching pass, prisma validate pass. No must-fix.

Verified: migration SQL (Resume.deletedAt, CareerPath.deletedAt, CareerPath index) matches schema.prisma, edited in place and unapplied. Every db.resume / db.careerPath reader filters deletedAt: null (loadOwner, getResume, duplicate, ColdEmail, CoverLetter, Pipeline, Onboarding, ResumeParser, strength, Dashboard, chatContext, roadmap reads/updates); Account deletion and prune intentionally unfiltered; prune deletes resumeVersion before resume, owner-scoped, 7-day cutoff. saveResume and saveProfileChips reset all fields of a reused deleted row. restoreDeletedResume is owner-scoped, 7-day limit, CONFLICT when a live resume exists. ATS useSavedResume reads the owner's live resume, NO_RESUME precedes any AI call, PDF path unchanged. Board prep helper runs inside withAiAction, status/date saved before prep, prep failures caught, undo unaffected.

| Severity | File:line | Problem | Fix |
|---|---|---|---|
| should-fix | src/app/(main)/(gated)/resume/_components/ResumeBuilder.jsx (handleDeleteResume; resumeDeleted state) | deleteWithUndo only calls show() on rollback or Undo, so after a committed delete resumeDeleted stays true: Save and autosave stay disabled and the old form content is still shown until a full reload, so a user starting a new resume cannot save. | After the undo window (or on done("deleted")) reset the form and set resumeDeleted false (or key the builder on initialResume so router.refresh remounts it). |
| nit | src/actions/Resume.js:~460 | The "Deleted resume" snapshot version stays in the version list of a live replacement resume (documented, restorable=kind version). | Fine; optionally label or hide. |
| nit | src/app/layout.js | Newsreader/Pixelify use variable weights (wider range than 400-600/400-700); visual impact negligible. Font stacks keep the original names as fallbacks. | None. |
