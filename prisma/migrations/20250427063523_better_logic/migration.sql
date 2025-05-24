/*
  Warnings:

  - You are about to drop the column `active` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DEACTIVATED');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "active",
ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3);
