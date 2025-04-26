import { z } from "zod";

export const bankAccountSchema = z.object({
    bankName: z.string().min(2, "Bank name must be at least 2 characters"),
    accountNo: z
        .string()
        .min(10, "Account number must be at least 10 digits")
        .max(20, "Account number must not exceed 20 digits")
        .regex(/^\d+$/, "Account number must contain only digits"),
    accountName: z
        .string()
        .min(2, "Account name must be at least 2 characters")
        .max(100, "Account name must not exceed 100 characters")
        .regex(/^[a-zA-Z\s]+$/, "Account name must contain only letters and spaces"),
});

export const updateBankAccountSchema = bankAccountSchema.partial();