import { WithdrawalStatus } from "@prisma/client";

export interface WithdrawalStatusHistoryEntry {
  status: WithdrawalStatus;
  changedBy: string;
  changedAt: string;
  notes: string;
  previousStatus: string;
}

export interface WithdrawalRequest {
  id: string;
  doctorId: string;
  amount: number;
  status: WithdrawalStatus;
  reference?: string;
  adminNotes?: string;
  statusHistory: WithdrawalStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  rejectedAt?: Date;
}

export interface WithdrawalCreateInput {
  doctorId: string;
  amount: number;
}

export interface WithdrawalUpdateStatusInput {
  status: WithdrawalStatus;
  adminId?: string;
  adminNotes?: string;
}

export interface WithdrawalFilters {
  status?: WithdrawalStatus;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}


// Status display mappings
export const WITHDRAWAL_STATUS_DISPLAY = {
  [WithdrawalStatus.PENDING]: 'Pending',
  [WithdrawalStatus.APPROVED]: 'Approved',
  [WithdrawalStatus.REJECTED]: 'Rejected',
  [WithdrawalStatus.COMPLETED]: 'Completed',
  [WithdrawalStatus.FAILED]: 'Failed',
} as const;

// Status colors for UI
export const WITHDRAWAL_STATUS_COLORS = {
  [WithdrawalStatus.PENDING]: '#FFA500', // Orange
  [WithdrawalStatus.APPROVED]: '#00C851', // Green
  [WithdrawalStatus.REJECTED]: '#FF4444', // Red
  [WithdrawalStatus.COMPLETED]: '#007E33', // Dark Green
  [WithdrawalStatus.FAILED]: '#CC0000', // Dark Red
} as const;

// Validation helpers
export const isValidWithdrawalStatus = (status: string): status is WithdrawalStatus => {
  return Object.values(WithdrawalStatus).includes(status as WithdrawalStatus);
};

export const getStatusDisplayName = (status: WithdrawalStatus): string => {
  return WITHDRAWAL_STATUS_DISPLAY[status] || status;
};

export const getStatusColor = (status: WithdrawalStatus): string => {
  return WITHDRAWAL_STATUS_COLORS[status] || '#666666';
};