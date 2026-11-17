-- CreateEnum
CREATE TYPE "JobSearchStage" AS ENUM ('JUST_STARTING', 'APPLYING', 'INTERVIEWING');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'CLOSED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "jobSearchStage" "JobSearchStage",
ADD COLUMN     "targetRole" TEXT;

-- AlterTable
ALTER TABLE "ResumeVersion" ADD COLUMN     "jobId" TEXT;

-- AlterTable
ALTER TABLE "CoverLetter" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "jobId" TEXT;

-- AlterTable
ALTER TABLE "ATSScore" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "jobId" TEXT;

-- AlterTable
ALTER TABLE "ColdEmail" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "jobId" TEXT;

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT,
    "jdText" TEXT NOT NULL,
    "company" TEXT,
    "title" TEXT,
    "location" TEXT,
    "sources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SAVED',
    "appliedAt" TIMESTAMP(3),
    "interviewAt" TIMESTAMP(3),
    "nextActionAt" TIMESTAMP(3),
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "closedReason" TEXT,
    "closedAt" TIMESTAMP(3),
    "gapTasksAddedAt" TIMESTAMP(3),
    "prepSessionId" TEXT,
    "pipeline" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_userId_deletedAt_idx" ON "Job"("userId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_key" ON "Application"("jobId");

-- CreateIndex
CREATE INDEX "Application_userId_status_deletedAt_idx" ON "Application"("userId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Application_userId_nextActionAt_idx" ON "Application"("userId", "nextActionAt");

-- CreateIndex
CREATE INDEX "ResumeVersion_jobId_idx" ON "ResumeVersion"("jobId");

-- CreateIndex
CREATE INDEX "CoverLetter_userId_deletedAt_idx" ON "CoverLetter"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "CoverLetter_jobId_idx" ON "CoverLetter"("jobId");

-- CreateIndex
CREATE INDEX "ATSScore_userId_deletedAt_idx" ON "ATSScore"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "ATSScore_jobId_idx" ON "ATSScore"("jobId");

-- CreateIndex
CREATE INDEX "ColdEmail_userId_deletedAt_idx" ON "ColdEmail"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "ColdEmail_jobId_idx" ON "ColdEmail"("jobId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverLetter" ADD CONSTRAINT "CoverLetter_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ATSScore" ADD CONSTRAINT "ATSScore_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColdEmail" ADD CONSTRAINT "ColdEmail_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

