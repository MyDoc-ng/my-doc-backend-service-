-- CreateEnum
CREATE TYPE "ConsultationType" AS ENUM ('Messaging', 'AudioCall', 'VideoCall');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('Urgent', 'NonUrgent');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('Pending', 'InProgress', 'Completed');

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "ratings" DOUBLE PRECISION NOT NULL,
    "bio" TEXT NOT NULL,
    "profilePic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "type" "AppointmentType" NOT NULL DEFAULT 'Urgent',
    "patientName" TEXT NOT NULL,
    "patientEmail" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "consultationType" "ConsultationType" NOT NULL DEFAULT 'Messaging',
    "doctorId" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
