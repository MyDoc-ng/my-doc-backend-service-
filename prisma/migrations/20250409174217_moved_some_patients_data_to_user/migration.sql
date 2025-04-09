/*
  Warnings:

  - You are about to drop the column `address` on the `PatientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `PatientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `PatientProfile` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `PatientProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phoneNumber]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PatientProfile_phoneNumber_key";

-- AlterTable
ALTER TABLE "PatientProfile" DROP COLUMN "address",
DROP COLUMN "dateOfBirth",
DROP COLUMN "gender",
DROP COLUMN "phoneNumber";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dateOfBirth" TEXT,
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'MALE',
ADD COLUMN     "phoneNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");
