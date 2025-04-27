import { z } from "zod";

// Define gender as an enum
const GenderEnum = z.enum(["MALE", "FEMALE"]);

// Define the Zod schema for user registration
export const userRegisterSchema = z
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

// Define the Zod schema for biodata
export const userBiodataSchema = z.object({
  dateOfBirth: z
    .string()
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
      "Invalid date format (YYYY-MM-DD)"
    ),
  gender: GenderEnum,
  phoneNumber: z.string().regex(/^\+?\d{10,15}$/, "Invalid phone number"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  medicalHistory: z.object({
    pastSurgeries: z.enum(['Yes', 'No']),
    currentMeds: z.enum(['Yes', 'No']),
    drugAllergies: z.enum(['Yes', 'No']),
  }).optional(),
});

// Define the Zod schema for login
export const userLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Define the Zod schema for user photo upload
export const UserPhotoSchema = z.object({
  photo: z.object({
    path: z.string(),
    originalname: z.string().nonempty("File name cannot be empty"),
  }),
  userId: z.string().uuid("Invalid user ID"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z
    .string()
    .regex(
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
      "Invalid date format (YYYY-MM-DD)"
    ),
  gender: GenderEnum,
  phoneNumber: z.string().regex(/^\+?\d{10,15}$/, "Invalid phone number"),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password must be at least 6 characters"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirm password must match",
  path: ["confirmPassword"],
});

export const doctorComplianceSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Terms must be accepted",
  }),
  canUseVideoConsultationTools: z.enum(["yes", "no"], {
    required_error: "Please specify if you can use video consultation tools",
  }),
  hasInternetEnabledDevice: z.enum(["yes", "no"], {
    required_error: "Please specify if you have an internet-enabled device",
  }),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export const newPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

