/*
  Warnings:

  - The `statusHistory` column on the `Withdrawal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[reference]` on the table `Withdrawal` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Withdrawal" DROP COLUMN "statusHistory",
ADD COLUMN     "statusHistory" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE UNIQUE INDEX "Withdrawal_reference_key" ON "Withdrawal"("reference");
