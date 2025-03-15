/*
  Warnings:

  - You are about to drop the `MedicalHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MedicalHistory" DROP CONSTRAINT "MedicalHistory_userId_fkey";

-- DropTable
DROP TABLE "MedicalHistory";

-- CreateTable
CREATE TABLE "medical_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pastSurgeries" BOOLEAN NOT NULL,
    "currentMeds" BOOLEAN NOT NULL,
    "drugAllergies" BOOLEAN NOT NULL,

    CONSTRAINT "medical_histories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "medical_histories" ADD CONSTRAINT "medical_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
