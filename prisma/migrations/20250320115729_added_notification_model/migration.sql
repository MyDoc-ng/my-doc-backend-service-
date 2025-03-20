-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPOINTMENT_SUCCESS', 'VIDEO_CALL', 'SCHEDULE_CHANGED', 'APPOINTMENT_CANCELLED');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('USER', 'ADMIN', 'DOCTOR');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipientId" TEXT NOT NULL,
    "recipientType" "RecipientType" NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientId_recipientType_idx" ON "Notification"("recipientId", "recipientType");
