import express, { Router } from "express";
import { DoctorController } from "../controller/doctor.controller";
import { ConsultationController } from "../controller/consultation.controller";
import { validateData } from "../middleware/validationMiddleware";
import { doctorLoginSchema, doctorSignupSchema } from "../schema/doctor.schema";
import logger from '../logger';
import { authenticate } from "../middleware/authMiddleware";
import { uploadFiles } from "../middleware/uploadMiddleware";

const router: Router = express.Router();

logger.debug('Configuring doctor routes');

// Route to initiate Google OAuth2 flow for doctor
router.get("/google/doctor/:doctorId", DoctorController.googleOAuth2);
router.get("/doctor/google/callback", DoctorController.oAuth2Callback);
router.get("/", authenticate, DoctorController.index);

// router.get("/:id", authenticate, DoctorController.show);

router.get("/top", authenticate, DoctorController.topDoctors);
router.get("/general-practitioners", authenticate, DoctorController.generalPractitioners);

router.get("/:doctorId/availability", authenticate, ConsultationController.getDoctorAvailability);

//@ts-ignore
router.post('/register', validateData(doctorSignupSchema), DoctorController.store);
router.post('/login', validateData(doctorLoginSchema), DoctorController.store);
router.put("/upload-cerifications", uploadFiles, DoctorController.uploadCertification);



export default router;
