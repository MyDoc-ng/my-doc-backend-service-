/*
  Warnings:

  - You are about to drop the column `phoneNumber` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phoneNumber]` on the table `PatientProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_phoneNumber_key";

-- AlterTable
ALTER TABLE "PatientProfile" ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "profilePicture" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phoneNumber",
DROP COLUMN "profilePicture";

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_phoneNumber_key" ON "PatientProfile"("phoneNumber");
