# REVIEW: Phase 3 (trust + hardening), branch `phase-3`, diff cf7e709..HEAD

Phase 2's review is in git history: `git show 6e93d33:docs/ai/REVIEW.md`.

**Summary:** `npm run lint` passes (0 errors, 1 pre-existing font warning in layout.js). `npm run build` passes. 2 MUST-FIX, 8 NICE-TO-HAVE.

## MUST-FIX

| # | Owner | File:line | Problem | Fix |
|---|---|---|---|---|
| 1 | BACKEND | src/actions/ResumeParser.js:429-453 (`updateATSScore`) | Exported server action with no callers. It spreads client-supplied `updateData` straight into `aTSScore.update`. Any signed-in user can overwrite `evidence` (forge sources and quotes), `userId` (move a row to another user) or scores. Phase 3 makes `evidence` a trust field, so this breaks the core promise. | Delete `updateATSScore` (grep shows zero callers). If it is kept, allowlist fields (never `evidence`, `userId`, `id`) and validate with zod. Update API-CONTRACT.md §6.4 if the function is removed. |
| 2 | BACKEND | src/lib/ai/sources.js:7,68,97 (`PROMPT_TEXT_MAX=400`, `JD_MAX_LINES=150`, `formatCatalogForPrompt`) | The job description now reaches the model only through the catalog. Each JD line is clipped to 400 chars and only the first 150 lines are kept. A JD pasted as one paragraph (very common) is cut to about 400 chars, so ATS scoring, letters, emails and roadmaps silently lose most of the JD. `createATSAnalysis`, `generateCoverLetter` and `generateColdEmail` all use this. It is a regression against Phase 2 behaviour (full JD up to 20000 chars). | In `buildSources`, split JD lines longer than about 350 chars into sentence or chunk ids (`jd:<line>` for short lines, `jd:<line>.<n>` for chunks) and raise the line cap so a 20000-char JD fits. Do not clip JD lines in `formatCatalogForPrompt`. Update the contract id note. |

## NICE-TO-HAVE

| # | Owner | File:line | Problem | Fix |
|---|---|---|---|---|
| 3 | BACKEND | src/actions/Resume.js:225-231 (`improveWithAI`) | The deterministic `input:current` + `profile:industry` sources are decorative. They are always the same two chips, so they carry no information. `input:current` just says "based on what you typed", and the industry is a prompt flavour, not a fact the text cites. The prompt says "never invent numbers" but nothing checks it. | Recommended: return only `input:current` (labelled "Rewritten from your text"), and drop the industry chip. Add a server check that every number or percentage in the output also appears in `current`. Drop the sentence or retry once if it doesn't. Then the chip is a real guarantee. |
| 4 | BACKEND | src/actions/ResumeParser.js:233,236 and 29-43 | A strength can be "sourced" only by a JD line. That cites the job, not the candidate, yet it is shown beside "From your resume". The quote minimum of 8 chars (line 34) lets near-trivial quotes such as "software" pass. For recommendations, `text` falls back to impact or category (line 236) while the contract says `text === action`. | Require at least one `resume_quote` for strengths. Raise the quote minimum to about 20 chars or 4 words. Keep `text = action`, and drop recommendations with an empty action. |
| 5 | BACKEND | src/lib/ai/sources.js:15 (`normalizeText`) | Quote matching only lowercases and collapses whitespace. PDF text often has ligatures (ﬁ), smart quotes, en dashes and hyphenation breaks. Honest quotes get dropped, which can cause false NO_SOURCES. | Apply `normalize("NFKC")` and map curly quotes and dashes to ASCII on both sides. Strip soft hyphens. |
| 6 | BACKEND | src/lib/ai/paragraphs.js:44; src/actions/ResumeParser.js:247; src/actions/CareerRoadmap.js (retry call) | If the retry call throws (rate limit, AI_LIMIT, timeout), the already-usable first result is discarded and the user gets FAILED or AI_LIMIT. | Wrap the retry in try/catch and fall back to the first result, which is dropped-and-filtered anyway. |
| 7 | BACKEND | src/lib/ai/paragraphs.js:47-48 | Only unsourced body paragraphs are checked. The model can return no greeting or closing, or several. Cited ids are verified to exist, not to support the claim (inherent limit, undocumented). | Enforce one greeting first and one closing last, or add them deterministically. Add one line to API-CONTRACT §6 saying that sources prove "built from these inputs", not entailment. |
| 8 | BACKEND | src/lib/checkUser.js:29 | `user.emailAddresses[0].emailAddress` throws for a Clerk user with no email, and it ignores the primary email. This is the same sync gap Phase 3 fixed elsewhere. | Use `primaryEmail(user)` from src/lib/clerkEmail.js. |
| 9 | FRONTEND | src/app/(main)/(gated)/resume/_components/EntryForm.jsx:122 | New entries have no id until saved, so keys mix `item.id` and the index. Harmless but could remount a row. | Give new entries a client temp id (the server keeps existing ids) or use `item.id ?? \`new-${index}\``. |
| 10 | FRONTEND | src/data/faqs.js:10-18 | The FAQ still says "Sensai", but the product is AscendAI. Old FAQs already used it (8 occurrences at cf7e709), so the agent did not introduce it, but the rewritten FAQ (line 13-15) repeated it. | Replace "Sensai" with "AscendAI" in all FAQ entries. |

## Checks that passed

- **Citation integrity.**
  - `validateSourceIds` drops unknown ids, and `snapshot` is built only from the catalog.
  - ATS quotes must appear in the normalized extracted PDF text; JD ids must exist.
  - Retry runs once when a list has fewer than 2 verified items, then unsourced items are dropped (D28). Letters and emails drop unsourced body paragraphs after one retry, and NO_SOURCES is returned if no body is left.
  - Greeting and closing are exempt, and body paragraphs are not.
  - Sources come only from validated ids, so free text cannot add sources.
  - `clean()` collapses `\n{2,}` inside a paragraph, and `join("\n\n")` keeps the `split(/\n{2,}/)` mapping aligned with `sources.paragraphs`. Single-newline lists are fine.
- **PDF.**
  - Validation order is zod, then `validateAndExtractPdf` (MIME, base64 shape, size estimate and exact size, `%PDF-` magic bytes, text >= 50 chars), then the user upsert, then AI.
  - The limit is 5 MB. `next.config.mjs` `bodySizeLimit` is 10 MB, so a 5 MB file in base64 fits.
  - `unpdf` is imported only from `lib/ai/pdf.js`, which is used only by a `'use server'` file. The /resume-parser client bundle stays at 5.55 kB.
- **Data safety.**
  - The migration SQL adds 3 nullable JSONB columns and `DROP NOT NULL` on `User.email`, and matches schema.prisma. The unique index is kept. No rows are rewritten.
  - `assignEntryIds` keeps existing ids and regenerates only missing or duplicate ids. `entrySchema` now carries `id`, so the form round-trips ids.
  - The `exp:i<index>` fallback is used only at generation time, and the snapshot (label and excerpt) is stored, so a later reorder can't change what an old record cites.
- **Email.**
  - No `placeholder.com` or `email: ""` remains. `primaryEmail()` returns null instead.
  - ColdEmail no longer sends the email address to the model. Nothing else reads `user.email` (except checkUser, item 8).
- **Errors.**
  - All changed generators return `{error, code}` for expected failures. Signed-out still throws "Unauthorized".
  - AITextarea, EntryForm, CoverLetterGen, ColdEmailGen, CreateRoadmapModal and ResumeParserForm all handle `error`, `code` and AI_LIMIT. NO_SOURCES and INVALID_FILE messages are user-safe strings (no env dependency).
- **Removed code.** `getLatestQuiz` and `saveQuizResult` have no callers left. The cap default is 50 and `AI_DAILY_LIMIT=0` disables it. `.env.example` is updated. Old unsubmitted quiz sessions are pruned per user only (scoped by `userId`).
- **UI.**
  - Legacy labels show for null `evidence` and null `sources`. Roadmap steps without a `sources` key get the legacy label.
  - The "Based on" fallback works when the paragraph count differs.
  - The new Recommendations section in the ATS results is fine as an addition.
  - Landing "Sample" pill is present (it also shows on /tools/resume, which is fine).
  - /tools/ats has no leftover "Aarav" strings. Remaining "Aarav" is in /tools/cold-email preview data, ResumePaperDoc and mock.ts, which is acceptable under the preview banner.

## Done-when

| Item | Result |
|---|---|
| New ATS items, improved text, letter and email body paragraphs and roadmap steps carry at least one valid source | PASS (improve sources are decorative, item 3; JD truncation affects quality, item 2) |
| Server drops unsourced items, retrying once | PASS |
| Pre-Phase-3 records show "created before sources" | PASS |
| Invalid PDFs rejected | PASS |
| No placeholder or empty emails written | PASS |
| `npm run build` passes, all 6 tools still work | PASS for the build; the tools are wired (not run), but see must-fix 2 for JD handling |
