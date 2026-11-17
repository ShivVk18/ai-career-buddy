# PLAN: Phase 5 (writing tools parity + retire 4 previews)

Branch `phase-5`. Decisions: D34, D35, D40–D43 in DECISIONS.md. Inputs: CONTEXT.md §11.1, §11.2, §11.5.

**Done when:**
- Every real-data feature of the cover letter and cold email previews works in `/cover-letter` and `/cold-email`, with verified sources on all AI output.
- `/tools/resume`, `/tools/ats`, `/tools/cover-letter` and `/tools/cold-email` redirect to their real routes.
- ATS results can be deleted, and stored resume text is purged after 90 days.
- `npm run build` passes, and all 6 tools still work.

Rules: never edit `.env`; migrations are SQL files only and are never applied; every query is scoped by userId; zod on every input; expected failures return `{error, code}`; sources rules D26–D28 and `inventedNumbers` apply to every generator; never auto-send (D35); no feature removed (the previews are removed only after their features are ported, D41).

**Out of scope:** interview and roadmap parity and their previews (Phase 6); removing `mock.ts` (still used by those two previews); industry insights.

---

### 1. BACKEND: Contract, shared writing rules and cover letter rewrites
- **Files:** `docs/ai/API-CONTRACT.md` (§8), new `src/lib/writing.js`, `src/actions/CoverLetter.js`
- **What:**
  - `writing.js` exports the cover letter range (one range used by both the prompt and the UI), the cold email target, a curated cliché phrase list, and `findCliches(text)`, which is deterministic with no AI.
  - The generator takes an optional `tone` enum (the preview's tones).
  - New `regenerateCoverLetter(id, {tone?, formality?})` replaces the letter in place with new paragraphs and sources (D43).
  - New `shortenCoverLetter(id)` rewrites the body paragraphs shorter, keeping each paragraph's existing source ids and passing `inventedNumbers` against the current text. It replaces in place.
  - Both are owner-scoped, both go through runAI (so the cap applies), and both return `{error, code}`.
- **Why:** D40 and D43 (CONTEXT §11.1).
- **Test:** Regenerate with a different tone replaces the same row with new sources. "Shorter" lowers the word count and keeps the sources. `findCliches` flags known phrases.

### 2. BACKEND: Cold email migration and generator
- **Files:** `prisma/schema.prisma`, new migration `cold_email_fields` (SQL only), `src/actions/ColdEmail.js`, `src/actions/Dashboard.js`
- **What:**
  - Add optional `recipientName`, `recipientRole`, `recipientEmail`, `subject` and `followUpAt` to `ColdEmail` (D34).
  - The generator accepts the recipient name and role, and the greeting uses the name. **`recipientEmail` is never sent to the model.**
  - The generator also returns a short `subject`, sourced to company, role or job-description ids and number-checked, with no open-rate claims.
  - `updateColdEmail` accepts the new fields, with zod validating the email address.
  - New `setColdEmailFollowUp(id, date|null)`.
  - `getDashboardData` adds `dueFollowUps[]` (followUpAt ≤ today, owner-scoped).
  - Nothing ever sends anything.
- **Why:** D34, D35 and D40 (CONTEXT §11.2).
- **Test:** `prisma validate` passes. A new email has a sourced subject. The recipient email never appears in the prompt (check AI_DEBUG logs in dev). A due follow-up appears in the dashboard data.

### 3. BACKEND: Deleting ATS results, purging resume text and showing years
- **Files:** `src/actions/ResumeParser.js`
- **What:**
  - `deleteATSScore` is owner-scoped and returns `{error, code}`.
  - Purge `evidence.resumeText` (setting `hasResumeText` to false) from the user's results older than 90 days. It runs opportunistically in `getUserATSScores` and `createATSAnalysis`, is bounded per call, and a failure never breaks the request (D42).
  - The ATS getters return `candidateYears` from `User.experience` (profile data, no AI).
- **Why:** D42, and the scout's MED privacy problem. This also covers ATS parity ("3 years exp").
- **Test:** Deleting removes only your own result. A result with `createdAt` older than 90 days loses its text on the next history load, and its fix returns `NEEDS_REUPLOAD`.

### 4. BACKEND: Redirects for retired previews
- **Files:** `next.config.mjs`, `scripts/capture_screenshots.js`, `scripts/capture_via_cdp.js`
- **What:**
  - Add permanent redirects: `/tools/resume`→`/resume`, `/tools/ats`→`/resume-parser`, `/tools/cover-letter`→`/cover-letter`, `/tools/cold-email`→`/cold-email`.
  - Point the capture scripts' URL lists at the real routes.
  - The middleware stays as it is, since the real routes are guarded.
- **Why:** D41.
- **Test:** Each old URL redirects to its real route once the frontend has removed the page.

### 5. FRONTEND: Cover letter parity UI
- **Files:** `(gated)/cover-letter/**` (`CoverLetterGen.jsx`, `CoverLetterPreview.jsx`, the `[id]` page)
- **What:**
  - Add a tone selector to the generator.
  - On the letter page, add Regenerate (with tone), More formal and Shorter. Each shows a confirm dialog warning that edits will be lost (D43), then refreshes the content and sources.
  - Show a live word count against the range from `writing.js`.
  - Highlight clichés from `findCliches`, with a short hint and no fake examples.
  - Handle errors via `generationError.js`.
- **Why:** D40 and D43.
- **Test:** Each action replaces the letter after the confirm. The word count and clichés update as you type.

### 6. FRONTEND: Cold email parity UI and dashboard follow-ups
- **Files:** `(gated)/cold-email/**`, `(gated)/dashboard/_component/DashboardView.jsx`
- **What:**
  - Add recipient name, role and email fields (typed by the user) to the generator and the edit view.
  - Show and edit the subject.
  - Show a live word counter against the target from `writing.js`.
  - Highlight paragraphs whose sources include `proj:` ids ("Matched project").
  - Add a follow-up date picker (`setColdEmailFollowUp`).
  - Add an **"Open in mail client"** button: explicit click only, using the typed address, subject and body. Note that long bodies may be cut, and suggest copying. It never opens automatically (D35).
  - The dashboard shows a "Follow-ups due" list linking to each email.
- **Why:** D34, D35 and D40.
- **Test:** The mailto opens only on click, with the right fields. A due follow-up shows on the dashboard. The project highlight matches the chips.

### 7. FRONTEND: ATS deletion, years and the purge note
- **Files:** `(gated)/resume-parser/**` (`AtsHistory.jsx`, `AtsResult.jsx`)
- **What:**
  - Add "Delete result" with a confirm dialog to history and to the detail view.
  - Show years of experience from `candidateYears` next to the level badge.
  - Where `hasResumeText` is false because of the purge, explain it ("Resume text is removed after 90 days; re-upload to use fixes").
- **Why:** D42 and ATS parity.
- **Test:** Delete removes the row. The years show, and the purge note appears for old results.

### 8. FRONTEND: Retire 4 previews
- **Files:** delete `src/app/(main)/(gated)/tools/{resume,ats,cover-letter,cold-email}/`; edit `tools/layout.jsx` (the banner map), `src/components/shared/AppSidebar.jsx` (the Previews group keeps only interview and roadmap), `src/app/page.js` (landing tool hrefs and footer), `(gated)/resume/page.jsx:31` (the preview link)
- **What:**
  - Remove the 4 preview pages and every link to them.
  - Keep `ResumePaperDoc.jsx` (used by the landing page) and `mock.ts` (still used by the interview and roadmap previews).
  - Check with a grep that nothing references the removed routes.
- **Why:** D41. Their features are now in the real routes.
- **Test:** The 4 old URLs redirect. The sidebar and landing links go to the real routes. The interview and roadmap previews still work with their banner.

---

**New env var names:** none.
**New migration (you apply it):** `cold_email_fields`.
