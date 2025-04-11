/*
  Warnings:

  - Made the column `senderId` on table `chat_messages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `receiverId` on table `chat_messages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `patientId` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_patientId_fkey";

-- AlterTable
ALTER TABLE "chat_messages" ALTER COLUMN "senderId" SET NOT NULL,
ALTER COLUMN "receiverId" SET NOT NULL;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "patientId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
