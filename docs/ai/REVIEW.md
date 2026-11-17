# REVIEW: Phase 5 (writing tools parity + retire 4 previews)

Phase 4's review is at commit cb54b26 (`git show cb54b26:docs/ai/REVIEW.md`).

Summary (initial review): PASS with 0 must-fix. See the Fix round section at the end for the re-review. `npm run lint` passes (0 errors, 1 pre-existing font warning). `npm run build` passes. `node scripts/selfcheck-matching.mjs` prints "all self-checks passed". 8 nice-to-have items.

## MUST-FIX

None.

## NICE-TO-HAVE

| # | Owner | File:line | Problem | Fix |
|---|---|---|---|---|
| 1 | BACKEND | src/lib/ai/paragraphs.js:19-30 (clean) with src/actions/ColdEmail.js prompt | The number check also applies to greeting/closing, and they are dropped when it fails. A closing like "Open to a 5-minute chat?" (the UI tip even suggests it) has an unbacked "5", so the closing and sign-off silently vanish. | Tell the prompt "no numbers in the greeting or closing", or exempt closing/greeting from the number check since they carry no sources. |
| 2 | BACKEND | src/actions/ColdEmail.js getColdEmails / getColdEmail (and generate/update) | Until `20261119000000_cold_email_fields` is applied, the list and detail pages throw (Prisma selects the new columns) and generate/update/follow-up return FAILED. Dashboard follow-ups is guarded; chatContext and the dashboard use explicit selects, so they are safe. Acceptable only if the migration is applied before or with the deploy. | Apply the migration first (state it in the release note). Optionally give `getColdEmails` an explicit select of the list fields so the list survives a lag. |
| 3 | FRONTEND | src/app/(main)/(gated)/cold-email/_components/ColdEmailPreview.jsx:93 (EMAIL_RE) | The client regex is looser than the server's zod email: `x,y@z.com` passes, and the mailto then carries `x%2Cy@z.com`, which some mail clients split into two recipients. Save is rejected by the server, but the mailto uses unsaved text. | Use a stricter client regex that rejects `, ; < > " ( )` or require saved details before enabling the mail button. |
| 4 | BACKEND | src/actions/ColdEmail.js:~117 (fallback subject) | The fallback subject interpolates jobTitle/companyName, which allow newlines on input (only the recipient fields are single-line). It is not whitespace-collapsed, so a later "Save details" is rejected by the single-line rule. | `.replace(/\s+/g, " ")` the fallback text. |
| 5 | FRONTEND | ColdEmailPreview.jsx:~214 (SourceChips under Subject) | After the user edits the subject, "Subject based on" still shows the AI's sources for the old text. | Hide the chips when `fields.subject !== savedFields.subject` or when the stored subject differs. |
| 6 | BACKEND | src/actions/ResumeParser.js getATSScoreById | The purge does not run here, so an old result that has not been purged yet shows hasResumeText=true. "Propose fix" then fails with NEEDS_REUPLOAD (the safe behavior, but a poor UX). | In publicScore, set hasResumeText=false and resumePurged=true when `isPastResumeTextLimit(row.createdAt)`. |
| 7 | BACKEND | src/actions/CoverLetter.js regenerateCoverLetter | The tone is not stored, so "More formal" uses whatever the UI dropdown currently says (default confident) rather than the tone of the existing letter. | Optional: store the tone, or document that "More formal" uses the selected tone. |
| 8 | FRONTEND | ColdEmailPreview.jsx tips ("under 100 words") and "Ready to send" label | The tip contradicts the 100-140 target. The label could be read as auto-send. | Reword the tip to the 100-140 range and the label to "Draft". |

## Verification notes (all focus areas)

- **Privacy:** `recipientEmail` appears in ColdEmail.js only in zod, the DB create/update and a comment. It is not in the prompt, `extra` sources, `allowedNumberText` (name and role only) or any log (`safeErr`). chatContext selects only company, role, status. No AiUsage content. PASS.
- **Purge (D42):** table "ATSScore" and columns evidence, createdAt, userId match the migrations. Only `- 'resumeText'` is removed and `resumePurgedAt` is added. It is owner-scoped, bounded (LIMIT 50, oldest first) and atomic. Failure is caught and logged. The race fix is correct: the same `resumeTextCutoff()` is used by the purge and by `isPastResumeTextLimit` in propose and apply; inside the advisory-lock tx the source row is re-read with FOR UPDATE (userId-scoped), and a missing text or a past-limit row returns `{reupload}` which maps to NEEDS_REUPLOAD. PASS.
- **No auto-send (D35):** the mailto is built in render but only navigated in `handleMailto` on a click. The address must pass the regex, the subject and body use encodeURIComponent (CR/LF become %0D%0A, `&` and `?` are encoded, so no param injection), and URLs over 1800 characters are refused with a toast. Only the comma caveat (item 3) remains. PASS.
- **Sources and numbers:** generation, regenerate and subject use `allowedNumberText` and `inventedNumbers`. Subject needs a valid id, no claims (%, open rate, etc.) and no invented numbers. The fallback subject uses only typed values and input: source ids. Shorten keeps the stored sources untouched (content-only update, guarded by `content: row.content`), rejects longer or invented rewrites with INVENTED_DETAIL, and returns NOT_SHORTENABLE when the sources and paragraphs do not line up. PASS.
- **D43:** regenerate/formal/shorter use updateMany scoped by userId, return the fresh row, and the UI sets content, saved content and sources from the returned row after the AlertDialog confirm. PASS.
- **Migration:** SQL matches schema.prisma (5 optional columns plus the index `ColdEmail_userId_followUpAt_idx`). See item 2 for pre-migration behavior.
- **Retirement (D41):** the 4 preview dirs are deleted. The `redirects()` in next.config.mjs run before middleware, so signed-out users get 308 then the sign-in redirect at the real route. No `tools/(resume|ats|cover-letter|cold-email)` references remain in src or scripts (only next.config.mjs). Interview and roadmap previews, the banner map and mock.ts are intact. The removed resume-page banner was only a link to the preview. Landing links to gated routes are fine (sign-in first).
- **ATS:** deleteATSScore uses deleteMany scoped by userId and returns `{error, code}`; the UI confirms via AlertDialog and updates history. candidateYears comes from User.experience. The purge note shows from resumePurged.
- **Dashboard:** dueFollowUps are scoped by userId, take 10, wrapped in try/catch, and have an empty state.
- Clerk auth is present on every new action.

## Done-when

1. Cover letter and cold email parity with sources: PASS
2. 4 old URLs redirect: PASS (config verified; build output has no /tools/{resume,ats,cover-letter,cold-email})
3. ATS delete and 90-day purge: PASS
4. Build passes and the 6 tools still routable: PASS (build only; no runtime click-through done)

## Fix round (d64f358 + 230bf43)

Lint 0 errors (1 pre-existing font warning), build passes, selfcheck-matching prints "all self-checks passed".

Resolved: #1 (greeting becomes "Hello,", closing becomes "Best regards," plus the user name only; body paragraphs keep the number rule; the prompt also forbids numbers there), #2 (LIST_SELECT of pre-Phase-5 columns, the list UI uses none of the new fields, getColdEmail returns MIGRATION_PENDING on P2022, generate/update/follow-up map it, the detail page shows the message), #3 (the regex rejects `, ; < > " ( )` and a second @; mailto holds only the one validated address), #4 (whitespace-collapsed and capped at 80), #6 (publicScore uses isPastResumeTextLimit), #7 (sources.tone stored, regenerate falls back to it, "More formal" sends only formality, dropdown preselected), #8 (tip from COLD_EMAIL_WORDS, label "Draft ready to review").

NOT resolved: #5.

### MUST-FIX
| Severity | File:line | Owner | Problem | Fix |
|---|---|---|---|---|
| must-fix | src/actions/ColdEmail.js updateColdEmail (~lines 270-280) | BACKEND | updateColdEmail writes the subject but never touches `sources.subject`. After the user saves an edited subject and reloads, `fields.subject === subject` holds again, so ColdEmailPreview.jsx:260 shows "Subject based on" with the old AI subject's sources for text the AI did not write. | When a supplied `subject` differs from the stored one, clear `sources.subject` (or set it to a user-edited marker) in the same update, owner-scoped (read the row by id and userId, then updateMany). |

## Fix round 2 (d5057bd)

Lint 0 errors (1 pre-existing font warning), build passes.

RESOLVED: the earlier must-fix (stale `sources.subject` after an edited subject). In updateColdEmail, when `subject` is supplied the row is read with findFirst scoped by id and userId (NOT_FOUND if missing or not owned). If the trimmed subject differs from the stored one (including cleared), `sources.subject` is dropped and all other keys are kept. An unchanged subject keeps it. updateMany stays scoped by id and userId. Updates without `subject` skip the new block. After save and reload, `sources.subject` is gone, so ColdEmailPreview.jsx:261 renders no chips.

### MUST-FIX
None.
