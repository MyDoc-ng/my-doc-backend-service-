-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deactivationReasons" JSONB,
ADD COLUMN     "rejectionReasons" JSONB;
