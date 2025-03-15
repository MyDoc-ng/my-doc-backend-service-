import { SessionType } from "@prisma/client";

export type BookingData = {
  doctorId: string;
  doctorEmail: string;
  patientId: string;
  patientEmail: string;
  consultationType: SessionType;
};
