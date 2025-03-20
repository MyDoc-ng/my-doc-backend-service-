-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'APPOINTMENT_SCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE 'APPOINTMENT_RESCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE 'APPOINTMENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_REJECTED';
