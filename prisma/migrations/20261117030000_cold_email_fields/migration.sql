-- AlterTable
ALTER TABLE "ColdEmail" ADD COLUMN     "followUpAt" TIMESTAMP(3),
ADD COLUMN     "recipientEmail" TEXT,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "recipientRole" TEXT,
ADD COLUMN     "subject" TEXT;

-- CreateIndex
CREATE INDEX "ColdEmail_userId_followUpAt_idx" ON "ColdEmail"("userId", "followUpAt");
