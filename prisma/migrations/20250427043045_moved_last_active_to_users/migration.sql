/*
  Warnings:

  - You are about to drop the column `lastActive` on the `DoctorProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DoctorProfile" DROP COLUMN "lastActive";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastActive" TIMESTAMP(3);
