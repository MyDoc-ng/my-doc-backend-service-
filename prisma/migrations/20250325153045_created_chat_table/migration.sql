/*
  Warnings:

  - You are about to drop the column `doctorId` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - Added the required column `receiverId` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverType` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderType` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `chat_messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserTypes" AS ENUM ('ADMIN', 'USER', 'DOCTOR');

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_userId_fkey";

-- AlterTable
ALTER TABLE "chat_messages" DROP COLUMN "doctorId",
DROP COLUMN "timestamp",
DROP COLUMN "userId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "receiverId" TEXT NOT NULL,
ADD COLUMN     "receiverType" TEXT NOT NULL,
ADD COLUMN     "senderId" TEXT NOT NULL,
ADD COLUMN     "senderType" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role";

-- DropEnum
DROP TYPE "Roles";
