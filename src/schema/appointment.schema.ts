import { z } from "zod";

export const appointmentSchema = z.object({
  type: z.enum(["Urgent","NonUrgent"]), // Only allows "Urgent" or "NonUrgent"
  patientName: z
    .string()
    .min(1, "Patient name cannot be empty"),
  patientEmail: z
    .string()
    .email("Invalid email address"),
  symptoms: z
    .array(z.string().min(1, "Symptom description cannot be empty"))
    .nonempty("At least one symptom is required"),
  consultationType: z.enum(["Messaging", "AudioCall", "VideoCall"]), // Only allows "in-person" or "virtual"
  doctorId: z
    .string()
    .uuid("Invalid Doctor ID"),
  date: z.string(),
  time: z.string(),
});

