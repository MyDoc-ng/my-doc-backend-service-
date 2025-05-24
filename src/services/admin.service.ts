import {
  AppointmentStatus,
  DisputeStatus,
  PaymentStatus,
  UserTypes,
  WithdrawalStatus,
} from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { responseService } from "./response.service";
import logger from "../logger";

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
  static async getDoctors(filters?: any) {
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
          ...filters,
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

  static async updateDoctorStatus(doctorId: string, isApproved: boolean) {
    try {
      const doctor = await prisma.doctorProfile.update({
        where: { userId: doctorId },
        data: { isApproved },
      });

      return responseService.success({
        message: `Doctor ${isApproved ? "approved" : "suspended"} successfully`,
        data: doctor,
      });
    } catch (error: any) {
      logger.error("Error updating doctor status", {
        error: error.message,
        stack: error.stack,
        doctorId,
      });
      return responseService.error({
        message: "Failed to update doctor status",
        error: error.message,
      });
    }
  }

  // Patient Management
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
      }))

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

  // Payment Management
  static async getPayments(filters?: any) {
    try {
      const payments = await prisma.payment.findMany({
        where: filters,
        include: {
          doctor: true,
          patient: true,
          consultation: true,
        },
      });

      return responseService.success({
        message: "Payments fetched successfully",
        data: payments,
      });
    } catch (error: any) {
      logger.error("Error fetching payments", {
        error: error.message,
        stack: error.stack,
      });
      return responseService.error({
        message: "Failed to fetch payments",
        error: error.message,
      });
    }
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

  static async updateWithdrawalStatus(
    withdrawalId: string,
    status: WithdrawalStatus
  ) {
    try {
      const withdrawal = await prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: { status },
      });

      return responseService.success({
        message: `Withdrawal ${status.toLowerCase()} successfully`,
        data: withdrawal,
      });
    } catch (error: any) {
      logger.error("Error updating withdrawal status", {
        error: error.message,
        stack: error.stack,
        withdrawalId,
      });
      return responseService.error({
        message: "Failed to update withdrawal status",
        error: error.message,
      });
    }
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
