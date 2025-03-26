/*
  Warnings:

  - Changed the type of `senderType` on the `chat_messages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "voiceUrl" TEXT,
DROP COLUMN "senderType",
ADD COLUMN     "senderType" "UserTypes" NOT NULL;
