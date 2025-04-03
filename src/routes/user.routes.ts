import express, { Router } from 'express';
import { validateData } from '../middleware/validationMiddleware';
import logger from '../logger';
import { updatePasswordSchema, updateProfileSchema, userBiodataSchema, userLoginSchema, userRegisterSchema } from '../schema/user.schema';
import { AuthController } from '../controller/auth.controller';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { DoctorController } from '../controller/doctor.controller';
import { upload } from '../middleware/upload';
import { UserController } from '../controller/user.controller';
import { appointmentSchema, cancelSchema, gopdSchema } from '../schema/appointment.schema';
import { NotificationController } from '../controller/notification.controller';
import { chatSchema } from '../schema/chat.schema';
import { uploadVoice } from '../middleware/uploadVoice';
import { reviewDoctorSchema } from '../schema/doctor.schema';

const router: Router = express.Router();

logger.debug('Configuring user routes');

//! Auth Enpoints
// @ts-ignore
router.post('/register', validateData(userRegisterSchema), AuthController.register);
router.put('/submit-biodata', validateData(userBiodataSchema), AuthController.submitBiodata);
router.put("/upload-photo", upload.single("photo"), AuthController.uploadUserPhoto);
router.post('/google-login', AuthController.googleAuth);
router.get('/verify-email', AuthController.verifyEmail);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/login', validateData(userLoginSchema), AuthController.login);
router.post('/logout', AuthController.logout);

//! All Users Endpoints
router.get('/', [authenticate], UserController.getUsers);

//! Consultation Endpoints
router.get('/appointments/pending/:userId', [authenticate, authorize(['PATIENT'])], UserController.getPendingConsultations);
router.get('/appointments/upcoming/:userId', [authenticate, authorize(['PATIENT'])], UserController.getUpcomingConsultations);
router.get('/appointments/completed/:userId', [authenticate, authorize(['PATIENT'])], UserController.getCompletedConsultations);
router.get('/appointments/cancelled/:userId', [authenticate, authorize(['PATIENT'])], UserController.getCancelledConsultations);
router.post("/appointments/gopd", [authenticate, authorize(['PATIENT'])], validateData(gopdSchema), UserController.bookGOPDConsultation);
router.post("/appointments", [authenticate, authorize(['PATIENT'])], validateData(appointmentSchema), UserController.bookConsultation);
router.post("/appointments/cancel/:appointmentId", [authenticate, authorize(['PATIENT'])], validateData(cancelSchema), UserController.cancelAppointment);



//! Doctor Endpoints
router.get("/doctors/gp", [authenticate], UserController.generalPractitioners);
router.get("/doctors/specializations", [authenticate], UserController.getSpecializations);
router.get("/doctors/:doctorId", [authenticate], UserController.getDoctorById);
router.get("/doctors/specialty/:specialty", [authenticate], UserController.getDoctorsBySpecialty);


//! Reviews Endpoints
router.post('/reviews', authenticate, validateData(reviewDoctorSchema), UserController.reviewDoctor);
router.get("/reviews/:doctorId", [authenticate], UserController.getDoctorReviews);


//! Notification Endpoints
router.get("/notifications", authenticate, NotificationController.getNotifications);
router.patch("/notifications/:id/read", authenticate, NotificationController.markNotificationAsRead);
router.patch("/notifications/read-all", authenticate, NotificationController.markAllNotificationsAsRead);

//! Chat Endpoints
router.post("/chats/send", authenticate, validateData(chatSchema), UserController.sendMessage);
router.get("/chats/:userId", authenticate, UserController.getMessages);
router.post("/chats/voice", authenticate, uploadVoice.single("voice"), UserController.sendVoiceMessage);

// ! Profile Endpoints
// router.get('/profile', authenticate, UserController.getProfile);
router.put("/profile", authenticate, validateData(updateProfileSchema), UserController.updateProfile);
//@ts-ignore
router.post("/change-password", authenticate, validateData(updatePasswordSchema), UserController.changePassword);
router.delete("/delete-account", authenticate, UserController.deleteAccount);
// tell frontend to include these scopes 
//TODO openid profile email 

router.get("/doctors", authenticate, DoctorController.index);


export default router;
