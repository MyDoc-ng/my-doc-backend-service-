/*
  Warnings:

  - You are about to drop the column `patientProfileId` on the `medical_histories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "medical_histories" DROP CONSTRAINT "medical_histories_patientProfileId_fkey";

-- AlterTable
ALTER TABLE "medical_histories" DROP COLUMN "patientProfileId";
