import express, { Router } from "express";
import { validateData } from "../middleware/validation.middleware";
import { doctorComplianceSchema, newPasswordSchema, resetPasswordSchema, userBiodataSchema, userLoginSchema, userRegisterSchema } from "../schema/user.schema";
import { AuthController } from "../controller/auth.controller";
import { upload } from "../middleware/upload";
import { authenticate } from "../middleware/auth.middleware";
import { uploadFiles } from "../middleware/uploadMiddleware";

const router: Router = express.Router();
//@ts-ignore
// ! Generic Auth Endpoints
router.post('/register', validateData(userRegisterSchema), AuthController.register);
router.post('/login', validateData(userLoginSchema), AuthController.login);
router.put('/submit-biodata', validateData(userBiodataSchema), AuthController.submitBiodata);
router.put("/upload-photo", upload.single("photo"), AuthController.uploadUserPhoto);
router.post('/google-login', AuthController.googleAuth);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);

// ! Only Doctors
router.put('/upload-documents', uploadFiles, AuthController.uploadDocuments);
router.put('/compliance-check', validateData(doctorComplianceSchema), AuthController.updateDoctorCompliance);

// Password Reset Routes
router.post('/request-password-reset', validateData(resetPasswordSchema), AuthController.initiatePasswordReset);
router.post('/reset-password', validateData(newPasswordSchema), AuthController.resetPassword);

export default router;