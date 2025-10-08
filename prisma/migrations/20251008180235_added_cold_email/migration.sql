-- CreateTable
CREATE TABLE "public"."ColdEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "jobDescription" TEXT,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColdEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ColdEmail_userId_idx" ON "public"."ColdEmail"("userId");

-- AddForeignKey
ALTER TABLE "public"."ColdEmail" ADD CONSTRAINT "ColdEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
