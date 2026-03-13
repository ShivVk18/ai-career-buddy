/*
  Warnings:

  - You are about to drop the `NetworkConnection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."NetworkConnection" DROP CONSTRAINT "NetworkConnection_userId_fkey";

-- DropTable
DROP TABLE "public"."NetworkConnection";
