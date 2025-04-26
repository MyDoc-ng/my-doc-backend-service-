import express, { Router } from "express";
import { DoctorController } from "../controller/doctor.controller";
import { ConsultationController } from "../controller/consultation.controller";
import { validateData } from "../middleware/validation.middleware";
import logger from '../logger';
import { authenticate, authorize } from "../middleware/auth.middleware";
import { appointmentSchema, cancelSchema, rescheduleAppointmentSchema } from "../schema/appointment.schema";
import { SearchController } from "../controller/search.controller";
import { BankController } from "../controller/bank.controller";
import { bankAccountSchema } from "../schema/bank.schema";

const router: Router = express.Router();

logger.debug('Configuring doctor routes');

// Route to initiate Google OAuth2 flow for doctor
router.get("/google/callback", DoctorController.oAuth2Callback);
router.get("/google/:doctorId", DoctorController.googleOAuth2);
router.get("/", authenticate, DoctorController.index);

router.get("/profile", authenticate, DoctorController.profile);
router.get("/documents", authenticate, DoctorController.documents);

router.get("/top", authenticate, DoctorController.topDoctors);
router.get("/general-practitioners", authenticate, DoctorController.generalPractitioners);
router.get("/:doctorId/availability", authenticate, ConsultationController.getDoctorAvailability);

router.get("/appointments", authenticate, authorize(['DOCTOR']), DoctorController.getAppointments);
router.get("/appointments/view/:appointmentId", authenticate, authorize(['DOCTOR']), DoctorController.getAppointmentById);
router.get("/appointments/history", authenticate, authorize(['DOCTOR']), DoctorController.getAppointmentHistory);
router.patch("/appointments/:id/accept", authenticate, authorize(['DOCTOR']), DoctorController.acceptAppointment);
router.patch("/appointments/:id/cancel", authenticate, authorize(['DOCTOR']), validateData(cancelSchema), DoctorController.cancelAppointment);
router.patch("/appointments/:id/reschedule", authenticate, authorize(['DOCTOR']),  validateData(rescheduleAppointmentSchema), DoctorController.rescheduleAppointment);
router.get("/doctor/patients-seen", authenticate, DoctorController.getPatientsSeen);

router.get("/chat/:patientId", authenticate, DoctorController.getChat);
router.post("/chat/:patientId", authenticate, DoctorController.sendMessage);
router.post("/medical-notes/:appointmentId", authenticate, DoctorController.addMedicalNote);
router.get("/patient-history/:patientId", authenticate, DoctorController.getPatientHistory);
router.post("/referrals/:patientId", authenticate, DoctorController.referPatient);
router.get("/balance", authenticate, DoctorController.getBalance);
router.get("/transaction-history", authenticate, DoctorController.transactionHistory);
router.post("/withdraw", authenticate, DoctorController.requestWithdrawal);

// Search Endpoint
router.get("/search", authenticate, SearchController.searchDoctors);

// Payment endpoints
router.post("/payments/account", authenticate, validateData(bankAccountSchema), BankController.addBankAccount);
router.get("/payments/account", authenticate, BankController.getBankAccount);
// router.post("/payments/verify", authenticate, DoctorController.verifyPayment);
export default router;

