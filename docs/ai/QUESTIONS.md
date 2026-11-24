# QUESTIONS: decisions only the owner can make

Scout pass, 2026-11-23, branch `redesign-happy-flow`. Options are ordered; the first one is the scout's recommendation.

1. **Who runs the four bots after the user leaves the job page?** Today the browser drives `runNextStep` and stops on unmount (`JobView.jsx:45-79`).
   - (Recommended) A server-side runner (Inngest, or a DB-polled cron route) finishes CHECKER → TAILOR → WRITER → CONNECTOR, and the UI reads progress from `Application.pipeline`.
   - Keep the browser loop and change the copy to "keep this tab open".
   - Run the bots inline on intake, with no further background work.

2. **How does "we'll notify you" reach the user?**
   - (Recommended) In-app only: the needs-you badge and a notification list, no email yet.
   - Email as well. This needs a new provider (Resend was removed in Phase 7).
   - Browser push as well. This needs a service worker and permission prompts.

3. **What can an interview question be built from?** Practice is limited to job lines and profile skills (`Practice.js:113-127`, D28). The target scene uses the user's own project.
   - (Recommended) Job description, profile skills, and resume projects, each with a source id that the rubric can quote.
   - Job description and skills only (current).
   - Projects only, which drops the job-specific part.

4. **After a paste on home, where does the new job appear?** Today the app navigates to `/jobs/[id]` (`DashboardView.jsx:251`).
   - (Recommended) A job card with chips appears in place on home, and the bot checklist opens from it.
   - Navigate straight to the job page (current).
   - Open a side sheet over home, and keep the URL unchanged.

5. **Onboarding shape.** Today the flow has five phases with separate screens (`OnboardingFlow.jsx:80`).
   - (Recommended) One screen: drop zone, editable chips, profile ring, one next step, and two taps for role and stage.
   - Keep the phases, but make the chips step the main screen.
   - Keep the flow as it is.

6. **Offer step scope.** Today there is only an OFFER status and a dusk scene (`StatusActions.jsx:118-153`, `DashboardView.jsx:163-167`).
   - (Recommended) Ship an offer card now, and add compare and negotiation-draft in a second pass.
   - Build offer card, compare and negotiation draft in this redesign.
   - Drop the offer scene from the product.

7. **Where do the six standalone tools live?**
   - (Recommended) Keep all six routes, reachable from ⌘K (`CommandMenu.jsx:22-34`), the sidebar, and the job page.
   - Move them under the job page only, so that a job is the entry point.
   - Keep the six tool cards on home as they are today (`DashboardView.jsx:171-228`).

8. **Undo for "accept all" in the tracked-change review.** Accept currently saves a version with no undo.
   - (Recommended) A 5-second undo toast that restores the previous resume version (matches D60 and the existing `NeedsYouQueue.jsx:125` pattern).
   - A confirm dialog before saving.
   - No undo; rely on resume versions.

9. **Voice input and the waveform.** Voice today is browser speech recognition only (`use-speech-to-text.js`).
   - (Recommended) Keep browser recognition, and draw a waveform from the microphone level for feedback only.
   - Record audio and transcribe on the server. This needs a new provider and a privacy review.
   - Text answers only, and remove the mic button.

10. **Bot team status on home.** Today the four steps only show on the job page (`PipelineProgress.jsx`).
    - (Recommended) A compact four-step row on home for the most recent active application, linking to the job page.
    - Keep bot status on the job page only.
    - Show bot status on both, with the full checklist on home.
