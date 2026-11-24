-- Fail loudly (and change nothing) if two users would collide once emails are compared case-insensitively.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "User" WHERE "email" IS NOT NULL
    GROUP BY lower(btrim("email")) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'auth_credentials: duplicate User emails (case-insensitive). Resolve them manually before migrating; no data was changed.';
  END IF;
END $$;

-- Sign-in looks emails up lowercased, so normalise the stored ones (the unique index then enforces one account per address).
UPDATE "User" SET "email" = lower(btrim("email")) WHERE "email" IS NOT NULL AND "email" <> lower(btrim("email"));

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT,
ALTER COLUMN "clerkUserId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
