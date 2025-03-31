import { z } from "zod";

export const doctorSignupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Confirm Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

// Define the Zod schema for login
export const doctorLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});


export const reviewDoctorSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  rating: z.number().min(1, "Invalid rating. Must be greater than 1").max(5, 'Invalid rating. Must not be greater than 5.'),
  comment: z.string().nullable(),
});

