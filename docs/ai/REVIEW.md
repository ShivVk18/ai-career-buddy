# REVIEW: Phase 7 (branch phase-7, 810e256..HEAD)

Phase 6 review: see this file at commit 6417e3e (`git show 6417e3e:docs/ai/REVIEW.md`).

Summary: FAIL, 1 must-fix. `npm run lint` 0 errors (1 old font warning), `npm run build` pass, `npm test` 14 files / 80 tests pass (no network or DB), `node scripts/selfcheck-matching.mjs` pass.

## MUST-FIX

| # | Owner | File:line | Problem | Fix |
|---|---|---|---|---|
| 1 | BACKEND | src/lib/sentryScrub.js:36-37, 58-62 (scrubEvent exception values) | Exception messages are only redacted for emails and Clerk ids, then cut to 300 chars. Uncaught errors reach Sentry through `onRequestError` (src/instrumentation.js:11). Prisma validation errors echo the query arguments, so a failed write can send up to 300 chars of resume, letter or answer text to a third party. This breaks the "no personal data to third parties" rule. | In `scrubEvent`, replace each `exception.values[].value` with the error `type` (or a fixed string) unless `type === "SafeErr"`. Do the same for `e.message`. Add a unit test with a Prisma-style message that contains resume text. |

## NICE-TO-HAVE

| # | Owner | File:line | Problem | Fix |
|---|---|---|---|---|
| 1 | BACKEND | src/lib/ai/limit.js:25-30 | Two parallel actions at limit-1 can both pass the once-per-action check (no lock). The overshoot is bounded by concurrency and is acceptable for a spend cap. | Document the soft cap in DEPLOY.md or D50. |
| 2 | BACKEND | src/lib/ai/index.js:12-13 | `export { withAiAction }` sits between the AIError JSDoc and the class, which detaches the comment. | Move the export above the comment. |
| 3 | BACKEND | docs/ai/CONTEXT.md:8,113 | Still lists the old future-dated migration names. | Refresh CONTEXT.md. |
| 4 | BACKEND | src/instrumentation-client.js:5-7 | Not verified that the SDK chunk is absent from the client build when `NEXT_PUBLIC_SENTRY_DSN` is unset (the build output was not inspectable here). Runtime is inert: no import runs without the DSN. A lazy chunk may still ship. | Check `.next/static` for a sentry chunk. If present, gate the import behind a build-time constant. |
| 5 | FRONTEND | src/lib/ai/paragraphs.js:118-129 and CoverLetter.js shorten | After a user edit and a shorten, a stale hash on an edited-but-not-shortened paragraph stays unmatched (no chips). This is correct and conservative. A shortened paragraph gets its chips back even though the text was rewritten by the model. | Acceptable; note in the contract. |
| 6 | BACKEND | docs/ai/DEPLOY.md section 6 | The "Before: 23 vulnerabilities" figure can't be re-verified now. The "After: 12 (1 moderate, 11 high)" figure matches `npm audit --omit=dev`. | None. |

## Verified OK

- Migrations: the 3 renames are pure renames (100% similarity, SQL byte-identical). Order is ai_usage < quiz_session < phase3_sources < cold_email_fields < interview_answer < ai_usage_action_id. New SQL (nullable `actionId`, index `(userId, createdAt)`) matches schema.prisma. The old names appear only in docs (DEPLOY explains them). DEPLOY.md is safe: backup first, `resolve` only for drift, no `migrate dev` or `reset` on prod, and it states production AI is blocked until #6 is applied (D33). `vercel.json` runs `npx prisma generate && npm run build` only.
- Cap: `withAiAction` uses AsyncLocalStorage, and nested calls join the outer one. Every AI entry point is wrapped: Resume (improve, tailor), ResumeParser (ATS, propose, apply), CoverLetter (generate, regenerate, shorten), ColdEmail, Interview (quiz, submit), Practice (generate, score), CareerRoadmap (generate, progress), and chat route. `paragraphs.js` is only called inside actions. The check runs once, before the first call, and `capChecked` is set only after a pass. The count SQL is parameterized and user-scoped: `COUNT(DISTINCT actionId) + COUNT(*) FILTER (actionId IS NULL)` on the UTC day. Production fails closed, dev fails open with a warning. All rows are still logged.
- Sentry: without `SENTRY_DSN`, `register()` returns early, `onRequestError` returns early, and the browser file does nothing. `withSentryConfig` is applied only when token, org and project are all set. Redirects and other config are untouched. The scrubber covers request body, cookies, headers, user, extra, tags, contexts, breadcrumbs, and stack-frame vars. Replay and feedback are removed. `safeErr` sends the error code only.
- Dependencies: no imports of any removed package remain. React 19.1.10 and next 15.5.29 are patch or minor. `npm ci --dry-run` is consistent with the lockfile.
- Profile: the `updateUser` zod bounds are correct and return `{error, code}`. OnboardingForm toasts the error. Placeholder IndustryInsight is commented.
- Paragraphs: `paragraphHash` is one shared function (src/lib/entryIds.js), used by the server and by SourceChips. `mapParagraphSources` handles edits, additions, reorders (hash match), and legacy (index rule). The cold-email matched-project highlight uses it. Shorten refreshes the hashes.
- UI: practice submit is disabled under 20 chars with an "N more characters" hint. Typing while recording stops it in Practice, AITextarea and EntryForm. The `typedRef` guard drops late transcript results, so typed text is kept and nothing is stuck. The `typedRef` resets on the next start.
