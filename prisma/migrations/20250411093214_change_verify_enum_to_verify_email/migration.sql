/*
  Warnings:

  - The values [VERIFY] on the enum `RegistrationStep` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RegistrationStep_new" AS ENUM ('CREATE_ACCOUNT', 'VERIFY_EMAIL', 'CREATE_BIODATA', 'PROVIDE_MEDICAL_CERTIFICATIONS', 'COMPLIANCE_AND_SECURITY_CHECK', 'PROFILE_COMPLETE');
ALTER TABLE "users" ALTER COLUMN "registrationStep" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "registrationStep" TYPE "RegistrationStep_new" USING ("registrationStep"::text::"RegistrationStep_new");
ALTER TYPE "RegistrationStep" RENAME TO "RegistrationStep_old";
ALTER TYPE "RegistrationStep_new" RENAME TO "RegistrationStep";
DROP TYPE "RegistrationStep_old";
ALTER TABLE "users" ALTER COLUMN "registrationStep" SET DEFAULT 'CREATE_ACCOUNT';
COMMIT;
