-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "offer" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "targetBase" INTEGER;

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "source" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_userId_doneAt_dueAt_idx" ON "Task"("userId", "doneAt", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Task_userId_key_key" ON "Task"("userId", "key");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
