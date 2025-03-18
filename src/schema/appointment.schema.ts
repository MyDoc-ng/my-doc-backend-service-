import { z } from "zod";

// Create a new appointment
export const appointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  consultationType: z.enum(["CHAT", "AUDIO", "VIDEO", "CLINIC", "HOME"])
  // startTime: z.string(),
  // endTime: z.string(),
});

