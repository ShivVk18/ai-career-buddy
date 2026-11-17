# QUESTIONS for the owner

Decisions only you can make before improvement work. Each has a recommended option (first). Already decided in BUILD_PLAN.md and AI-PROVIDERS.md, so not asked again: all AI through one `runAI()`, multi-provider via env routes (`fast`/`write`), BYOK with AES-256-GCM, `AiUsage` logging, zod for structured output, Clerk plus zod on every route, `userId` scoping, never auto-send, new migrations only, pixel HTML as the only visual reference, the six tools must keep working.

## Q1. Mock data (dashboard, `/tools/*`, `src/lib/mock.ts`)
- A) Wire the dashboard and tools to real actions, then delete `mock.ts` (Recommended)
- B) Keep `/tools/*` as labelled demos on mock data, wire only the dashboard
- C) Delete `/tools/*` and point the sidebar at the real routes
- Why: the brief says nothing invented, and real features already exist at `/resume`, `/cover-letter` and others.

## Q2. Pip chat (`/api/chat`)
- A) Replace the keyword mock with calls to the real actions, behind Clerk and zod (Recommended)
- B) Keep the mock but require sign-in and label it "demo"
- C) Hide chat from navigation until the AI layer exists
- Why: the route currently returns fabricated career claims and has no auth (`src/app/api/chat/route.js:6`).

## Q3. Route protection
- A) Restore the middleware guard on all `(main)` routes plus `/chat` and `/api/chat` (Recommended)
- B) Guard only `/onboarding` and data-bearing routes, accept signed-out shells
- C) Public landing and tools demos, everything else signed-in only (same as A without tools)
- Why: the uncommitted diff removed guards (`src/middleware.js:4-7`), and the layout no longer gates on onboarding.

## Q4. Canonical feature routes
- A) Real routes (`/resume`, `/interview`, `/cover-letter`, `/cold-email`, `/roadmap`, `/resume-parser`) are canonical, and the sidebar links to them (Recommended)
- B) `/tools/*` becomes canonical and gets rewired to the actions
- C) Keep both surfaces indefinitely
- Why: two parallel UIs for each tool double the maintenance, and the sidebar currently links to the mocks (`AppSidebar.jsx:41-46`).

## Q5. BYOK timing
- A) Defer BYOK. Ship `runAI` on server-held env keys first (Recommended)
- B) Ship BYOK (`UserApiKey`) in the first milestone, as AI-PROVIDERS.md specifies
- C) Drop BYOK. Keep multi-provider via env only
- Why: BYOK adds key encryption and a new attack surface before the current auth and logging gaps are fixed.

## Q6. LangChain and LangGraph scope
- A) Use LangChain chat models inside `runAI` now, and add LangGraph only when a multi-step agent is needed (Recommended)
- B) Adopt LangGraph for chat now
- C) Use the `@google/genai` and `openai` SDKs directly and drop LangChain from the plan
- Why: neither is installed, and BUILD_PLAN lists both as stack. Confirm whether that is still the plan.

## Q7. Industry insights source
- A) Generate insights through `runAI` with a source-citation field, cache them with a real `nextUpdate` (Recommended)
- B) Hand-curate a static dataset per industry and maintain it yourself
- C) Drop the feature until a real data source exists
- Why: `User.js:26-43` creates placeholder zero rows, and the generator has no callers.

## Q8. AI output validation and citations
- A) Validate every AI output with zod and reject or retry on failure. Require a `source` for each resume or ATS claim (Recommended)
- B) Validate with zod only, no citation requirement yet
- C) Keep raw text output for now
- Why: BUILD_PLAN promises "every generated line cites a source", and no current prompt or schema enforces it.

## Q9. Quiz scoring trust
- A) Persist questions server-side and compute the score from stored answers (Recommended)
- B) Keep client-supplied score and answers, add shape validation only
- C) Accept client scores for now, since there is a single user
- Why: `Interview.js:139-155` trusts the client's questions, correct answers and score.

## Q10. Deployment target
- A) Self-host with Docker, fixing the compose port, adding a migrate step and excluding `.env` (Recommended)
- B) Vercel, removing the Docker files
- C) Both, with Docker for local runs only
- Why: the repo is already containerized with `output: "standalone"` (`next.config.mjs:3`), but the Docker setup does not run as written.
