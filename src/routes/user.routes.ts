import express, { Router } from 'express';
import { validateData } from '../middleware/validationMiddleware';
import logger from '../logger';
import { userBiodataSchema, userLoginSchema, userRegisterSchema } from '../schema/user.schema';
import { AuthController } from '../controller/auth.controller';
import { authenticateUser } from '../middleware/authMiddleware';
import { DoctorController } from '../controller/doctor.controller';
import { upload } from '../middleware/upload';
import { UserController } from '../controller/user.controller';
import { appointmentSchema } from '../schema/appointment.schema';

const router: Router = express.Router();

logger.debug('Configuring user routes');

//! Auth Enpoints
// @ts-ignore
router.post('/register', validateData(userRegisterSchema), AuthController.register);
router.post('/login', validateData(userLoginSchema), AuthController.login);
router.put('/submit-biodata', validateData(userBiodataSchema), AuthController.submitBiodata);
router.post('/refresh-token', AuthController.refreshToken);
router.put("/upload-photo", upload.single("photo"), AuthController.uploadUserPhoto);
router.post('/google-login', AuthController.googleAuth);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/logout', AuthController.logout);

// All Users Endpoints
router.get('/', [authenticateUser], UserController.getUsers);

// Consultation Endpoints
router.get('/upcoming-appointments/:userId', [authenticateUser], UserController.getUpcomingConsultations);
router.post("/appointments/gopd", [authenticateUser],
    validateData(appointmentSchema), UserController.bookGOPDConsultation);
  

// Doctor Endpoints
router.get("/general-practitioners", [authenticateUser], UserController.generalPractitioners);









// tell frontend to include these scopes 
//TODO openid profile email 


// Profile routes
// router.get('/profile', authenticateUser, UserController.getProfile);
// router.put('/profile', authenticate, UserController.updateProfile);

// Appointment routes
// router.get('/appointments', authenticate, UserController.getAppointments);
// router.post('/appointments', authenticate, UserController.createAppointment);
router.get("/doctors", authenticateUser, DoctorController.index);



export default router;
