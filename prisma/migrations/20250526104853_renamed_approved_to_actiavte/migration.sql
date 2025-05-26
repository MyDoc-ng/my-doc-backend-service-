/*
  Warnings:

  - The values [APPROVED] on the enum `ApprovalStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApprovalStatus_new" AS ENUM ('PENDING', 'ACTIVATED', 'REJECTED', 'DEACTIVATED');
ALTER TABLE "users" ALTER COLUMN "approvalStatus" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "approvalStatus" TYPE "ApprovalStatus_new" USING ("approvalStatus"::text::"ApprovalStatus_new");
ALTER TYPE "ApprovalStatus" RENAME TO "ApprovalStatus_old";
ALTER TYPE "ApprovalStatus_new" RENAME TO "ApprovalStatus";
DROP TYPE "ApprovalStatus_old";
ALTER TABLE "users" ALTER COLUMN "approvalStatus" SET DEFAULT 'PENDING';
COMMIT;
