# PLAN: Phase 7 (production readiness + quality)

Branch `phase-7`. Decisions: D49–D53 in DECISIONS.md. Inputs: CONTEXT.md §8 and §11 (b)–(d).

**Done when:**
- `npm test` runs Vitest unit tests for the trust helpers.
- Migrations are dated in order and documented in `docs/ai/DEPLOY.md`.
- The daily cap counts one per user action.
- Sentry does nothing without a DSN and scrubs personal data.
- `vercel.json` exists, and the build never touches the database.
- Unused dependencies are removed.
- The UI nits are fixed.
- `npm run build` passes, and all 6 tools still work.

Rules: never edit `.env`; never apply migrations or touch any database; new migrations are SQL only; renaming *unapplied* migration folders is allowed only to fix ordering; no feature removed; no personal data sent to third parties.

**Out of scope:** industry insights (Phase 8); dropping unused Prisma models (needs your confirmation that they hold no data); resume text retention scheduling (no job runner yet).

---

### 1. BACKEND: Migration order, runbook and Vercel config
- **Files:** `prisma/migrations/*` (rename only the future-dated, unapplied folders), new `docs/ai/DEPLOY.md`, new `vercel.json`
- **What:**
  - Rename `20261118000000_phase3_sources`, `20261119000000_cold_email_fields` and `20261120000000_interview_answer` to timestamps on or before today, keeping the current order (after `20261117010000_quiz_session`). Leave the contents unchanged.
  - Write `DEPLOY.md`:
    - Back up first.
    - Run `prisma migrate status`.
    - Use `migrate resolve --applied` only for drift.
    - Run `prisma migrate deploy` by hand.
    - Never use `migrate dev` or `reset` on production.
    - Include the apply order, the env checklist (every `.env.example` name, `AI_DEBUG` unset, `ATS_FIX_SIGNING_SECRET` ≥32 chars, the Sentry vars), a rollback note, and the Docker path.
  - `vercel.json` sets a build command that never runs migrations.
- **Why:** D52, and the scout's HIGH deploy gate.
- **Test:** `prisma validate` passes, the migration folders sort in the intended order, and the build doesn't touch a database.

### 2. BACKEND: Count the cap per user action
- **Files:** `src/lib/ai/index.js`, `src/lib/ai/limit.js`, `prisma/schema.prisma`, new migration `ai_usage_action_id` (SQL only), every server action that calls runAI
- **What:**
  - Add a nullable `actionId` to `AiUsage`, with an index on `(userId, createdAt)` if it's missing.
  - A small helper (e.g. `withAiAction(userId, fn)`) creates one id per user action and passes it to every `runAI` call inside it.
  - The cap counts distinct `actionId`s today, plus legacy rows with a null id counted individually.
  - The check happens once at the start of an action. Retries and re-scores inside the same action aren't blocked part-way.
  - Every row is still logged (D50).
- **Why:** D50, and the scout's MED multi-call spend.
- **Test:** A tailor or ATS-fix flow that makes 3 calls counts as 1 action. Hitting the limit blocks the next action, not a retry in the middle of an action.

### 3. BACKEND: Vitest unit tests
- **Files:** `package.json` (`test` script plus the vitest devDependency), `vitest.config.*`, new `src/**/__tests__/*.test.js` (or `tests/`)
- **What:**
  - Port the `scripts/selfcheck-matching.mjs` cases into tests, and add tests for `numberCheck`, `sources` normalize/validate, `paragraphs` shape, `entryIds`, `match`, `writing`, `rubric` computeOverall, `verify`, `derive` and `limit` counting logic (mocking the DB).
  - No network and no database.
  - Keep the self-check script.
- **Why:** D53. There are no tests today.
- **Test:** `npm test` passes, and so does `npm run build`.

### 4. BACKEND: Sentry with scrubbing
- **Files:** `package.json` (`@sentry/nextjs`), `instrumentation.js` / `sentry.*.config.js`, `next.config.mjs` (wrap only if needed; no source-map upload unless the env is set), the `safeErr` helper, `.env.example`
- **What:**
  - Initialize Sentry only when `SENTRY_DSN` (server) or `NEXT_PUBLIC_SENTRY_DSN` (client) is set.
  - `beforeSend` and `beforeBreadcrumb` drop request bodies, cookies, headers, user objects, and any field named like resume, jd, jobDescription, answer, content, email or clerk.
  - Server actions report via `safeErr` with the error code only.
  - With no DSN, nothing loads or sends.
  - Add the env names to `.env.example`.
- **Why:** D51.
- **Test:** With no DSN, the build and app behave exactly as before. A unit test of the scrubber shows sensitive fields removed.

### 5. BACKEND: Profile validation, stable paragraph ids and generic phrases
- **Files:** `src/actions/User.js`, `src/lib/ai/paragraphs.js`, `src/lib/roadmap/derive.js`
- **What:**
  - Add a zod schema to `updateUser` (industry, experience 0–60, skills ≤50 items of ≤50 chars, bio length) that returns `{error, code}`.
  - Placeholder IndustryInsight rows are still needed for the foreign key, but add a comment, and make sure nothing reads or displays them before Phase 8.
  - New letter and email generations store a short hash of each paragraph's text in `sources.paragraphs[i].hash`.
  - Extend the generic phrase list in `derive.js` (e.g. "customer facing", "cross functional", "fast paced", "best practices").
  - Update the contract.
- **Why:** the scout's MED profile validation item, the SourceChips mapping, and a review nit.
- **Test:** Invalid profile input is rejected with a message. New letters have paragraph hashes, and generic phrases no longer match targets.

### 6. BACKEND: Dependency cleanup and audit
- **Files:** `package.json`, `package-lock.json`, `DEPLOY.md`
- **What:**
  - Remove dependencies with zero imports, confirmed by grep for each (CONTEXT §8.13; e.g. unused PDF libraries, `openai`, `@upstash/qstash`, `resend`, and the duplicate motion library if unused).
  - Run `npm audit --omit=dev` and record the results in `DEPLOY.md`.
  - Apply only non-breaking fixes (no major bumps); list the rest for your decision.
- **Why:** dependency risk.
- **Test:** `npm run build` and `npm test` pass, and every remaining dependency is imported.

### 7. FRONTEND: Practice and voice nits
- **Files:** `(gated)/interview/practice/page.jsx`, `(gated)/resume/_components/AITextarea.jsx`, `EntryForm.jsx`
- **What:**
  - The practice submit button is disabled under `ANSWER_MIN_CHARS` (import from `rubric.js`), with a live "N more characters" hint.
  - In all three places, typing in the box while recording stops the recording first, so the next speech result never overwrites what you typed.
- **Why:** review nits.
- **Test:** Typing during recording stops it and keeps your text, and submit stays disabled until 20 characters.

### 8. FRONTEND: Stable source chips and landing copy
- **Files:** `src/components/shared/SourceChips.jsx` (`ParagraphSources`), `CoverLetterPreview.jsx`, `ColdEmailPreview.jsx`, `src/app/page.js` (:85, :101)
- **What:**
  - Map chips to paragraphs by `hash` when it's present, so unchanged paragraphs keep their chips even after other paragraphs are edited.
  - Edited paragraphs show none, and a "Based on" list covers the rest.
  - Fall back to the current index rule for legacy letters without hashes.
  - Landing copy: replace "1-click fixes that count up live" with an accurate line, and align "<120 word" with the 100–140 range from `writing.js`.
- **Why:** the scout's MED SourceChips item and the copy nits.
- **Test:** Editing one paragraph keeps the chips on the others, and the landing copy matches the product.

---

**New env var names:** `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` (both optional).
**New migration (you apply it):** `ai_usage_action_id`. Three unapplied migration folders are renamed to fix the date order.
