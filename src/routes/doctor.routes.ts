import express, { Router } from "express";
import { DoctorController } from "../controller/doctor.controller";
import { ConsultationController } from "../controller/consultation.controller";
import { validateData } from "../middleware/validation.middleware";
import logger from '../logger';
import { authenticate, authorize } from "../middleware/auth.middleware";
import { uploadFiles } from "../middleware/uploadMiddleware";
import { cancelSchema } from "../schema/appointment.schema";

const router: Router = express.Router();

logger.debug('Configuring doctor routes');

// Route to initiate Google OAuth2 flow for doctor
router.get("/google/callback", DoctorController.oAuth2Callback);
router.get("/google/:doctorId", DoctorController.googleOAuth2);
router.get("/", authenticate, DoctorController.index);

router.get("/get-profile", authenticate, authorize(['DOCTOR']), DoctorController.profile);

router.get("/top", authenticate, DoctorController.topDoctors);
router.get("/general-practitioners", authenticate, DoctorController.generalPractitioners);

router.get("/:doctorId/availability", authenticate, ConsultationController.getDoctorAvailability);


router.get("/appointments", [authenticate, authorize(['DOCTOR'])], DoctorController.getAppointments);
router.get("/appointments/history", [authenticate, authorize(['DOCTOR'])], DoctorController.getAppointmentHistory);
router.patch("/appointments/:id/accept", [authenticate, authorize(['DOCTOR'])], DoctorController.acceptAppointment);
router.patch("/appointments/:id/cancel", [authenticate, authorize(['DOCTOR'])], validateData(cancelSchema), DoctorController.cancelAppointment);
router.patch("/appointments/:id/reschedule", [authenticate, authorize(['DOCTOR'])], DoctorController.rescheduleAppointment);
router.get("/doctor/patients-seen", authenticate, DoctorController.getPatientsSeen);
router.get("/doctor/earnings", authenticate, DoctorController.getEarnings);

router.get("/dashboard", authenticate, DoctorController.getDashboard);
// router.post("/appointments/accept/:id", authenticate, DoctorController.acceptAppointment);
router.post("/appointments/cancel/:id", authenticate, DoctorController.cancelAppointment);
router.post("/appointments/reschedule/:id", authenticate, DoctorController.rescheduleAppointment);
router.get("/chat/:patientId", authenticate, DoctorController.getChat);
router.post("/chat/:patientId", authenticate, DoctorController.sendMessage);
router.post("/medical-notes/:appointmentId", authenticate, DoctorController.addMedicalNote);
router.get("/patient-history/:patientId", authenticate, DoctorController.getPatientHistory);
router.post("/referrals/:patientId", authenticate, DoctorController.referPatient);
router.get("/earnings", authenticate, DoctorController.getEarnings);
router.post("/withdraw", authenticate, DoctorController.requestWithdrawal);

export default router;

