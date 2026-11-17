# DEPLOY runbook (D52)

Written for the owner. The agent never applies migrations and never connects to a database. The Vercel build
(`vercel.json`: `npx prisma generate && npm run build`) never runs migrations and needs no database access.

## 1. Migration order

Folders sort by name; `prisma migrate deploy` applies the pending ones in this order:

| # | Folder | Adds |
|---|---|---|
| 1 | `20261117000000_ai_usage` | `AiUsage` table (the daily cap reads it) |
| 2 | `20261117010000_quiz_session` | `QuizSession` |
| 3 | `20261117020000_phase3_sources` | `sources` / `evidence` columns |
| 4 | `20261117030000_cold_email_fields` | cold email recipient, subject, follow-up columns |
| 5 | `20261117040000_interview_answer` | `InterviewAnswer` (needs #2) |
| 6 | `20261117050000_ai_usage_action_id` | nullable `AiUsage.actionId` plus index `(userId, createdAt)` |
| 7 | `20261117060000_remove_industry_insight` | drops `User_industry_fkey` and the `IndustryInsight` table (placeholder rows only; `User.industry` values are kept) |

Folders 3 to 5 were renamed from `20261118000000_phase3_sources`, `20261119000000_cold_email_fields`, `20261120000000_interview_answer`
(same SQL, same order; the old names were dated in the future). If a database already recorded the old names in
`_prisma_migrations`, `migrate status` will show them as missing locally and the new names as pending; see "Drift" below.
Migrations 1 to 6 are additive (CREATE TABLE, ADD COLUMN, CREATE INDEX, DROP NOT NULL on `User.email`). Migration 7 is destructive: it drops the `IndustryInsight` table, which holds only placeholder rows created by the old `updateUser` (no real data), so the backup in step 1 matters. `User.industry` values stay.

## 2. Steps (production)

1. Back up the database first (provider snapshot or `pg_dump`). Do not continue without a restorable backup.
2. Run `npx prisma migrate status` against production (read-only). Read the output:
   - Only some of the six listed as "not yet applied": go to step 4.
   - Failed or "migration ... was modified", or a table or column already exists: see "Drift".
3. Drift only: for each migration whose changes are already in the database but not recorded, run
   `npx prisma migrate resolve --applied <folder_name>` (use the NEW folder names above). Use `resolve` only for drift,
   never to skip a migration whose SQL has not run. If the database recorded one of the old future-dated names, its SQL is
   already applied: mark the matching new folder applied the same way and leave the old row alone.
4. Apply by hand: `npx prisma migrate deploy`. Never run it from the Vercel build.
5. Run `npx prisma migrate status` again; expect "Database schema is up to date".
6. Promote the deployment.

Never use `prisma migrate dev` or `prisma migrate reset` against production (they can drop data).

## 3. Rollback

- Code: promote the previous Vercel deployment. The new columns are nullable and unused by old code, so old code keeps working on the new schema.
- Data: there is no automatic down-migration. To undo migration #6 manually: `DROP INDEX "AiUsage_userId_createdAt_idx"; ALTER TABLE "AiUsage" DROP COLUMN "actionId";` (only after rolling the code back). For anything else restore the backup from step 1.
- Order matters: apply migrations BEFORE promoting code that needs them. Until #6 is applied, production AI calls are blocked (the cap fails closed when usage cannot be read, D33).

## 4. Environment checklist (set in the platform, never in the image or the repo)

Every name in `.env.example` must be set in production, except the optional ones:

- `DATABASE_URL` (production Postgres). `DATABASE_URL_DOCKER` only for the local Docker compose path.
- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`.
- AI: `GEMINI_API_KEYS` (comma separated) or `GEMINI_API_KEY`, `AI_ROUTE_FAST`, `AI_ROUTE_WRITE`.
- `AI_DEBUG` must be UNSET (prompt logging is off in production anyway; keep it empty).
- `AI_DAILY_LIMIT`: decide it. Unset = 50 actions per user per day (one action = one tailor, one ATS fix, one letter, and so on); `0` disables the cap. The cap is soft: concurrent actions started at limit-1 can overshoot slightly (check and log are not atomic).
- `ATS_FIX_SIGNING_SECRET`: at least 32 characters (`openssl rand -base64 48`). Without it, 1-click fixes return FIX_UNAVAILABLE in production.
- Sentry (all optional; with no DSN nothing loads and nothing is sent):
  - `SENTRY_DSN` (server) and `NEXT_PUBLIC_SENTRY_DSN` (browser; it is inlined at BUILD time, so set it before building).
  - `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`: only for source-map upload during the build. Unless all three are set the build does no Sentry work.
  - Request bodies, cookies, headers, user objects and resume, job description, answer, letter or email text, emails and Clerk ids are stripped before sending.

## 5. Docker path

`docker compose` builds the image (`Dockerfile`) and reads env from the compose env file. Unlike Vercel, the container
command runs `node node_modules/prisma/build/index.js migrate deploy && node server.js`, so pending migrations are applied
automatically when the container starts. Back up first, and run `migrate status` against that database before the first start.
`.env` is excluded from the image (`.dockerignore`).

## 6. Dependency audit (`npm audit --omit=dev`, 2026-11-17)

Removed (zero imports, grepped): `openai`, `resend`, `@upstash/qstash`, `html2pdf.js`, `@react-pdf/renderer`, `@tabler/core`,
`react-markdown`, `@clerk/themes`, `@radix-ui/react-label` (the label component uses the `radix-ui` package), `html2canvas`
(the app uses `html2canvas-pro`). Kept on purpose: `framer-motion` and `motion` (both imported by UI files; merging them is a
frontend change), `@langchain/core` and `@tsparticles/engine` (required peers of other packages).

Before (as reported at the time of the fix, not re-verifiable): 23 vulnerabilities (1 moderate, 18 high, 4 critical): `next`, `@clerk/*`, `jspdf`, `dompurify`, `sharp`, `postcss`,
`defu`, `js-cookie`, `fflate`, `deepmerge-ts`, `effect`, `picomatch`.

Action: `npm audit fix` (no `--force`). It first failed because `@clerk/nextjs` needs `react ~19.1.4`, so React was moved
from the pinned `19.1.0` to `19.1.10` (patch bump, same minor). After it: `next` 15.5.29, `@clerk/nextjs` 6.39.9,
`jspdf` 4.2.1, `prisma` 6.19.3 (same majors).

After: 12 vulnerabilities (1 moderate, 11 high), 0 critical. The rest need a major bump and were NOT applied (decision for the owner):

| Package | Why it is still flagged | Fix offered | Note |
|---|---|---|---|
| `postcss` (inside `next`) | XSS and source-map read in PostCSS stringify | `next@16` (major) | Build-time CSS processing of our own CSS; not reachable by users |
| `deepmerge-ts`, `effect`, `@prisma/config` | Prisma CLI tooling | `prisma@7` (major) | CLI only, not in the request path |
| `picomatch` (Sentry build tooling, rollup, vite) | ReDoS in glob matching | `@sentry/nextjs@8` (downgrade, breaking) | Build tooling; only runs on build |

Re-run `npm audit --omit=dev` after any dependency change.
