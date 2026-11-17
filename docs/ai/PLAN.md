# PLAN: Phase 3 (trust + hardening)

Branch `phase-3`. Decisions: D25–D31 in DECISIONS.md. Inputs: CONTEXT.md §11 "Phase 3 inputs".

**Done when:**
- Every newly generated ATS item, improved resume text, cover letter and cold email body paragraph, and roadmap step carries at least one valid source.
- The server drops unsourced items, retrying once.
- Records from before Phase 3 show a "created before sources" label.
- Invalid PDFs are rejected.
- No placeholder or empty emails are written.
- `npm run build` passes, and all 6 tools still work.

Rules: never edit `.env`; migrations are SQL files only and are never applied; every query is scoped by userId; zod on every input; no feature removed; existing records are never rewritten.

**Out of scope:** moving `/tools/*` features into the real routes (Phase 4); industry insights (Phase 5); dropping unused Prisma models or tables (that touches data, so it needs a separate decision); regenerating old records.

---

### 1. BACKEND: Source catalog, stable resume ids and the contract
- **Files:** new `src/lib/ai/sources.js`, `src/actions/Resume.js`, `docs/ai/API-CONTRACT.md`
- **What:**
  - `buildSources({ profile, resume, jobDescription })` returns `[{ id, kind, label, text }]` with ids like `exp:<entryId>`, `edu:<entryId>`, `proj:<entryId>`, `profile:skills`, `profile:bio`, `profile:experience` and `jd:<lineNo>`.
  - Helpers `validateSourceIds(ids, catalog)` and `snapshot(ids, catalog)`. A snapshot stores `{id, label, excerpt}` with the record, so displaying sources never needs a recompute.
  - `saveResume` assigns a stable `id` (a cuid or nanoid) to every experience, education and project entry that lacks one, inside the existing JSON. There's no migration and existing ids are kept.
  - Add a "Sources" section to the contract: the snapshot shape, each generator's new return shape, and the `legacy` flag meaning a record from before sources existed.
- **Why:** D26. Every other task depends on this.
- **Test:** Saving a resume twice keeps the same entry ids. `validateSourceIds` rejects unknown ids.

### 2. BACKEND: Migration for sources and nullable email, plus the email fix
- **Files:** `prisma/schema.prisma`, new migration `phase3_sources`, `src/actions/User.js`, `src/actions/ResumeParser.js`
- **What:**
  - Add `sources Json?` to `CoverLetter` and `ColdEmail`, and `evidence Json?` to `ATSScore`.
  - Make `User.email` optional (`String? @unique`; Postgres allows many NULLs).
  - Stop writing `""` (`User.js:86`) and `${userId}@placeholder.com` (`ResumeParser.js:24,31`). Use the Clerk primary email, or `null` if there isn't one.
  - The migration is SQL only and never applied.
- **Why:** D26, and the scout's problem #3 (email collisions).
- **Test:** `prisma validate` passes. A grep finds no `placeholder.com` and no `email: ""`.

### 3. BACKEND: ATS evidence and PDF validation
- **Files:** `src/actions/ResumeParser.js`, `src/lib/ai/schemas.js`, `package.json` (add a small PDF text extractor such as `pdf-parse`, server-only)
- **What:**
  - Validate the upload: `application/pdf` type, `%PDF` magic bytes and size ≤ 5 MB. Otherwise return `{error, code:"INVALID_FILE"}`.
  - Extract the PDF text on the server. Strengths, weaknesses and recommendations become `{ text, sources:[{type:"resume_quote", quote} | {type:"jd", id}] }`.
  - A quote counts only if it appears, after whitespace and case normalization, in the extracted text. JD ids must exist.
  - Drop items with no valid source, and retry once if fewer than 2 remain in any list (D28).
  - Save the item text to the existing columns (so old readers keep working) and the full items to `evidence`.
- **Why:** D26, D28, and the scout's problem #2 (unvalidated PDF upload).
- **Test:** A `.txt` renamed to `.pdf`, or a 6 MB file, is rejected with a friendly message. A real PDF returns items whose quotes appear in the resume.

### 4. BACKEND: Paragraph sources for cover letters and cold emails
- **Files:** `src/actions/CoverLetter.js`, `src/actions/ColdEmail.js`, `src/lib/ai/schemas.js`
- **What:**
  - Generate with `runAIStructured` into `{ paragraphs:[{ kind:"greeting"|"body"|"closing", text, sourceIds[] }] }`, using a catalog from the profile, resume entries and job description.
  - Body paragraphs need at least one valid id. Retry once, then drop any unsourced body paragraph (D28). If no body paragraph is left, return `{error, code:"NO_SOURCES"}`.
  - Join the paragraphs into the existing markdown `content`, so the editor keeps working, and store the snapshot per paragraph in `sources`.
  - Stop sending the user's email address to the model (CONTEXT note on `ColdEmail.js:33`).
- **Why:** D27 and D28.
- **Test:** The new letter's `sources` lists one entry per paragraph, and every body paragraph's ids resolve. The editor still shows the full text.

### 5. BACKEND: Sources for roadmap steps and "improve with AI"
- **Files:** `src/actions/CareerRoadmap.js`, `src/actions/Resume.js`, `src/lib/ai/schemas.js`
- **What:**
  - Each roadmap step gets `sourceIds[]` from the catalog (target role, current skills, experience), validated and snapshotted inside the existing `steps` JSON. Unsourced steps are dropped, with one retry.
  - `improveWithAI(input)` returns `{ text, sources }`, citing the user's input text and profile fields. This is a contract change, and the frontend updates the callers in task 7.
- **Why:** D26 and D28.
- **Test:** A new roadmap's steps all have resolved sources. "Improve" returns text plus sources.

### 6. BACKEND: Cap default and dead-code cleanup
- **Files:** `src/lib/ai/limit.js`, `.env.example`, `src/actions/Interview.js`
- **What:**
  - When `AI_DAILY_LIMIT` is unset, the cap is 50; `0` disables it (D30). Update the `.env.example` comment.
  - `generateQuiz` deletes the user's own unsubmitted `QuizSession` rows older than 7 days.
  - Remove `getLatestQuiz` and the `saveQuizResult` stub, but only after a grep confirms zero callers.
- **Why:** D30, the scout's problem #1 (no spending cap by default), and the REVIEW leftovers.
- **Test:** With the variable unset, the 51st call is blocked. Old unsubmitted sessions are pruned on the next quiz.

### 7. FRONTEND: Shared source chips and the resume builder
- **Files:** new `src/components/shared/SourceChips.jsx`; resume builder `EntryForm.jsx` and `AITextarea.jsx` (under `(gated)/resume/`)
- **What:**
  - `SourceChips` renders snapshot chips (label, with the excerpt as a tooltip) plus a "Created before sources were added" variant for legacy records (D29). It's styled after `design/ascendai-pixel.html`.
  - The builder keys entries by their stable `id`, not the array index.
  - "Improve with AI" uses the new `{text, sources}` return and shows chips under the improved text.
- **Why:** D26 and D29.
- **Test:** Improving a bullet shows its chips. Reordering or deleting entries keeps the right content in each row.

### 8. FRONTEND: ATS evidence display and upload checks
- **Files:** `(gated)/resume-parser/**` (`ResumeParserForm.jsx` and the results view)
- **What:**
  - Each strength, weakness and recommendation shows its evidence: quoted resume text or the job-description line.
  - Old scores (`evidence` null) show the legacy label.
  - Check the file type and the 5 MB limit in the browser before upload, and handle `INVALID_FILE` with a friendly message.
- **Why:** D26, D29 and the PDF-check hardening.
- **Test:** A new analysis shows evidence for every item, an old one shows the label, and a bad file is rejected before upload.

### 9. FRONTEND: Sources on letters, emails and roadmaps
- **Files:** `CoverLetterPreview.jsx`, `ColdEmailPreview.jsx`, the generate forms (to handle `NO_SOURCES`), `RoadmapDetailView` (under `(gated)/roadmap/`)
- **What:**
  - The previews show chips under each body paragraph. If the edited content's paragraph count no longer matches the stored sources, show one "Based on" list instead (D27).
  - Roadmap steps show their chips.
  - Records without sources show the legacy label.
  - `NO_SOURCES` gets a message telling the user to add more profile or resume detail.
- **Why:** D27 and D29.
- **Test:** A new letter shows a chip row per paragraph. After an edit that adds a paragraph, the "Based on" list appears. An old letter shows the legacy label.

### 10. FRONTEND: FAQ copy and the landing sample label
- **Files:** `src/data/faqs.js`, `src/app/page.js` (and/or `ResumePaperDoc.jsx` on the landing page)
- **What:** Reword the weekly-industry-updates FAQ to describe the features that exist (D31). Label the "Aarav Sharma" resume on the landing page as "Sample" (REVIEW NICE-TO-HAVE #7).
- **Why:** D31 and the "nothing invented" promise.
- **Test:** The landing page no longer promises weekly insights, and the sample resume is clearly marked.

---

**New env var names:** none. `AI_DAILY_LIMIT` keeps its name, but unset now means 50.
**New migration (you apply it):** `phase3_sources`, which adds three nullable JSON columns and makes `User.email` nullable.
