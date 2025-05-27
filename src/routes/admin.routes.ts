import express, { Router } from "express";
import logger from "../logger";
import { authenticate } from "../middleware/auth.middleware";
import { AdminController } from "../controller/admin.controller";
import { validateData } from "../middleware/validation.middleware";
import { doctorLoginSchema, doctorSignupSchema } from "../schema/doctor.schema";
import {
  userStatusSchema,
  doctorStatusSchema,
  disputeResolutionSchema,
  withdrawalStatusSchema,
  commissionRateSchema,
  consultationFilterSchema,
  disputeFilterSchema,
  paymentFilterSchema,
  withdrawalFilterSchema,
} from "../schema/admin.schema";
import { cancelSchema } from "../schema/appointment.schema";

const router: Router = express.Router();

logger.debug("Configuring admin routes");

// Dashboard
router.get("/dashboard", authenticate, AdminController.getDashboard);

// Patients management
router.get("/patients", authenticate, AdminController.getPatients);
router.put(
  "/patients/:userId/status",
  authenticate,
  validateData(userStatusSchema),
  AdminController.updateUserStatus
);

// Doctor management
router.get("/doctors", authenticate, AdminController.getDoctors);
router.put(
  "/doctors/:doctorId/status",
  authenticate,
  validateData(doctorStatusSchema),
  AdminController.updateDoctorStatus
);

// Consultation management
router.get("/consultations", authenticate, AdminController.getConsultations);

// Dispute management
router.get("/disputes", authenticate, AdminController.getDisputes);
router.put(
  "/disputes/:disputeId/resolve",
  authenticate,
  validateData(disputeResolutionSchema),
  AdminController.resolveDispute
);

// Payment management
// Specific category endpoints
router.get(
  "/payments/requests",
  authenticate,
  AdminController.getPaymentRequests
);
router.get(
  "/payments/received",
  authenticate,
  AdminController.getPaymentsReceived
);
router.get(
  "/payments/income",
  authenticate,
  AdminController.getIncomeTransactions
);
router.get(
  "/payments/history",
  authenticate,
  AdminController.getTransactionHistory
);
router.get("/transactions", authenticate, AdminController.getAllTransactions);
router.get("/withdrawals", authenticate, AdminController.getWithdrawals);
router.put(
  "/withdrawals/:withdrawalId/status",
  authenticate,
  validateData(withdrawalStatusSchema),
  AdminController.updateWithdrawalStatus
);

// System configuration
router.put(
  "/config/commission",
  authenticate,
  validateData(commissionRateSchema),
  AdminController.updateCommissionRate
);

// API monitoring
router.get("/api-logs", authenticate, AdminController.getApiLogs);

//! Auth Enpoints
// @ts-ignore
router.post("/register", validateData(doctorSignupSchema), AdminController.store);
router.post("/login", validateData(doctorLoginSchema), AdminController.store);

export default router;
