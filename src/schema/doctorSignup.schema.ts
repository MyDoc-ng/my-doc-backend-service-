import { z } from "zod";
const SessionTypesEnum = z.enum(["CHAT", "AUDIO", "VIDEO", "CLINIC", "HOME"]);

export const DoctorSignupSchema = z.object({
    name: z.string().nullable(),
    // specialization: z.string().nullable(),
    experience: z.number().int().nullable(),
    location: z.string().nullable(),
    consultationTypes: z.array(SessionTypesEnum), // Assuming SessionType is an enum or string array
    consultationFees: z.number().nullable(),
    homeVisitCharge: z.number().nullable(),
    videoConsultationFee: z.number().nullable(),
    clinicConsultationFee: z.number().nullable(),
    // availability: z.array(z.unknown()), // Replace with specific schema for DoctorAvailability
    isOnline: z.boolean().default(false),
    lastActive: z.coerce.date().nullable(),
    // sessions: z.array(z.unknown()), // Replace with specific schema for Session
    bio: z.string().nullable(),
    // consultations: z.array(z.unknown()), // Replace with specific schema for Consultation
    specialtyId: z.string(),
});
