-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ATSScore" ADD COLUMN "evidence" JSONB;

-- AlterTable
ALTER TABLE "CoverLetter" ADD COLUMN "sources" JSONB;

-- AlterTable
ALTER TABLE "ColdEmail" ADD COLUMN "sources" JSONB;
