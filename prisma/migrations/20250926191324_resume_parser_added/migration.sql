/*
  Warnings:

  - You are about to drop the column `colorScheme` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `fontFamily` on the `Resume` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Resume" DROP COLUMN "colorScheme",
DROP COLUMN "fontFamily";

-- CreateTable
CREATE TABLE "public"."ATSScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "atsScore" DOUBLE PRECISION NOT NULL,
    "matchPercentage" DOUBLE PRECISION,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "improvements" TEXT[],
    "relevantSkills" TEXT[],
    "missingSkills" TEXT[],
    "recommendations" JSONB[],
    "finalSummary" TEXT NOT NULL,
    "analyzedBy" TEXT,
    "jobTitle" TEXT,
    "companyName" TEXT,
    "jobDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ATSScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ATSScore_userId_idx" ON "public"."ATSScore"("userId");

-- AddForeignKey
ALTER TABLE "public"."ATSScore" ADD CONSTRAINT "ATSScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
