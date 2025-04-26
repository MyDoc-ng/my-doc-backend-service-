/*
  Warnings:

  - You are about to drop the column `isOnline` on the `DoctorProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DoctorProfile" DROP COLUMN "isOnline";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false;
