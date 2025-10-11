/*
  Warnings:

  - Changed the type of `steps` on the `CareerPath` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `milestones` on the `CareerPath` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `resources` on the `CareerPath` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `timeline` on the `CareerPath` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "public"."CareerPath_userId_status_idx";

-- AlterTable
ALTER TABLE "public"."CareerPath" DROP COLUMN "steps",
ADD COLUMN     "steps" JSONB NOT NULL,
DROP COLUMN "milestones",
ADD COLUMN     "milestones" JSONB NOT NULL,
DROP COLUMN "resources",
ADD COLUMN     "resources" JSONB NOT NULL,
DROP COLUMN "timeline",
ADD COLUMN     "timeline" JSONB NOT NULL;
