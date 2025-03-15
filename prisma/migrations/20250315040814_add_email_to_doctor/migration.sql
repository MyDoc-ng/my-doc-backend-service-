/*
  Warnings:

  - You are about to drop the column `accessToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `doctors` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `doctors` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_doctorId_fkey";

-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "email" TEXT NOT NULL,
ALTER COLUMN "specialtyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "accessToken",
DROP COLUMN "refreshToken";

-- DropTable
DROP TABLE "sessions";

-- CreateIndex
CREATE UNIQUE INDEX "doctors_email_key" ON "doctors"("email");
