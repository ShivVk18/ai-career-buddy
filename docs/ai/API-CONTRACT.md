# API Contract (Phase 2)

Source of truth for frontend and backend. Branch `phase-2`. Decisions: D18-D21 in DECISIONS.md.

Conventions
- All server actions run on the server, require a signed-in Clerk user, and scope every query by the user's DB id. Unauthenticated: they throw `Error("Unauthorized")` (actions) or return HTTP 401 (routes).
- Dates returned by the new actions (`getDashboardData`, `submitQuiz`, `/api/chat`) are ISO-8601 strings, never `Date` objects.
- Nothing here is invented by AI except the chat `reply` text and the quiz content. Every record shown (targets, tasks, scores, cards) comes from the user's own rows.
- Missing data is an empty array, `null` or `0`, never a sample value.

---

## 1. `getDashboardData()`  (`src/actions/Dashboard.js`, server action)

Input: none. No AI calls.

Returns:

```ts
{
  firstName: string | null,          // Clerk firstName; null if unset (UI must not invent a name)
  avgAtsScore: number | null,        // rounded integer 0-100; null when the user has no ATS scores
  counts: {
    atsScores: number,
    coverLetters: number,
    coldEmails: number,
    roadmaps: number,                // active roadmaps (status "active")
    assessments: number,
    hasResume: boolean
  },
  targets: Target[],                 // max 10, newest activity first; [] for a new user
  totalTargets: number,              // before the 10 cap
  nextTasks: NextTask[]              // max 5; [] if no active roadmap or all steps done
}

Target = {
  key: string,                       // lowercased "company|role", stable for React keys
  company: string,                   // original casing of the most recent doc; "" if unknown
  role: string,                      // "" if unknown
  lastActivityAt: string,            // ISO date of newest document for this pair
  ats:         { id: string, score: number, href: "/resume-parser" } | null,        // latest ATS score for the pair
  coverLetter: { id: string, href: string } | null,   // href = "/cover-letter/<id>"
  coldEmail:   { id: string, href: string } | null    // href = "/cold-email/<id>"
}

NextTask = {
  roadmapId: string,
  roadmapTitle: string,              // "<targetRole>" of that roadmap
  stepId: number,
  title: string,
  category: string,                  // "" if absent
  priority: string,                  // "" if absent
  href: string                       // "/roadmap/<roadmapId>"
}
```

Dedup rule: a target is a (company, role) pair compared case-insensitively and trimmed. Documents with both company and role empty are skipped. ATS rows may have null company/role; they are matched as "".

Empty-state example (new user):
`{ firstName: "Sam", avgAtsScore: null, counts: {atsScores:0,coverLetters:0,coldEmails:0,roadmaps:0,assessments:0,hasResume:false}, targets: [], totalTargets: 0, nextTasks: [] }`

Errors: throws `Error("Unauthorized")` when signed out. If the DB user row does not exist it returns the empty-state object (not an error). Other failures throw `Error("Failed to load dashboard")`.

---

## 2. Interview quiz (`src/actions/Interview.js`, server actions)

### `generateQuiz(skills)`
- Input: `skills: string[]` (max 20 items, each trimmed, 1-100 chars; empty strings are dropped). Invalid input throws `Error("Invalid skills")`.
- Returns:

```ts
{
  quizId: string,                    // QuizSession id
  questions: { question: string, options: string[] }[]   // 5-10 items; NO correctAnswer, NO explanation
}
```

- Breaking change: it used to return the bare `Question[]` array including `correctAnswer`/`explanation`.
- Errors (thrown `Error` with these messages): `"Unauthorized"`, `"Failed to generate quiz. Please try again."`. If the daily cap is hit the message is `"AI_LIMIT: Daily AI limit reached"` (the message starts with `AI_LIMIT`; see section 4).

### `submitQuiz(quizId, answers)`
- Input: `quizId: string` (non-empty, max 64); `answers: (string | null)[]`, one entry per question in order, each the exact option text chosen, or `null` for unanswered. Length must equal the number of questions. Unanswered or unknown text counts as wrong.
- Server loads the session by `quizId` AND the user's id (foreign or unknown ids behave as not found), rejects an already-submitted session, computes the score, writes the `Assessment` (same shape as before: `quizScore`, `questions` Json[], `category: "Technical"`, `improvementTip`), and marks the session submitted (atomically, so a double submit cannot score twice).
- Returns:

```ts
{
  assessmentId: string,
  score: number,                     // 0-100 float, correct / total * 100
  correctCount: number,
  total: number,
  improvementTip: string | null,     // null if all correct or the tip AI call failed
  results: {
    question: string,
    options: string[],
    userAnswer: string | null,
    correctAnswer: string,
    isCorrect: boolean,
    explanation: string
  }[]
}
```

- Errors (thrown `Error`, `message` is one of): `"Unauthorized"`, `"Invalid quiz submission"` (zod/length failure), `"Quiz not found"` (unknown or not yours), `"Quiz already submitted"`, `"Failed to save quiz result"`.
- A tip failure (including `AI_LIMIT`) never fails the submit; the tip is just `null`.

### `saveQuizResult(questions, answers, score)`  - DEPRECATED
Kept exported so the build stays green until the Quiz UI switches (task 9). It now ignores its arguments and always throws `Error("saveQuizResult is removed: use submitQuiz(quizId, answers)")`. Nothing is written. The only caller is `interview/_components/Quiz.jsx` (task 9 replaces it).

### Unchanged
- `getAssessments()`: same as before.
- `getLatestQuiz()`: same as before. It returns the questions of the latest saved `Assessment` (already-submitted results, with `answer`, `userAnswer`, `isCorrect`, `explanation`), not an unsubmitted session. It never leaks an active quiz's answers.
- Assessment `questions[]` entry shape stays `{ question, answer, userAnswer, isCorrect, explanation }`.

---

## 3. `POST /api/chat`  (`src/app/api/chat/route.js`)

Read-only, grounded in the signed-in user's records. It writes nothing except `AiUsage` rows (via `runAI`). Runtime: nodejs.

### Request
`Content-Type: application/json`

```json
{ "message": "What's my latest ATS score?" }
```

- `message`: string, trimmed, 1-4000 chars (required; empty is now a 400). Extra fields are ignored.

### Pre-stream errors (plain JSON, not SSE)
| Status | Body | When |
|---|---|---|
| 401 | `{ "error": "Unauthorized", "code": "UNAUTHORIZED" }` | no Clerk user |
| 400 | `{ "error": "<message>", "code": "BAD_REQUEST" }` | invalid JSON or invalid `message` |
| 500 | `{ "error": "Failed to process chat", "code": "INTERNAL" }` | failure before the stream starts |

### Response
`200`, `Content-Type: text/event-stream`. Each event is one line `data: <json>\n\n`. Every JSON has a `type`.

Events, in order of occurrence:

1. `step` (1-3 times): `{"type":"step","step":"detective"|"thinking"|"wizard"|"headphones"|"coffee","text":"reading your records..."}`
   - The server emits `detective` first ("reading your records...") and `thinking` before the AI call, and `coffee` last on success. `wizard` and `headphones` are no longer emitted but stay valid values.
2. `text` (exactly once on success): `{"type":"text","content":"You have one ATS score: 78/100 for Frontend Engineer at Acme."}`
   - `content` is the full reply (not token-by-token), plain text, may contain newlines.
3. `tool_result` (0-3 times, after `text`): `{"type":"tool_result","tool":"<cardType>","data":{...}}` (card shapes below).
4. `done`: `{"type":"done"}` is the last event on success.

Error: `{"type":"error","code":"AI_LIMIT","message":"You've reached today's AI limit. Try again tomorrow."}`
- Sent instead of `text`/`tool_result`/`done`. It is terminal: the stream closes right after it, with no `done`. The client must treat `error` and `done` both as end of stream.
- `message` is user-safe and already friendly. The UI should special-case `code === "AI_LIMIT"`.
- `tool_call` is removed (it was ignored by the client).

Error codes in the `error` event:
| code | Meaning |
|---|---|
| `AI_LIMIT` | Per-user daily AI cap reached (section 4) |
| `AI_UNAVAILABLE` | All providers failed or rate-limited |
| `AI_BAD_OUTPUT` | Model output could not be validated |
| `AI_CONFIG` | AI is not configured on the server |
| `AI_FAILED` | Other AI failure |
| `INTERNAL` | Anything else (for example the DB failed while building context) |

Example (user with one ATS score):

```
data: {"type":"step","step":"detective","text":"reading your records..."}

data: {"type":"step","step":"thinking","text":"putting an answer together..."}

data: {"type":"text","content":"Your latest ATS score is 78/100 for Frontend Engineer at Acme."}

data: {"type":"tool_result","tool":"ats_score","data":{"recordId":"clx1","score":78,"matchPercentage":71,"company":"Acme","role":"Frontend Engineer","summary":"Strong React experience; missing testing keywords.","createdAt":"2026-11-10T09:12:00.000Z","href":"/resume-parser"}}

data: {"type":"step","step":"coffee","text":"all set! what would you like to review next?"}

data: {"type":"done"}
```

If the DB user row does not exist yet, the stream is `step`, `text` ("I can't find your profile yet. Please finish onboarding first."), `done`.

Example (new user): one `text` ("You don't have any ATS scores yet. Run your resume through the ATS checker first."), no `tool_result`, then `done`.

### Cards (`tool_result.tool` + `data`)
Server-built. The model only proposes `{type, recordId}` pairs. The server loads each record by id AND user id; unknown, foreign or wrong-type ids are silently dropped; duplicates are dropped; max 3 cards. Strings come from the DB verbatim (summaries are cut to 300 chars). Every `data` has `recordId` (string), `createdAt` (ISO string) and `href` (the real route to open it; never `/tools/*`).

| `tool` | `data` | `href` |
|---|---|---|
| `ats_score` | `{ recordId, score: number, matchPercentage: number\|null, company: string\|null, role: string\|null, summary: string, createdAt, href }` | `/resume-parser` (no detail route exists) |
| `cover_letter` | `{ recordId, company: string, role: string, status: string, createdAt, href }` | `/cover-letter/<recordId>` |
| `cold_email` | `{ recordId, company: string, role: string, status: string, createdAt, href }` | `/cold-email/<recordId>` |
| `roadmap` | `{ recordId, currentRole: string, targetRole: string, progress: number (0-100), completedSteps: number, totalSteps: number, nextSteps: { id: number, title: string }[] (max 3, incomplete only), createdAt, href }` | `/roadmap/<recordId>` |
| `assessment` | `{ recordId, score: number (0-100), category: string, improvementTip: string\|null, createdAt, href }` | `/interview` |

Removed card types: `resume_edit`, `interview_question`, `roadmap_task` (they depended on invented data). The client should render unknown `tool` values as nothing.

Grounding: the model gets only the user's profile (industry, skills, experience, bio), latest 3 ATS scores, active roadmaps with next steps, latest 3 cover letters and cold emails (company, role, status only; no body), and the latest assessment score. If something is not in that context it says so. It never writes to the DB.

---

## 4. Daily AI cap and the `AI_LIMIT` error

- Env `AI_DAILY_LIMIT` (positive integer). Unset, empty or invalid: no cap.
- `runAI` (when it has a `userId`) counts that user's `AiUsage` rows with `createdAt` since 00:00 UTC today. Every attempt, including failed ones, is a row. If `count >= AI_DAILY_LIMIT` it throws `AIError` with `code = "AI_LIMIT"` and message `"Daily AI limit reached"` before any provider call.
- If the `AiUsage` table is missing (migration not applied) or the count fails, the cap is skipped (fail open) with one console warning per process.
- The count is checked once per `runAI` call. A call that retries providers still counts one attempt per provider try.
- Surfacing it:
  - `/api/chat`: SSE `error` event with `code: "AI_LIMIT"` (section 3).
  - Server actions that use AI (`generateQuiz`, `generateCoverLetter`, `generateColdEmail`, `generateCareerRoadmap`, `createATSAnalysis`, `improveWithAI`, `generateProgressRecommendations`): Next.js hides thrown messages in production for uncaught errors, so the existing catch blocks in those actions keep their current generic messages. Only `generateQuiz` is guaranteed to carry the `AI_LIMIT` prefix in its thrown message (`"AI_LIMIT: Daily AI limit reached"`). For the other actions, the UI will see their existing failure message; improving this is out of scope for Phase 2.

Frontend handling: on `AI_LIMIT` show a friendly "daily limit reached, try again tomorrow" message, not a generic failure.

---

## 5. Other actions
Unchanged. Existing actions keep their signatures and return shapes.
