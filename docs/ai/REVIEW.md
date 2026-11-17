# REVIEW: Phase 4 (Resume + ATS parity), branch phase-4

Phase 3's review is at commit 29a233e (`git show 29a233e:docs/ai/REVIEW.md`).

**Result: PASS. 0 must-fix, 8 nice-to-have. `npm run lint`: 0 errors, 1 pre-existing warning (layout.js font). `npm run build`: passes. `node scripts/selfcheck-matching.mjs`: all self-checks passed.**

## MUST-FIX
None.

## NICE-TO-HAVE

**Status: items #1 to #8 are all RESOLVED in the follow-up round (see the end of this file).**

| # | Owner | File:line | Problem | Fix |
|---|-------|-----------|---------|-----|
| 1 | FRONTEND | src/app/(main)/(gated)/resume/_components/ResumeBuilder.jsx:273-298 and :309-323 | Entry ids are not stable for resumes whose entries have no id (saved before Phase 3 and never re-saved). `isDirty` is never cleared after a save (no `reset`), so every `ensureSaved` re-saves. The client entries still have no id, so `assignEntryIds` mints new random ids each time. A draft made after save #1 (`exp:e_X`) then fails with STALE/RESUME_CHANGED after save #2. Entries added in the form get a client UUID (EntryForm.jsx:64-70) and are stable. Failure is closed and recoverable (re-run tailoring), and a reload picks up the stored ids. | After a successful save, `reset(data)` the form with the ids the server returned (`saveResume` returns the row, so use `row.experience/education/projects`), or assign ids client-side on load for entries missing one. |
| 2 | BACKEND | src/actions/ResumeParser.js:577-581 | Fix-token key is `HMAC key = "ats-fix:" + CLERK_SECRET_KEY`, a string prefix on the raw secret, not a derived key. Everything else in the scheme is sound: HMAC-SHA256, the `userId.` prefix binds the user, `fix.s` is checked against `scoreId`, comparison is `timingSafeEqual` with a length check, expiry is 24h with a future-skew bound, and `apply` re-verifies against the stored text. A missing secret fails closed (`propose` returns FAILED, `read` returns null so INVALID). Reusing the Clerk secret is acceptable (never sent anywhere, rotation only invalidates 24h-lived tokens), but it couples the Clerk key to an app feature. **Recommendation:** add a dedicated `ATS_FIX_SIGNING_SECRET` (new env var name only, documented in `.env.example`, never read by the reviewer), required in production, with a dev-only fallback to a derived key. | Derive the key as `createHmac("sha256", secret).update("ai-career-buddy/ats-fix/v1").digest()` (HKDF-style domain separation), and prefer the dedicated env var. |
| 3 | BACKEND | src/actions/ResumeParser.js:760 | `resumeText.indexOf(fix.o)` replaces the first occurrence, which may not be the line the weakness quoted if the same text repeats. The effect is a slightly different re-score input, not a security issue. | Store the span offset (`start`) in the token and verify `resumeText.startsWith(fix.o, start)`. |
| 4 | BACKEND | src/actions/ResumeParser.js:734-801 | A fix token can be applied repeatedly within 24h; each call makes a real AI re-score and a new ATSScore row. The daily cap bounds the cost, but duplicates clutter history. | Reject if a score already exists with `evidence.appliedFix.proposed === fix.p` and `previousScoreId === score.id`, or store the token nonce. |
| 5 | BACKEND | src/actions/Resume.js:833-845 | "At most one draft per user" is a delete-then-create without a transaction. Two concurrent `tailorResume` calls can leave two drafts (both expire at 24h, neither is ever listed). Drafts are also never purged unless the user tailors again. | Wrap in `db.$transaction`, and optionally purge expired drafts in `listResumeVersions`. |
| 6 | BACKEND | src/actions/ResumeParser.js:353-387 | `getUserATSScores` loads the full `evidence` (including up to 30k chars of `resumeText`) for every row just to compute flags. The text is stripped before returning, so there is no exposure, only wasted bandwidth. | Cap with `take`, or move flags to a lighter query. |
| 7 | FRONTEND | src/components/chat/ChatSlideOver.jsx:19-23 | `AI_UNAVAILABLE` (chat API maps it server-side to "busy right now") reaches the client as a code and falls to the generic message. Acceptable, but it does not say "temporarily unavailable". | Add an `AI_UNAVAILABLE` branch in `friendlyError`. |
| 8 | FRONTEND | src/app/(main)/(gated)/interview/mock/page.jsx:35-40, EntryForm.jsx:104-108 | Both special-case only `AI_LIMIT` and otherwise show the server's `error` string. `AI_UNAVAILABLE` still shows the right text because the server message is friendly, so this works today but is fragile. | Use `generationErrorMessage(result)` in both. |

## Checks against the brief

- **No auto-apply (D36/D38): OK.**
  - `tailorResume` only writes a draft `ResumeVersion` row. `saveTailoredVersion` updates that row into a version, so the main `Resume` is never written.
  - `restoreResumeVersion` creates the "Before restore" backup first, then calls `saveResume`.
  - `proposeAtsFix` changes nothing. `applyAtsFix` creates a NEW `ATSScore` and never touches the old score, `updateATSScore` or the main resume, and the UI calls it only from a button click (AtsResult.jsx:164).
  - Drafts live in a JSON envelope (`{"kind":"draft",...}`), and every row written by `encodeVersion` starts with `{"kind":`. A user label sits inside the envelope, so it cannot collide with the prefix. Legacy plain-string rows are not JSON envelopes and cannot start with the prefix.
  - `listResumeVersions` excludes drafts (`NOT startsWith`). `getResumeVersion`, `restoreResumeVersion` and `computeMatch` treat `kind !== "version"` as NOT_FOUND or NOT_RESTORABLE.
  - Drafts expire after 24h (STALE) and are replaced on each tailor run.
  - `duplicateResume` writes a real `Copy of resume (<date>)` label inside a version envelope.
- **Trust in client data: OK.**
  - `saveTailoredVersion` takes only `draftId`, ids and an optional label. It loads the draft owner-scoped (`resumeId`), then re-checks that the bullet text is unchanged and re-runs `inventedNumbers` against the current resume and job description.
  - `fixId` handling is covered in nice-to-have #2.
- **Sources and numbers: OK.**
  - `tailorResume` validates entry ids and bullet indexes against the catalog, requires at least one valid `jd:` id via `validateSourceIds`, runs `inventedNumbers(proposed, original + JD)`, drops failures, retries once, and returns INVENTED_DETAIL or NO_SOURCES.
  - `proposeAtsFix` locates the weakness's verified quote in the stored text, requires a JD id and passes `inventedNumbers` (retry once).
  - `scoreResume` is shared by `createATSAnalysis` and `applyAtsFix`, so the re-score has the same validation.
  - `verifyRequirements`: matched needs a verified resume quote, gap needs a valid JD id.
- **Data exposure: OK.**
  - `publicScore` strips `resumeText` (used by `createATSAnalysis`, `getATSScoreById` and `updateATSScore`). `getUserATSScores` returns only `hasResumeText` and counts.
  - `applyAtsFix` returns ids and scores only.
  - Dashboard and chatContext do not select `evidence`.
  - `getResumeVersion.applied` is owner-scoped.
  - Every new action calls `auth()` and scopes queries by `userId` or `resumeId`.
- **Cap: OK.**
  - `checkDailyLimit` returns "unavailable" only when `NODE_ENV==="production"`, and dev fails open with one warning.
  - `AI_UNAVAILABLE` is mapped in CoverLetter, ColdEmail, CareerRoadmap, Interview (MESSAGES entry), improveWithAI, tailorResume, createATSAnalysis, proposeAtsFix and applyAtsFix, and in `generationError.js`.
  - The interview quiz UI displays the server message, and chat maps the code server-side (see #7 and #8).
- **Match %: OK.** `src/lib/match.js` imports only `normalizeText`, with no AI import. The self-check passes.
- **Frontend: OK apart from nice-to-have #1.**
  - `ensureSaved` runs before Save version, Tailor and Restore.
  - Restore reloads the page after success.
  - The letter and email Save buttons call `updateCoverLetter` and `updateColdEmail`, which are owner-scoped, update only `content` and keep `sources`.
  - Legacy versions are labelled "plain text copy" and are not restorable.
  - The NEEDS_REUPLOAD message and the re-run action are present, and loading, empty and error states exist in the new panels.

## Done-when
1. Resume and ATS features: PASS (tailoring accept/strike, computed match %, versions, requirement checklist, level, weights, history, re-run, 1-click fix with a real re-score).
2. Verified sources, nothing applied without a click: PASS.
3. Letter and email edits persist: PASS.
4. Cap fails closed in production: PASS.
5. `npm run build` passes and all 6 tools still wired: PASS.

## Follow-up round (git diff 5d822d9..HEAD)

**Result: PASS. 0 must-fix. `npm run lint`: 0 errors, 1 pre-existing warning (layout.js font). `npm run build`: passes. `node scripts/selfcheck-matching.mjs`: all self-checks passed.**

### MUST-FIX
None.

### Resolved
- #1 RESOLVED. ResumeBuilder.jsx `withIds` assigns ids on load for entries lacking one. `markSaved` calls `reset(saved)` only if `getValues()` still equals the submitted data, so edits made mid-save are kept dirty. Ids are not regenerated on later saves, so drafts do not go STALE needlessly. Residual: ids minted on load for never-saved legacy entries differ after a reload before the first save; this fails closed and is recoverable.
- #2 RESOLVED. Key is `HMAC(ATS_FIX_SIGNING_SECRET, "ai-career-buddy/ats-fix/v1")`. Production with a missing or <32-char secret returns null, giving FIX_UNAVAILABLE from propose and apply. Dev uses an ephemeral `randomBytes(32)` with one warning. There is no CLERK_SECRET_KEY fallback. `.env.example` documents the name only.
- #3 RESOLVED. Offset `a` and nonce `n` are signed in the token. Apply requires an integer `a >= 0`, checks `resumeText.startsWith(fix.o, a)` (mismatch gives STALE) and splices exactly at `a`.
- #4 RESOLVED, with a small race noted. The nonce is checked before the AI call and again right before `create` (JSON path filters on `previousScoreId` and `appliedFix.nonce`, scoped by userId). ALREADY_APPLIED returns `newScoreId`. Tokens without `a` or `n` (old tokens) are rejected as INVALID. Remaining race: there is no unique DB constraint, so two truly concurrent applies can both pass the second check and create two rows (a duplicate history row plus an extra capped AI call only). It is bounded by the daily cap and the window is a few milliseconds. This is acceptable; a unique index would need a migration.
- #5 RESOLVED. Draft delete+create runs in `db.$transaction`. Expired (24h) drafts are purged by `deleteMany` in `listResumeVersions`, scoped to `resumeId` and the draft prefix, with `.catch` so failures do not break the list. Note: under default isolation two concurrent transactions could still each insert one draft; the effect is harmless because drafts are never listed and expire.
- #6 RESOLVED. `take: 50`, `createdAt desc`, same shape.
- #7, #8 RESOLVED. ChatSlideOver, mock interview page and EntryForm use `generationErrorMessage`. FIX_UNAVAILABLE and ALREADY_APPLIED are added to it.
- New codes in the UI: AtsResult.jsx opens `newScoreId` on ALREADY_APPLIED and shows an "Open result" button. INVALID shows "out of date, please propose the fix again" and returns to the propose button.

### Nits
| Severity | File:line | Problem | Fix |
|---|---|---|---|
| nit | src/actions/ResumeParser.js (signingKey) | Dev ephemeral key means fix tokens break on hot reload or restart (INVALID). The UI message covers this. | None needed. |
