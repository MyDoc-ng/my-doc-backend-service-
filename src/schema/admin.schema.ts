import { z } from 'zod';

// User status update schema
export const userStatusSchema = z.object({
  isActive: z.boolean({
    required_error: 'Active status is required',
    invalid_type_error: 'Active status must be a boolean',
  }),
});

// Doctor status update schema
export const doctorStatusSchema = z.object({
  approvalStatus: z.string({
    required_error: 'Approval status is required',
    invalid_type_error: 'Approval status must be a string',
  }),
});

// Dispute resolution schema
export const disputeResolutionSchema = z.object({
  resolution: z.string({
    required_error: 'Resolution is required',
    invalid_type_error: 'Resolution must be a string',
  }).min(5, 'Resolution must be at least 5 characters'),
  refund: z.boolean({
    invalid_type_error: 'Refund must be a boolean',
  }).optional().default(false),
});

// Withdrawal status update schema
export const withdrawalStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
    required_error: 'Status is required',
    invalid_type_error: 'Status must be one of: PENDING, APPROVED, REJECTED',
  }),
});

// Commission rate update schema
export const commissionRateSchema = z.object({
  rate: z.number({
    required_error: 'Commission rate is required',
    invalid_type_error: 'Commission rate must be a number',
  }).min(0, 'Commission rate must be at least 0').max(100, 'Commission rate must be at most 100'),
});

// Filter schemas for various endpoints
export const consultationFilterSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'UPCOMING']).optional(),
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const disputeFilterSchema = z.object({
  status: z.enum(['OPEN', 'RESOLVED']).optional(),
  consultationId: z.string().uuid().optional(),
});

export const paymentFilterSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']).optional(),
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const withdrawalFilterSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  userId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});