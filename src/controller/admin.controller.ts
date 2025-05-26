import { NextFunction, Request, Response } from "express";
import logger from "../logger";
import { AuthService } from "../services/auth.service";
import { AdminService } from "../services/admin.service";
import { ApprovalStatus } from "@prisma/client";

export class AdminController {
  // Dashboard
  static async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info("Fetching admin dashboard statistics");
      const result = await AdminService.getDashboardStats();
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error fetching dashboard statistics", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  // User Management
  static async getPatients(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info("Fetching all users");
      const result = await AdminService.getPatients();
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error fetching users", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  static async updateUserStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      logger.info("Updating user status", { userId, isActive });
      const result = await AdminService.updatePatientStatus(userId, isActive);
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error updating user status", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  // Doctor Management
  static async getDoctors(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status } = req.query;

      logger.info("Fetching all doctors", { status });

      const result = await AdminService.getDoctors(status as ApprovalStatus);

      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error fetching doctors", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  // static async updateDoctorStatus(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ): Promise<void> {
  //   try {
  //     const { doctorId } = req.params;
  //     const { isApproved } = req.body;

  //     logger.info("Updating doctor status", { doctorId, isApproved });
  //     const result = await AdminService.updateDoctorStatus(
  //       doctorId,
  //       isApproved
  //     );
  //     res.status(result.status || 200).json(result);
  //   } catch (error: any) {
  //     logger.error("Error updating doctor status", {
  //       error: error.message,
  //       stack: error.stack,
  //     });
  //     next(error);
  //   }
  // }

  // Consultation Management

  static async updateDoctorStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      const adminId = req.user?.id;
      const { action, reasons, otherReason, approvalData } = req.body;
  
      logger.info(`${action || 'unknown'} doctor request`, { 
        doctorId, 
        adminId,
        action, 
        reasons, 
        otherReason,
        approvalData 
      });
      
      const result = await AdminService.updateDoctorStatus(adminId, doctorId, action, reasons, otherReason, approvalData);
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error('Error updating doctor status', {
        error: error.message,
        stack: error.stack,
        doctorId: req.params.doctorId,
        action: req.body.action
      });
      next(error);
    }
  }

  static async getConsultations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters = req.query;
      logger.info("Fetching consultations", { filters });
      const result = await AdminService.getConsultations(filters);
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error fetching consultations", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  // Dispute Management
  static async getDisputes(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters = req.query;
      logger.info("Fetching disputes", { filters });
      const result = await AdminService.getDisputes(filters);
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error fetching disputes", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  static async resolveDispute(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { disputeId } = req.params;
      const { resolution, refund } = req.body;

      logger.info("Resolving dispute", { disputeId, resolution, refund });
      const result = await AdminService.resolveDispute(
        disputeId,
        resolution,
        refund
      );
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error resolving dispute", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  // Payment Management
  static async getPayments(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters = req.query;
      logger.info("Fetching payments", { filters });
      const result = await AdminService.getPayments(filters);
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error fetching payments", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  static async getWithdrawals(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters = req.query;
      logger.info("Fetching withdrawals", { filters });
      const result = await AdminService.getWithdrawals(filters);
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error fetching withdrawals", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  static async updateWithdrawalStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { withdrawalId } = req.params;
      const { status } = req.body;

      logger.info("Updating withdrawal status", { withdrawalId, status });
      const result = await AdminService.updateWithdrawalStatus(
        withdrawalId,
        status
      );
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error updating withdrawal status", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  // System Configuration
  static async updateCommissionRate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { rate } = req.body;

      logger.info("Updating commission rate", { rate });
      const result = await AdminService.updateCommissionRate(rate);
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error updating commission rate", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  // API Monitoring
  static async getApiLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters = req.query;
      logger.info("Fetching API logs", { filters });
      const result = await AdminService.getApiLogs(filters);
      res.status(result.status || 200).json(result);
    } catch (error: any) {
      logger.error("Error fetching API logs", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  // Auth
  static async store(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("Creating new doctor", {
        userData: { ...req.body, password: undefined }, // Log user data without sensitive information
      });

      const doctor = await AuthService.createUser(req.body);

      res.status(201).json({ message: "Doctor created successfully", doctor });
    } catch (error: any) {
      logger.error("Error creating doctor", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }
}
