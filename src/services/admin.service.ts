import {
  AppointmentStatus,
  ApprovalStatus,
  DisputeStatus,
  PaymentStatus,
  UserTypes,
  WithdrawalStatus,
} from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { responseService } from "./response.service";
import logger from "../logger";
import { BadRequestException } from "../exception/bad-request";
import { EmailService } from "./email.service";
import { generateWithdrawalReference } from "../utils/helpers";
import { WithdrawalStatusHistoryEntry } from "../types/withdrawal.types";

type UnifiedStatus = PaymentStatus | WithdrawalStatus;

export class AdminService {
  // Dashboard statistics
  static async getDashboardStats() {
    try {
      const [doctors, patients, consultations, revenue, disputes] =
        await Promise.all([
          // Get doctor count
          prisma.user.count({
            where: {
              roles: {
                some: {
                  role: {
                    name: UserTypes.DOCTOR,
                  },
                },
              },
            },
          }),
          // Get patient count
          prisma.user.count({
            where: {
              roles: {
                some: {
                  role: {
                    name: UserTypes.PATIENT,
                  },
                },
              },
            },
          }),
          // Get consultation stats
          prisma.consultation.groupBy({
            by: ["status"],
            _count: {
              id: true,
            },
          }),
          // Get revenue summary
          prisma.payment.groupBy({
            by: ["status"],
            _sum: {
              amount: true,
            },
          }),

          // Get dispute stats
          prisma.dispute.groupBy({
            by: ["status"],
            _count: {
              id: true,
            },
          }),
        ]);

      // Format consultation stats
      const consultationStats = {
        active: 0,
        pending: 0,
        completed: 0,
        total: 0,
      };

      consultations.forEach((stat) => {
        if (
          stat.status === AppointmentStatus.CONFIRMED ||
          stat.status === AppointmentStatus.UPCOMING
        ) {
          consultationStats.active += stat._count.id;
        } else if (stat.status === AppointmentStatus.PENDING) {
          consultationStats.pending += stat._count.id;
        } else if (stat.status === AppointmentStatus.COMPLETED) {
          consultationStats.completed += stat._count.id;
        }
        consultationStats.total += stat._count.id;
      });

      // Format dispute stats
      const disputeStats = {
        open: 0,
        resolved: 0,
        total: 0,
      };

      disputes.forEach((stat) => {
        if (stat.status === DisputeStatus.OPEN) {
          disputeStats.open += stat._count.id;
        } else if (stat.status === DisputeStatus.RESOLVED) {
          disputeStats.resolved += stat._count.id;
        }
        disputeStats.total += stat._count.id;
      });

      const revenueStats = {
        total: 0,
        pending: 0,
      };

      revenue.forEach((stat) => {
        if (stat.status === PaymentStatus.SUCCESSFUL) {
          revenueStats.total = stat._sum.amount || 0;
        }
        if (stat.status === PaymentStatus.PENDING) {
          revenueStats.pending = stat._sum.amount || 0;
        }
      });

      return responseService.success({
        message: "Dashboard statistics fetched successfully",
        data: {
          users: {
            doctors,
            patients,
            total: doctors + patients,
          },
          consultations: consultationStats,
          revenue: revenueStats,
          disputes: disputeStats,
        },
      });
    } catch (error: any) {
      logger.error("Error fetching dashboard statistics", {
        error: error.message,
        stack: error.stack,
      });
      return responseService.error({
        message: "Failed to fetch dashboard statistics",
        error: error.message,
      });
    }
  }

  // Doctor Management
  static async getDoctors(status: ApprovalStatus) {
    if (!status) {
      status = ApprovalStatus.PENDING;
    }

    // Validate status
    const validStatuses = Object.values(ApprovalStatus);
    if (!validStatuses.includes(status.toLocaleUpperCase() as ApprovalStatus)) {
      throw new BadRequestException(`Invalid doctor status: ${status}`);
    }
    // Ensure status is in uppercase
    status = status.toUpperCase() as ApprovalStatus;

    try {
      const doctors = await prisma.user.findMany({
        where: {
          roles: {
            some: {
              role: {
                name: UserTypes.DOCTOR,
              },
            },
          },
          approvalStatus: status,
        },
        include: {
          doctorProfile: {
            include: {
              specialty: true,
            },
          },
          DoctorReviews: true,
          doctorConsultations: {
            select: {
              id: true,
              status: true,
            },
          },
          Withdrawal: true,
        },
      });

      return responseService.success({
        message: "Doctors fetched successfully",
        data: doctors,
      });
    } catch (error: any) {
      logger.error("Error fetching doctors", {
        error: error.message,
        stack: error.stack,
      });
      return responseService.error({
        message: "Failed to fetch doctors",
        error: error.message,
      });
    }
  }

  // static async updateDoctorStatus(doctorId: string, isApproved: boolean) {
  //   try {
  //     const doctor = await prisma.doctorProfile.update({
  //       where: { userId: doctorId },
  //       data: { isApproved },
  //     });

  //     return responseService.success({
  //       message: `Doctor ${isApproved ? "approved" : "suspended"} successfully`,
  //       data: doctor,
  //     });
  //   } catch (error: any) {
  //     logger.error("Error updating doctor status", {
  //       error: error.message,
  //       stack: error.stack,
  //       doctorId,
  //     });
  //     return responseService.error({
  //       message: "Failed to update doctor status",
  //       error: error.message,
  //     });
  //   }
  // }

  // Patient Management

  static async updateDoctorStatus(
    adminId: string,
    doctorId: string,
    action: "approve" | "reject" | "activate" | "deactivate",
    reasons?: string[],
    otherReason?: string,
    approvalData?: {
      yearsOfExperience: number;
      numberClientsSeen: number;
      initialRating: number;
    }
  ) {
    try {
      // Validation checks
      if (!doctorId) {
        return responseService.error({
          message: "Doctor ID is required",
          status: 400,
        });
      }

      if (
        !action ||
        !["approve", "reject", "activate", "deactivate"].includes(action)
      ) {
        return responseService.error({
          message:
            "Valid action is required (approve, reject, activate, deactivate)",
          status: 400,
        });
      }

      // For approve action, approval data is required
      if (
        action === "approve" &&
        (!approvalData ||
          !approvalData.yearsOfExperience ||
          !approvalData.numberClientsSeen ||
          !approvalData.initialRating)
      ) {
        return responseService.error({
          message:
            "Years of experience, number of clients seen, and initial rating are required for approval",
          status: 400,
        });
      }

      // Validate approval data ranges if provided
      if (action === "approve" && approvalData) {
        if (
          approvalData.yearsOfExperience < 0 ||
          approvalData.yearsOfExperience > 50
        ) {
          return responseService.error({
            message: "Years of experience must be between 0 and 50",
            status: 400,
          });
        }

        if (approvalData.numberClientsSeen < 0) {
          return responseService.error({
            message: "Number of clients seen cannot be negative",
            status: 400,
          });
        }

        if (approvalData.initialRating < 1 || approvalData.initialRating > 5) {
          return responseService.error({
            message: "Initial rating must be between 1 and 5",
            status: 400,
          });
        }
      }

      // Check if doctor exists and has DOCTOR role
      const doctor = await prisma.user.findFirst({
        where: {
          id: doctorId,
          roles: {
            some: {
              role: {
                name: UserTypes.DOCTOR,
              },
            },
          },
        },
        include: {
          doctorProfile: {
            include: {
              specialty: true,
            },
          },
        },
      });

      if (!doctor) {
        return responseService.error({
          message: "Doctor not found",
          status: 404,
        });
      }

      if (!doctor.doctorProfile) {
        return responseService.error({
          message: "Doctor profile not found",
          status: 404,
        });
      }

      let updateData: any = {
        updatedAt: new Date(),
      };

      let doctorProfileUpdateData: any = {};

      // Helper function to format reasons for storage
      const formatReasons = (reasons?: string[], otherReason?: string) => {
        const allReasons = reasons ? [...reasons] : [];
        if (otherReason && otherReason.trim()) {
          allReasons.push(otherReason.trim());
        }
        return allReasons.length > 0
          ? {
              selectedReasons: reasons || [],
              otherReason: otherReason?.trim() || null,
              allReasons,
              timestamp: new Date().toISOString(),
              adminId,
            }
          : null;
      };

      switch (action) {
        case "approve":
          // Approve doctor - set profile as approved and activate user
          doctorProfileUpdateData = {
            isApproved: true,
            // Update experience if provided in approval data
            ...(approvalData?.yearsOfExperience && {
              experience: approvalData.yearsOfExperience,
            }),
          };
          updateData = {
            ...updateData,
            approvalStatus: ApprovalStatus.ACTIVATED,
            approvedAt: new Date(),
            rejectedAt: null,
            deactivatedAt: null,
            rejectionReasons: null,
            deactivationReasons: null,
          };
          break;

        case "reject":
          // Reject doctor - set profile as not approved and user as rejected
          // let rejectionReasons = reasons ? [...reasons] : [];
          // if (otherReason && otherReason.trim()) {
          //   rejectionReasons.push(otherReason.trim());
          // }

          const rejectionReasonsData = formatReasons(reasons, otherReason);

          doctorProfileUpdateData = {
            isApproved: false,
          };
          updateData = {
            ...updateData,
            approvalStatus: ApprovalStatus.REJECTED,
            rejectedAt: new Date(),
            approvedAt: null,
            deactivatedAt: null,
            // Store rejection reasons
            rejectionReasons: rejectionReasonsData,
          };
          break;

        case "activate":
          // Activate doctor - must be previously approved
          if (!doctor.doctorProfile.isApproved) {
            return responseService.error({
              message: "Doctor must be approved before activation",
              status: 400,
            });
          }
          updateData = {
            ...updateData,
            approvalStatus: ApprovalStatus.ACTIVATED,
            deactivatedAt: null,
            // Clear deactivation reasons when reactivating
            deactivationReasons: null,
          };
          break;

        case "deactivate":
          // Deactivate doctor - collect reasons similar to reject
          // let deactivationReasons = reasons ? [...reasons] : [];
          // if (otherReason && otherReason.trim()) {
          //   deactivationReasons.push(otherReason.trim());
          // }
          const deactivationReasonsData = formatReasons(reasons, otherReason);

          updateData = {
            ...updateData,
            approvalStatus: ApprovalStatus.DEACTIVATED,
            deactivatedAt: new Date(),
            // Store deactivation reasons
            deactivationReasons: deactivationReasonsData,
          };
          break;
      }

      // Update user and doctor profile in a transaction
      const updatedDoctor = await prisma.$transaction(async (tx) => {
        // Update doctor profile if needed
        if (Object.keys(doctorProfileUpdateData).length > 0) {
          await tx.doctorProfile.update({
            where: { userId: doctorId },
            data: doctorProfileUpdateData,
          });
        }

        // Create initial review for approved doctor if approval data provided
        if (action === "approve" && approvalData) {
          await tx.review.create({
            data: {
              doctorId: doctorId,
              patientId: adminId,
              rating: approvalData.initialRating,
              comment: `Initial system rating based on professional assessment. Years of experience: ${approvalData.yearsOfExperience}, Clients seen: ${approvalData.numberClientsSeen}`,
              createdAt: new Date(),
            },
          });
        }

        // Update user
        return await tx.user.update({
          where: { id: doctorId },
          data: updateData,
          include: {
            doctorProfile: {
              include: {
                specialty: true,
              },
            },
            DoctorReviews: true,
          },
        });
      });

      // Optional: Send notification email based on action
      // Include reasons for reject and deactivate actions
      const emailReasons =
        action === "reject" || action === "deactivate"
          ? (reasons || [])
              .concat(otherReason ? [otherReason] : [])
              .filter(Boolean)
          : undefined;
      // await EmailService.sendStatusUpdateEmail(doctor.email, action, emailReasons);

      logger.info(`Doctor ${action} successfully`, {
        doctorId,
        action,
        ...(reasons && { reasons }),
        ...(otherReason && { otherReason }),
      });

      return responseService.success({
        message: `Doctor ${action}d successfully`,
        data: updatedDoctor,
      });
    } catch (error: any) {
      logger.error(`Error ${action} doctor`, {
        error: error.message,
        stack: error.stack,
        doctorId,
        action,
      });
      return responseService.error({
        message: `Failed to ${action} doctor`,
        error: error.message,
      });
    }
  }

  static async getPatients(filters?: any) {
    try {
      const patients = await prisma.user.findMany({
        where: {
          roles: {
            some: {
              role: {
                name: UserTypes.PATIENT,
              },
            },
          },
          ...filters,
        },
        include: {
          patientConsultations: {
            select: {
              id: true,
              status: true,
              doctorId: true,
            },
          },
        },
      });

      const patientData = patients.map((patient) => ({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phoneNumber,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        registrationStep: patient.registrationStep,
        profilePicture: patient.profilePicture,
        patientConsultations: patient.patientConsultations,
        isActive: patient.isOnline,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      }));

      return responseService.success({
        message: "Patients fetched successfully",
        data: patientData,
      });
    } catch (error: any) {
      logger.error("Error fetching patients", {
        error: error.message,
        stack: error.stack,
      });
      return responseService.error({
        message: "Failed to fetch patients",
        error: error.message,
      });
    }
  }

  static async updatePatientStatus(patientId: string, isActive: boolean) {
    try {
      const patient = await prisma.user.update({
        where: { id: patientId },
        data: { isOnline: isActive },
      });

      return responseService.success({
        message: `Patient ${isActive ? "activated" : "suspended"} successfully`,
        data: patient,
      });
    } catch (error: any) {
      logger.error("Error updating patient status", {
        error: error.message,
        stack: error.stack,
        patientId,
      });
      return responseService.error({
        message: "Failed to update patient status",
        error: error.message,
      });
    }
  }

  // Consultation Management
  static async getConsultations(filters?: any) {
    try {
      const consultations = await prisma.consultation.findMany({
        where: filters,
        include: {
          doctor: true,
          patient: true,
          disputes: true,
        },
      });

      return responseService.success({
        message: "Consultations fetched successfully",
        data: consultations,
      });
    } catch (error: any) {
      logger.error("Error fetching consultations", {
        error: error.message,
        stack: error.stack,
      });
      return responseService.error({
        message: "Failed to fetch consultations",
        error: error.message,
      });
    }
  }

  // Dispute Management
  static async getDisputes(filters?: any) {
    try {
      const disputes = await prisma.dispute.findMany({
        where: filters,
        include: {
          consultation: {
            include: {
              doctor: true,
              patient: true,
            },
          },
        },
      });

      return responseService.success({
        message: "Disputes fetched successfully",
        data: disputes,
      });
    } catch (error: any) {
      logger.error("Error fetching disputes", {
        error: error.message,
        stack: error.stack,
      });
      return responseService.error({
        message: "Failed to fetch disputes",
        error: error.message,
      });
    }
  }

  static async resolveDispute(
    disputeId: string,
    resolution: string,
    refund: boolean = false
  ) {
    try {
      const dispute = await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolution,
        },
        include: {
          consultation: true,
        },
      });

      // If refund is requested, process it
      if (refund && dispute.consultation) {
        // Process refund logic here
        // This would involve updating payment records
      }

      return responseService.success({
        message: "Dispute resolved successfully",
        data: dispute,
      });
    } catch (error: any) {
      logger.error("Error resolving dispute", {
        error: error.message,
        stack: error.stack,
        disputeId,
      });
      return responseService.error({
        message: "Failed to resolve dispute",
        error: error.message,
      });
    }
  }

  // Get all transactions with proper categorization
  static async getAllTransactions(params: {
    doctorId?: string;
    status?: UnifiedStatus;
    startDate?: string;
    endDate?: string;
    category?:
      | "payment_requests"
      | "payments_received"
      | "income"
      | "transaction_history"
      | "all";
  }) {
    const dateFilter =
      params.startDate && params.endDate
        ? {
            gte: new Date(params.startDate),
            lte: new Date(params.endDate),
          }
        : undefined;

    let result: any = {};

    switch (params.category) {
      case "payment_requests":
        result = await this.getPaymentRequests(
          params.doctorId,
          dateFilter,
          params.status
        );
        break;

      case "payments_received":
        result = await this.getPaymentsReceived(
          params.doctorId,
          dateFilter,
          params.status
        );
        break;

      case "income":
        result = await this.getIncomeTransactions(params.doctorId, dateFilter);
        break;

      case "transaction_history":
        result = await this.getTransactionHistory(params.doctorId, dateFilter);
        break;

      default:
        result = await this.getAllCategorizedTransactions(params);
        break;
    }

    return responseService.success({
      message: "Transactions fetched successfully",
      data: result,
    });
  }

  // Get payment requests (from withdrawal model)
  private static async getPaymentRequests(
    doctorId?: string,
    dateFilter?: any,
    status?: UnifiedStatus
  ) {
    const where: any = {};

    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;
    if (dateFilter) where.createdAt = dateFilter;

    const withdrawalRequests = await prisma.withdrawal.findMany({
      where,
      include: {
        doctor: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      category: "payment_requests",
      count: withdrawalRequests.length,
      data: withdrawalRequests.map((request) => ({
        id: request.id,
        type: "withdrawal_request",
        amount: request.amount,
        status: request.status,
        createdAt: request.createdAt,
        doctor: request.doctor,
        description: "Withdrawal Request",
        reference: request.reference || null,
      })),
    };
  }

  // Get payments received (successful consultation payments)
  private static async getPaymentsReceived(
    doctorId?: string,
    dateFilter?: any,
    status?: UnifiedStatus
  ) {
    const where: any = {
      status: PaymentStatus.SUCCESSFUL,
    };

    if (status) where.status = status;
    if (dateFilter) where.createdAt = dateFilter;

    if (doctorId) {
      where.consultation = {
        doctorId: doctorId,
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        consultation: {
          include: {
            doctor: { select: { id: true, name: true, profilePicture: true } },
            patient: { select: { id: true, name: true, profilePicture: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      category: "payments_received",
      count: payments.length,
      data: payments.map((payment) => ({
        id: payment.id,
        type: "payment_received",
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
        consultation: payment.consultation,
        description: `Payment for Consultation`,
        reference: payment.transactionId,
      })),
    };
  }

  // Get income transactions (all successful payments for doctor)
  private static async getIncomeTransactions(
    doctorId?: string,
    dateFilter?: any
  ) {
    const where: any = {
      status: PaymentStatus.SUCCESSFUL,
    };

    if (dateFilter) where.createdAt = dateFilter;

    if (doctorId) {
      where.consultation = {
        doctorId: doctorId,
      };
    }

    const incomePayments = await prisma.payment.findMany({
      where,
      include: {
        consultation: {
          include: {
            doctor: { select: { id: true, name: true, profilePicture: true } },
            patient: { select: { id: true, name: true, profilePicture: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate total income
    const totalIncome = incomePayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    return {
      category: "income",
      totalIncome,
      count: incomePayments.length,
      data: incomePayments.map((payment) => ({
        id: payment.id,
        type: "income",
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
        consultation: payment.consultation,
        description: `Payment for Consultation`,
        reference: payment.transactionId,
      })),
    };
  }

  // Get transaction history (all withdrawals for a doctor)
  private static async getTransactionHistory(
    doctorId?: string,
    dateFilter?: any
  ) {
    const where: any = {};

    if (doctorId) where.doctorId = doctorId;
    if (dateFilter) where.createdAt = dateFilter;

    const withdrawals = await prisma.withdrawal.findMany({
      where,
      include: {
        doctor: {
          select: { id: true, name: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      category: "transaction_history",
      count: withdrawals.length,
      data: withdrawals.map((withdrawal) => ({
        id: withdrawal.id,
        type: "withdrawal",
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        doctor: withdrawal.doctor,
        description: `Withdrawal Request`,
        reference: withdrawal.reference || null,
      })),
    };
  }

  // Get all categorized transactions
  private static async getAllCategorizedTransactions(params: any) {
    const [paymentRequests, paymentsReceived, income, transactionHistory] =
      await Promise.all([
        this.getPaymentRequests(
          params.doctorId,
          params.startDate && params.endDate
            ? {
                gte: new Date(params.startDate),
                lte: new Date(params.endDate),
              }
            : undefined,
          params.status
        ),
        this.getPaymentsReceived(
          params.doctorId,
          params.startDate && params.endDate
            ? {
                gte: new Date(params.startDate),
                lte: new Date(params.endDate),
              }
            : undefined,
          params.status
        ),
        this.getIncomeTransactions(
          params.doctorId,
          params.startDate && params.endDate
            ? {
                gte: new Date(params.startDate),
                lte: new Date(params.endDate),
              }
            : undefined
        ),
        this.getTransactionHistory(
          params.doctorId,
          params.startDate && params.endDate
            ? {
                gte: new Date(params.startDate),
                lte: new Date(params.endDate),
              }
            : undefined
        ),
      ]);

    return {
      paymentRequests,
      paymentsReceived,
      income,
      transactionHistory,
      summary: {
        totalPaymentRequests: paymentRequests.count,
        totalPaymentsReceived: paymentsReceived.count,
        totalIncome: income.totalIncome,
        totalTransactions: transactionHistory.count,
      },
    };
  }

  // Get doctor's balance summary
  static async getDoctorBalanceSummary(doctorId: string) {
    // Get total income from completed consultations
    const totalIncome = await prisma.payment.aggregate({
      where: {
        consultation: { doctorId },
        status: PaymentStatus.SUCCESSFUL,
      },
      _sum: { amount: true },
    });

    // Get total withdrawn amount
    const totalWithdrawn = await prisma.withdrawal.aggregate({
      where: {
        doctorId,
        status: WithdrawalStatus.APPROVED,
      },
      _sum: { amount: true },
    });

    // Get pending withdrawal requests
    const pendingWithdrawals = await prisma.withdrawal.aggregate({
      where: {
        doctorId,
        status: WithdrawalStatus.PENDING,
      },
      _sum: { amount: true },
    });

    const availableBalance =
      (totalIncome._sum.amount || 0) -
      (totalWithdrawn._sum.amount || 0) -
      (pendingWithdrawals._sum.amount || 0);

    return responseService.success({
      message: "Balance summary fetched successfully",
      data: {
        totalIncome: totalIncome._sum.amount || 0,
        totalWithdrawn: totalWithdrawn._sum.amount || 0,
        pendingWithdrawals: pendingWithdrawals._sum.amount || 0,
        availableBalance: Math.max(availableBalance, 0),
        currency: "NGN",
      },
    });
  }

  // Create withdrawal request
  static async createWithdrawalRequest(doctorId: string, amount: number) {
    // Check available balance
    const balanceSummary = await this.getDoctorBalanceSummary(doctorId);
    // @ts-ignore
    const availableBalance = balanceSummary.data.availableBalance!;

    if (amount > availableBalance) {
      return responseService.error({
        message: "Insufficient balance for withdrawal",
        status: 400,
      });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        doctorId,
        amount,
        status: WithdrawalStatus.PENDING,
        reference: generateWithdrawalReference(),
      },
      include: {
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return responseService.success({
      message: "Withdrawal request created successfully",
      data: withdrawal,
    });
  }

  static async getWithdrawals(filters?: any) {
    try {
      const withdrawals = await prisma.withdrawal.findMany({
        where: filters,
        include: {
          doctor: true,
        },
      });

      return responseService.success({
        message: "Withdrawals fetched successfully",
        data: withdrawals,
      });
    } catch (error: any) {
      logger.error("Error fetching withdrawals", {
        error: error.message,
        stack: error.stack,
      });
      return responseService.error({
        message: "Failed to fetch withdrawals",
        error: error.message,
      });
    }
  }

  // static async updateWithdrawalStatus(
  //   withdrawalId: string,
  //   status: WithdrawalStatus
  // ) {
  //   try {
  //     const withdrawal = await prisma.withdrawal.update({
  //       where: { id: withdrawalId },
  //       data: { status },
  //     });

  //     return responseService.success({
  //       message: `Withdrawal ${status.toLowerCase()} successfully`,
  //       data: withdrawal,
  //     });
  //   } catch (error: any) {
  //     logger.error("Error updating withdrawal status", {
  //       error: error.message,
  //       stack: error.stack,
  //       withdrawalId,
  //     });
  //     return responseService.error({
  //       message: "Failed to update withdrawal status",
  //       error: error.message,
  //     });
  //   }
  // }

  // Get single withdrawal request details
  static async getWithdrawalRequestDetails(withdrawalId: string) {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            phoneNumber: true,
            BankAccount: true,
          },
        },
      },
    });

    if (!withdrawal) {
      return responseService.notFoundError({
        message: "Withdrawal request not found",
      });
    }

    return responseService.success({
      message: "Withdrawal request details fetched successfully",
      data: {
        id: withdrawal.id,
        type: "withdrawal_request",
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        updatedAt: withdrawal.updatedAt,
        reference: withdrawal.reference,
        doctor: withdrawal.doctor,
        description: `Withdrawal Request`,
        statusHistory: withdrawal.statusHistory || [],
        adminNotes: withdrawal.adminNotes || null,
      },
    });
  }

  static async getPaymentDetails(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
            phoneNumber: true,
          },
        },
        consultation: {
          select: {
            id: true,
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return responseService.notFoundError({
        message: "Payment not found",
      });
    }

    return responseService.success({
      message: "Payment details fetched successfully",
      data: {
        id: payment.id,
        type: "payment",
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
        reference: payment.transactionId,
        doctor: payment.doctor,
        description: `payments for consultation`,
      },
    });
  }

  // Bulk update withdrawal statuses
  static async bulkUpdateWithdrawalStatus(
    withdrawalIds: string[],
    newStatus: "approved" | "rejected",
    adminId?: string,
    adminNotes?: string
  ) {
    const results = await Promise.allSettled(
      withdrawalIds.map((id) =>
        this.updateWithdrawalStatus(id, newStatus, adminId, adminNotes)
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return responseService.success({
      message: `Bulk update completed: ${successful} successful, ${failed} failed`,
      data: {
        successful,
        failed,
        results: results.map((result, index) => ({
          withdrawalId: withdrawalIds[index],
          status: result.status,
          ...(result.status === "rejected" && { error: result.reason }),
        })),
      },
    });
  }

  // Update withdrawal request status
  static async updateWithdrawalStatus(
    withdrawalId: string,
    newStatus: string,
    adminId?: string,
    adminNotes?: string
  ) {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!withdrawal) {
      return responseService.notFoundError({
        message: "Withdrawal request not found",
      });
    }

    // Create status history entry
    const currentStatusHistory = Array.isArray(withdrawal.statusHistory)
      ? (withdrawal.statusHistory as unknown as WithdrawalStatusHistoryEntry[])
      : [];

    const newStatusEntry: WithdrawalStatusHistoryEntry = {
      status:
        newStatus === "completed"
          ? WithdrawalStatus.COMPLETED
          : WithdrawalStatus.REJECTED,
      changedBy: adminId || "system",
      changedAt: new Date().toISOString(),
      notes: adminNotes || "",
      previousStatus: withdrawal.status,
    };

    const updatedStatusHistory = [...currentStatusHistory, newStatusEntry];

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      statusHistory: updatedStatusHistory,
      updatedAt: new Date(),
    };

    // Add optional fields
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    // Add conditional fields
    if (newStatus === WithdrawalStatus.COMPLETED.toLocaleLowerCase()) {
      updateData.completedAt = new Date();
    }
    if (newStatus === WithdrawalStatus.REJECTED.toLocaleLowerCase()) {
      updateData.rejectedAt = new Date();
    }

    // Update withdrawal
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: updateData,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    // TODO: Send notification to doctor about status change
    // You can implement email/push notification here

    return responseService.success({
      message: `Withdrawal request ${newStatus} successfully`,
      data: {
        id: updatedWithdrawal.id,
        status: updatedWithdrawal.status,
        amount: updatedWithdrawal.amount,
        doctor: updatedWithdrawal.doctor,
        statusHistory: updatedWithdrawal.statusHistory,
        updatedAt: updatedWithdrawal.updatedAt,
      },
    });
  }
  // System Configuration
  static async updateCommissionRate(rate: number) {
    try {
      // This would typically update a system configuration table
      // For now, we'll just return a success response
      return responseService.success({
        message: "Commission rate updated successfully",
        data: { rate },
      });
    } catch (error: any) {
      logger.error("Error updating commission rate", {
        error: error.message,
        stack: error.stack,
      });
      return responseService.error({
        message: "Failed to update commission rate",
        error: error.message,
      });
    }
  }

  // API Monitoring
  static async getApiLogs(filters?: any) {
    try {
      // This would typically query an API logs table
      // For now, we'll just return a mock response
      return responseService.success({
        message: "API logs fetched successfully",
        data: [
          {
            id: "1",
            endpoint: "/api/consultations/meet",
            status: "success",
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } catch (error: any) {
      logger.error("Error fetching API logs", {
        error: error.message,
        stack: error.stack,
      });
      return responseService.error({
        message: "Failed to fetch API logs",
        error: error.message,
      });
    }
  }
}
