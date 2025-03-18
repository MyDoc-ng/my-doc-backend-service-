import { SessionType } from "@prisma/client";

export type GOPDBookingData = {
  doctorId: string;
  patientId: string;
  consultationType: SessionType;
};
