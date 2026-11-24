# Review: redesign-happy-flow vs main

Lint pass, build pass, tests pass (38 files, 273 tests). No must-fix issues.

| Severity | File:line | Problem | Fix |
|---|---|---|---|
| should-fix | src/middleware.js:5-19 | /offers and /review are not in isProtectedRoute. The gated layout swallows "Unauthorized", so signed-out users get the page shell (actions still throw, no data leaks). | Add "/offers(.*)" and "/review(.*)" to the matcher. |
| should-fix | src/app/globals.css:93 | --faint #A8A6AE on white is about 2.4:1 and is used for text-faint across real screens. | Darken to about #6E6E82 (as the paper block already does). |
| should-fix | src/app/page.js:74,161; OnboardingFlow.jsx:53,537; BotStepList.jsx:10; AppSidebar.jsx:97; PracticeScreen.jsx:366 | text-white on bg-brand #2F9E77 is about 3.3:1 and fails for small text. | Use bg-brand-ink with white text (about 5.9:1) or dark text on brand. |
| should-fix | ColdEmailPreview.jsx:143,157; CoverLetterPreview.jsx:96,110 | Toasts use emoji and exclamation marks ("copied! sparkles"), against the copy rules. | Plain lowercase "copied" and "downloaded". |
| nice | src/components/MicroAnimation.jsx:118 | Emoji and invented progress numbers. It looks unused. | Delete it if unused. |
| nice | vercel.json | No crons entry for /api/cron/pipeline. | Add it, or document that an external scheduler calls it. |
| nice | src/components/SideBar.jsx | Possible dead legacy sidebar next to shared/AppSidebar.jsx. | Remove it if unreferenced. |

## Checks
1. Lint, build, tests: pass.
2. Six tools: pass. Routes exist under (gated) and are in the sidebar and CommandMenu. No action exports were removed except the old quiz saveQuizResult and getLatestQuiz (replaced by Practice) and seedResumeTemplates (moved to a script).
3. Lost features: no unreplaced removals found. The old interview Quiz and StatsCard moved to practice and mock.
4. Forms: matches the audit table. All flow steps have real routes: onboarding, dashboard, applications, needs-you, review/[draftId], interview, offers, jobs/[id].
5. Accessibility: focus-visible, reduced-motion, dark theme and aria labels are present. Contrast issues are listed above.
6. Backend: pass. runAsUser is AsyncLocalStorage set only in server code (runner.js, Intake.js), so client input can't reach it. The cron route uses a timing-safe CRON_SECRET check and fails closed, and middleware does not protect /api/cron. Undo tokens are re-checked by owner-scoped actions. All /dev pages call notFound() in production.
7. Copy: pass except the toast emoji above. StepCaption appears only on the landing page, not on app routes.
