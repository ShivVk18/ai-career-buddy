# Review: Phase 8 (D54 remove industry insights)

Phase 7 review: see `git show 4e74284:docs/ai/REVIEW.md`.

Summary: pass, 0 must-fix. lint 0 errors (1 pre-existing font warning), build OK, tests 83/83, `prisma validate` OK.

| Severity | File:line | Problem | Fix |
|---|---|---|---|
| nit | prisma/migrations/20261117060000_remove_industry_insight/migration.sql | Not idempotent (plain DROP CONSTRAINT/TABLE); fails if re-run or if DB already drifted. | Acceptable for Prisma; owner follows DEPLOY.md drift steps. |
| nit | src/data/features.js:8 | "personalized career advice and insights" is generic and not an industry/market/salary promise. | None needed. |

Checks:
- Migration: drops exactly `"public"."User_industry_fkey"` (name/casing match 20250909184157 line 301, no later migration touches it), then `"public"."IndustryInsight"` (its unique and idx indexes go with the table). No column/table otherwise touched; `User.industry` data kept. Sorts after `20261117050000_ai_usage_action_id`.
- Schema: no IndustryInsight model or relation; `User.industry String?` plain (schema.prisma:17). Migrations replayed should equal schema, so no drift expected (reasoned from files only).
- Dangling references: none in src, seeder, scripts, schema, tests. updateUser still uses zod (`industry` 1-100) and the transaction; saves industry (User.js:50); test mock updated.
- Copy: FAQ entries removed/reworded accurately; no remaining industry/market/salary insight promises in src/data, page.js, landingPage.
- Docs: DEPLOY.md lists migration #7 with backup warning; API-CONTRACT updated (line 612).
