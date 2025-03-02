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
  medicalHistory: z
    .object({
      pastSurgeries: z.boolean(),
      currentMeds: z.boolean(),
      drugAllergies: z.boolean(),
    })
    .optional(),
});

// Define the Zod schema for login
export const userLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Define the Zod schema for user photo upload
export const UserPhotoSchema = z.object({
  photo: z.object({
    path: z.string(), // The file path is required
    originalname: z.string().nonempty("File name cannot be empty"),
  }),
  userId: z.string().uuid("Invalid user ID"),
});
