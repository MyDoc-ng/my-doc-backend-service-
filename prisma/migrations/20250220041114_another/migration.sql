/*
  Warnings:

  - The values [Messaging,AudioCall,VideoCall] on the enum `ConsultationType` will be removed. If these variants are still used in the database, this will fail.
  - Changed the type of `type` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ConsultationType_new" AS ENUM ('MESSAGING', 'AUDIOCALL', 'VIDEOCALL', 'CLINIC', 'HOME');
ALTER TABLE "doctors" ALTER COLUMN "consultationTypes" TYPE "ConsultationType_new"[] USING ("consultationTypes"::text::"ConsultationType_new"[]);
ALTER TABLE "Session" ALTER COLUMN "type" TYPE "ConsultationType_new" USING ("type"::text::"ConsultationType_new");
ALTER TYPE "ConsultationType" RENAME TO "ConsultationType_old";
ALTER TYPE "ConsultationType_new" RENAME TO "ConsultationType";
DROP TYPE "ConsultationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "type",
ADD COLUMN     "type" "ConsultationType" NOT NULL;

-- DropEnum
DROP TYPE "AppointmentType";
