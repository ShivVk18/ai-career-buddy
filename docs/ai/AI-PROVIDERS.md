# AI Providers — Spec

Owner: backend agent. Status: not started.

## Goal
Support multiple AI providers and multiple API keys, not only Gemini.

## Providers
| id | Package | Notes |
|---|---|---|
| `google` | `@langchain/google-genai` | Gemini |
| `openai` | `@langchain/openai` | |
| `anthropic` | `@langchain/anthropic` | |
| `groq` | `@langchain/groq` | |
| `openrouter` | `@langchain/openai` (`ChatOpenAI`) | `baseURL: https://openrouter.ai/api/v1` |

## Environment
One var per provider, holding comma-separated keys:

```
GEMINI_API_KEYS=key1,key2
OPENAI_API_KEYS=
ANTHROPIC_API_KEYS=
GROQ_API_KEYS=
OPENROUTER_API_KEYS=
```

Routes per task, in fallback order, format `provider:model`:

```
AI_ROUTE_FAST=groq:<model>,google:<model>,openrouter:<model>
AI_ROUTE_WRITE=anthropic:<model>,openai:<model>,google:<model>
```

- Model names live **only** in env — never hardcoded.
- Add all of these (plus `KEY_ENCRYPTION_SECRET`, `EMBED_PROVIDER`, `EMBED_MODEL`) to `.env.example` with placeholders. **Never edit `.env`.**

## Files
- `src/lib/ai/providers.js` — factory per provider: `(provider, model, apiKey, { temperature }) => ChatModel`.
- `src/lib/ai/keys.js` — round-robin key pool per provider; a key that hits a rate limit gets a 60s cooldown and is skipped until it expires.
- `src/lib/ai/index.js` — exports `runAI(task, (model) => ..., { userId })`:
  1. Read the route for `task` (`AI_ROUTE_<TASK>`).
  2. For each `provider:model` entry in order:
     - Use the user's own saved key for that provider first, if any; otherwise the next pool key.
     - Build the model with the task's temperature and call the callback with it.
     - On 429 / 5xx / timeout / quota errors → cool down that key, try the next key or next entry.
     - On any other error → throw immediately.
  3. If every entry fails, throw one clear error listing each provider tried and why it failed (no keys in the message).

## Tasks
| Task | Temperature | Used for |
|---|---|---|
| `fast` | 0 | parsing, scoring, classifying |
| `write` | ~0.4 | resumes, cover letters, emails |

Tasks are defined in one config object so adding a task = adding an entry + an `AI_ROUTE_<TASK>` env var.

## Logging
Prisma model `AiUsage`: `userId`, `task`, `provider`, `model`, `ok`, `latencyMs`, `createdAt`.
One row per attempt. Never log keys, and never log prompts or outputs containing personal data.

## Bring-your-own-key
- Prisma model `UserApiKey`: `userId`, `provider`, `cipher`, `iv`, `tag`, timestamps; unique on `(userId, provider)`.
- Encryption: AES-256-GCM via `node:crypto`, key from `KEY_ENCRYPTION_SECRET` (32 bytes, base64). Fail fast at startup of the feature if the secret is missing or the wrong length.
- API routes (Clerk auth required, zod-validated, user can only touch their own keys):
  - save (upsert) a key for a provider
  - test a key (one tiny call)
  - list keys — provider + last 4 chars only, never the full key
  - delete a key
- Frontend: settings page **"AI keys"** to add, test, list and delete keys (frontend agent; contract in `API-CONTRACT.md`).

## Embeddings
- One model only: `EMBED_PROVIDER` + `EMBED_MODEL` env. No fallback.
- Store the embedding model name alongside every stored vector so mismatches can be detected.

## Migration of existing code
- Replace every direct Gemini call (see "How AI is called now" in `CONTEXT.md`) with `runAI()`.
- Existing features must behave the same (same inputs, same output shape).
- Validate structured outputs with zod.

## Test
A script (e.g. `scripts/test-ai-providers.js`) that, for every configured provider, calls `runAI("fast")` with a simple zod schema and prints `ok` / `fail` (with a short reason) per provider. Never print keys.
