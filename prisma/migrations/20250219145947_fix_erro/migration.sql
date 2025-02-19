/*
  Warnings:

  - The `symptoms` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "symptoms",
ADD COLUMN     "symptoms" TEXT[];
