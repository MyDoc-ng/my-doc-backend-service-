import express, { Router } from "express";
import { DoctorController } from "../controller/doctor.controller";
import { ConsultationController } from "../controller/consultation.controller";
import { validateData } from "../middleware/validationMiddleware";
import { DoctorSignupSchema } from "../schema/doctorSignup.schema";
import logger from '../logger';
import { authenticateDoctor } from "../middleware/authMiddleware";

const router: Router = express.Router();

const consultationController = new ConsultationController();

logger.debug('Configuring doctor routes');

// Route to initiate Google OAuth2 flow for doctor
router.get("/auth/google/doctor/:doctorId", DoctorController.googleOAuth2);
router.get("/auth/doctor/google/callback", DoctorController.oAuth2Callback);
router.get("/", authenticateDoctor, DoctorController.index);

router.get("/:id", authenticateDoctor, DoctorController.show);

router.get("/top", authenticateDoctor, DoctorController.topDoctors);
router.get(
  "/general-practitioners",
  authenticateDoctor,
  DoctorController.generalPractitioners
);

router.get(
  "/:doctorId/availability",
  authenticateDoctor,
  consultationController.getDoctorAvailability
);

router.post('/auth/register', validateData(DoctorSignupSchema), DoctorController.store);
router.post('/auth/login', validateData(DoctorSignupSchema), DoctorController.store);


export default router;
