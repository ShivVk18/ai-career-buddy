/*
  Warnings:

  - A unique constraint covering the columns `[templateKey]` on the table `ResumeTemplate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `colorScheme` to the `ResumeTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `templateKey` to the `ResumeTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Resume" ADD COLUMN     "contactInfo" JSONB,
ADD COLUMN     "education" JSONB[],
ADD COLUMN     "experience" JSONB[],
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "projects" JSONB[],
ADD COLUMN     "skills" TEXT,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "public"."ResumeTemplate" ADD COLUMN     "colorScheme" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "requiresPhoto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "templateKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ResumeTemplate_templateKey_key" ON "public"."ResumeTemplate"("templateKey");

-- CreateIndex
CREATE INDEX "ResumeTemplate_templateKey_idx" ON "public"."ResumeTemplate"("templateKey");
