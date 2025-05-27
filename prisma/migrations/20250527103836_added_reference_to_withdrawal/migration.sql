/*
  Warnings:

  - Added the required column `reference` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "reference" TEXT NOT NULL;
