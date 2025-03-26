/*
  Warnings:

  - Changed the type of `receiverType` on the `chat_messages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "chat_messages" DROP COLUMN "receiverType",
ADD COLUMN     "receiverType" "UserTypes" NOT NULL;
