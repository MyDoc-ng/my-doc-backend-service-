import { z } from "zod";

// Create a new appointment
export const appointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  date: z.string(),
  time: z.string(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string(),
  date: z.string(),
  time: z.string(),
});

export const gopdSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  // consultationType: z.enum(["CHAT", "AUDIO", "VIDEO", "CLINIC", "HOME"])
  // startTime: z.string(),
  // endTime: z.string(),
});

export const cancelSchema = z.object({
  reason: z.string().min(3, "Reason is required"),
  otherReason: z.string().optional(),
});

