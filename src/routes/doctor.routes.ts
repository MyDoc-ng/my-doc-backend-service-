import express, { Router } from "express";
import { DoctorController } from "../controller/doctor.controller";
import { ConsultationController } from "../controller/consultation.controller";
import { validateData } from "../middleware/validationMiddleware";
import { DoctorSignupSchema } from "../schema/doctorSignup.schema";
import logger from '../logger';
import { authenticate } from "../middleware/authMiddleware";

const router: Router = express.Router();

const consultationController = new ConsultationController();

logger.debug('Configuring doctor routes');

// Route to initiate Google OAuth2 flow for doctor
router.get("/auth/google/doctor/:doctorId", DoctorController.googleOAuth2);
router.get("/auth/doctor/google/callback", DoctorController.oAuth2Callback);
router.get("/", authenticate, DoctorController.index);

// router.get("/:id", authenticate, DoctorController.show);

router.get("/top", authenticate, DoctorController.topDoctors);
router.get(
  "/general-practitioners",
  authenticate,
  DoctorController.generalPractitioners
);

router.get(
  "/:doctorId/availability",
  authenticate,
  consultationController.getDoctorAvailability
);

router.post('/register', validateData(DoctorSignupSchema), DoctorController.store);
router.post('/auth/login', validateData(DoctorSignupSchema), DoctorController.store);


export default router;
