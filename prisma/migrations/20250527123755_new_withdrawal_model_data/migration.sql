/*
  Warnings:

  - Added the required column `updatedAt` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WithdrawalStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "WithdrawalStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "statusHistory" JSONB[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
