-- AlterTable: one id per user action (D50). Nullable so existing rows stay valid (counted individually).
ALTER TABLE "AiUsage" ADD COLUMN "actionId" TEXT;

-- CreateIndex: serves the daily cap query (filter by user and day, then distinct action).
CREATE INDEX "AiUsage_userId_createdAt_idx" ON "AiUsage"("userId", "createdAt");
