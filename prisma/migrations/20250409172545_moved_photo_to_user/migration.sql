/*
  Warnings:

  - You are about to drop the column `profilePicture` on the `DoctorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `PatientProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DoctorProfile" DROP COLUMN "profilePicture";

-- AlterTable
ALTER TABLE "PatientProfile" DROP COLUMN "profilePicture";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profilePicture" TEXT;
