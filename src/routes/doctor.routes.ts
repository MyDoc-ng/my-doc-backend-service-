import express, { Router } from "express";
import authenticate from "../middleware/authMiddleware";
import { DoctorController } from "../controller/doctor.controller";
import { ConsultationController } from "../controller/consultation.controller";
import { validateData } from "../middleware/validationMiddleware";
import { DoctorSignupSchema } from "../schema/doctorSignupSchema";

const router: Router = express.Router();

const consultationController = new ConsultationController();

// Route to initiate Google OAuth2 flow for doctor
router.get("/auth/google/doctor/:doctorId", DoctorController.googleOAuth2);
router.get("/auth/google/doctor/callback", DoctorController.oAuth2Callback);
router.get("/doctors", [authenticate], DoctorController.index);

router.get("doctors/:id", [authenticate], DoctorController.show);

router.get("/doctors/top", [authenticate], DoctorController.topDoctors);
router.get(
  "/doctors/general-practitioners",
  [authenticate],
  DoctorController.generalPractitioners
);

router.get(
  "/doctors/:doctorId/availability",
  [authenticate],
  consultationController.getDoctorAvailability
);

router.post('/signup/doctor', validateData(DoctorSignupSchema), DoctorController.store);

export default router;
