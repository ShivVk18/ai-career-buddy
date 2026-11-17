# PLAN: Phase 4 (Resume + ATS parity)

Branch `phase-4`. Decisions: D32–D38 in DECISIONS.md. Inputs: CONTEXT.md §11.1–11.2 and §11.7.

**Done when:**
- Every Resume and ATS preview feature that has a real-data equivalent works in `/resume` and `/resume-parser`: tailoring with accept/strike, computed match %, versions, the requirement checklist, candidate level, the weights panel, score history, re-run, and the 1-click fix with a real re-score.
- Every AI output carries verified sources, and nothing is applied without the user's click.
- Cover letter and cold email edits persist.
- The daily cap fails closed in production.
- `npm run build` passes, and all 6 tools still work.

Rules: never edit `.env`; no migration is expected (if one becomes necessary, write SQL only and stop to report); every query is scoped by userId; zod on every input; expected failures return `{error, code}`; sources rules D26–D28 and the number check apply to every new generator; no feature removed.

**Out of scope:** the fake-only preview items (telemetry footnotes, the invented +7 delta); `/tools/*` retirement; parity for cover letter, cold email, interview and roadmap (D34/D35 are recorded for later); industry insights.

---

### 1. BACKEND: Contract, cap fail-closed and saving edits
- **Files:** `docs/ai/API-CONTRACT.md`, `src/lib/ai/limit.js`, `src/actions/CoverLetter.js`, `src/actions/ColdEmail.js`
- **What:**
  - Add contract section 7 covering every Phase 4 action below.
  - The cap fails closed when `NODE_ENV==="production"` and usage can't be read: return `AIError` code `AI_UNAVAILABLE` with the message "AI is temporarily unavailable". In dev it fails open with a warning (D33).
  - New `updateCoverLetter(id, content)` and `updateColdEmail(id, content)`: owner-scoped, zod-validated, with a content length cap. They keep the stored `sources`; the UI already falls back to "Based on" when paragraphs no longer line up.
- **Why:** D33, and the scout's MED problem (edits lost on reload).
- **Test:** With `NODE_ENV=production` and no `AiUsage` table, AI calls return `AI_UNAVAILABLE`. An edited letter survives a reload.

### 2. BACKEND: Resume versions
- **Files:** `src/actions/Resume.js`
- **What:**
  - `listResumeVersions()` returns `[{id, label, jobTitle, companyName, matchPercentage, createdAt}]`.
  - `saveResumeVersion({label, jobTitle, companyName, jobDescription?})` snapshots the current resume form JSON into `tailoredContent`.
  - `restoreResumeVersion(id)` first snapshots the current resume as a version named "Before restore <date>", then writes the version's content through the existing `saveResume` path.
  - `duplicateResume` writes real labels.
  - Uses the existing `ResumeVersion` model with no migration.
- **Why:** D36, and the version switch feature (CONTEXT §11.1, §11.7).
- **Test:** Save a version, edit the resume, then restore. The content comes back, and a "Before restore" version exists.

### 3. BACKEND: Deterministic match %
- **Files:** new `src/lib/match.js`, `src/actions/Resume.js`
- **What:**
  - `extractTerms(jd)` uses a curated tech and skills vocabulary plus multi-word phrases and acronyms from the job description, normalized with `normalizeText`.
  - `computeMatch(jd, resumeJson|versionId?)` returns `{percent, matched[], missing[]}`. It makes no AI call (D37).
  - Export the vocabulary so the logic is testable, and add self-check cases to `scripts/selfcheck-matching.mjs`.
- **Why:** D37. A match % must be computed, never typed.
- **Test:** A known job description and resume pair returns the expected terms. The self-check passes.

### 4. BACKEND: Tailor the resume to a job
- **Files:** `src/actions/Resume.js`, `src/lib/ai/schemas.js`
- **What:**
  - `tailorResume({jobTitle, companyName, jobDescription})` makes one `write` call. It returns proposals `[{proposalId, entryId, bulletIndex, original, proposed, reason, sources}]`. Sources are a resume entry id and job-description line ids, validated against the catalog.
  - `inventedNumbers(original + jd)` must pass. Otherwise the proposal is dropped, with one retry overall.
  - `saveTailoredVersion({jobTitle, companyName, jobDescription, acceptedProposalIds, proposals})` re-validates the proposals on the server against the current resume. It's stateless (no trust in the client's text beyond ids): store pending proposals in a short-lived server record, e.g. inside a `ResumeVersion` draft, or re-verify that each `proposed` text passes the checks.
  - It applies only the accepted proposals into a copy of the resume JSON and saves a `ResumeVersion` with `matchPercentage` from task 3. The main resume is never changed (D36).
- **Why:** D36. This is the preview's main feature.
- **Test:** Proposals cite real entries and job-description lines. Accepting 2 of 5 saves a version containing exactly those 2 changes, and the main resume is unchanged.

### 5. BACKEND: ATS requirements, level, weights and stored text
- **Files:** `src/actions/ResumeParser.js`, `src/lib/ai/schemas.js`, new `src/lib/ats/weights.js`
- **What:**
  - Add `requirements[]` to the ATS schema: `{requirement, status:"matched"|"gap", sources}`. A matched requirement needs a verified resume quote, and a gap needs a job-description id.
  - Store `requirements`, `candidateLevel` and the extracted `resumeText` inside `evidence` Json (no migration).
  - Move the per-level weights into `weights.js`, imported by both the prompt and the UI, so the displayed weights always match the prompt.
  - `getUserATSScores` and `getATSScoreById` return the new evidence fields, plus `previousScoreId` when present.
- **Why:** D32. The requirement checklist, candidate level, weights panel and history (CONTEXT §11.2).
- **Test:** A new analysis has requirements, each with a valid source. The weights shown match the prompt for that level.

### 6. BACKEND: ATS 1-click fix with real re-score
- **Files:** `src/actions/ResumeParser.js`
- **What:**
  - `proposeAtsFix(scoreId, weaknessIndex)` returns `{fixId, original (quote), proposed, sources}`. The rewrite is grounded in the weakness's resume quote and job-description ids, and passes `inventedNumbers`.
  - `applyAtsFix(scoreId, fixId)` runs only on the user's click. It replaces the quote in the stored `resumeText` and runs a real `fast` re-score on the new text, using the same validation as a fresh analysis. It saves a new `ATSScore` with `evidence.previousScoreId`, and returns `{newScoreId, before, after}`.
  - Scores without `resumeText` return `{error, code:"NEEDS_REUPLOAD"}`.
  - The main resume and `updateATSScore` are untouched (D38).
- **Why:** D38.
- **Test:** Applying a fix creates a new score linked to the old one, and the "after" score comes from a real call. Legacy scores return `NEEDS_REUPLOAD`.

### 7. FRONTEND: Resume versions, match % and sources panel
- **Files:** `(gated)/resume/**` (`ResumeBuilder.jsx` and new components)
- **What:**
  - A versions panel lists versions with labels and match %, has "Save version", and has "Restore" with a confirm dialog explaining that the current resume is saved first.
  - A match card takes a pasted job description and shows the %, matched and missing terms, and a "computed, not AI" note.
  - A "Sources" panel lists the catalog items that the accepted edits cited, using `SourceChips`.
- **Why:** D36 and D37.
- **Test:** A save, edit and restore round-trip works through the UI, and the match card shows real terms.

### 8. FRONTEND: Tailor flow with accept/strike
- **Files:** `(gated)/resume/**` (new `TailorPanel.jsx` or similar)
- **What:**
  - A job-description form leads to a list of proposals. Each shows the original and proposed text side by side, the reason, chips, and Accept or Strike.
  - "Save as version" saves the accepted proposals and then shows the match % before and after.
  - Handle `AI_LIMIT`, `NO_SOURCES` and `INVENTED_DETAIL` via `generationError.js`.
  - Nothing changes the main resume until the user restores the version.
- **Why:** D36.
- **Test:** Strike all but one, save, and confirm the version has one change. The main resume is unchanged.

### 9. FRONTEND: ATS checklist, level, weights, history and re-run
- **Files:** `(gated)/resume-parser/**`
- **What:**
  - A requirement checklist shows matched and gap items with their evidence.
  - The candidate level badge comes from `evidence`.
  - A weights panel reads `src/lib/ats/weights.js`.
  - A score history list comes from `getUserATSScores`, showing before and after pairs linked by `previousScoreId`, with a detail view.
  - "Re-run with this job" pre-fills the saved company, title and job description so the user only re-uploads the PDF.
  - Legacy scores show the legacy label.
- **Why:** D32 (CONTEXT §11.2).
- **Test:** History lists real scores, a re-run pre-fills the form, and the weights match the level.

### 10. FRONTEND: ATS fix UI, saving letter and email edits, and the unavailable message
- **Files:** `(gated)/resume-parser/**`, `CoverLetterPreview.jsx`, `ColdEmailPreview.jsx`, `src/components/shared/generationError.js`
- **What:**
  - Each weakness gets a "Propose fix" button. The proposal shows the original, the proposed text and chips. Accepting it runs the re-score and shows before and after with a link to the new result. `NEEDS_REUPLOAD` gets a clear message.
  - Letter and email previews get a Save button (or debounced autosave) that calls the update actions, with a saved indicator.
  - `AI_UNAVAILABLE` gets a friendly "temporarily unavailable" message everywhere.
- **Why:** D38, D33 and the lost-edits bug.
- **Test:** A fix produces a linked new score. An edited letter persists after a reload.

---

**New env var names:** none.
**New migrations:** none expected.
