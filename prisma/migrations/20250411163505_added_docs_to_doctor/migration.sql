/*
  Warnings:

  - You are about to drop the column `cv` on the `DoctorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `homeVisitCharge` on the `DoctorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `medicalLicense` on the `DoctorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `DoctorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `videoConsultationFee` on the `DoctorProfile` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_receiverId_fkey";

-- DropIndex
DROP INDEX "DoctorProfile_reference_key";

-- AlterTable
ALTER TABLE "DoctorProfile" DROP COLUMN "cv",
DROP COLUMN "homeVisitCharge",
DROP COLUMN "medicalLicense",
DROP COLUMN "reference",
DROP COLUMN "videoConsultationFee",
ADD COLUMN     "acceptedTC" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canUseVideoConsultationTools" TEXT,
ADD COLUMN     "cvDoc" TEXT,
ADD COLUMN     "hasInternetEnabledDevice" TEXT,
ADD COLUMN     "homeVisitFee" DOUBLE PRECISION,
ADD COLUMN     "idDoc" TEXT,
ADD COLUMN     "medicalLicenseDoc" TEXT,
ADD COLUMN     "referenceDoc" TEXT,
ADD COLUMN     "specializationCertDoc" TEXT;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
