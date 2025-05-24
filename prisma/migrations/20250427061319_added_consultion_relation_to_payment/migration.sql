/*
  Warnings:

  - A unique constraint covering the columns `[consultationId]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "consultations" ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "consultationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_consultationId_key" ON "payments"("consultationId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
