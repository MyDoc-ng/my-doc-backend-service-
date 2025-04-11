import express, { Router } from 'express';
import { validateData } from '../middleware/validation.middleware';
import logger from '../logger';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { DoctorController } from '../controller/doctor.controller';
import { UserController } from '../controller/user.controller';
import { appointmentSchema, cancelSchema, gopdSchema } from '../schema/appointment.schema';
import { NotificationController } from '../controller/notification.controller';
import { reviewDoctorSchema } from '../schema/doctor.schema';

const router: Router = express.Router();

logger.debug('Configuring user routes');

//! All Users Endpoints
router.get('/', authenticate, UserController.getUsers);

//! Consultation Endpoints
router.get('/appointments/upcoming/:userId', authenticate, authorize(['PATIENT']), UserController.getUpcomingConsultations);
router.get('/appointments/pending/:userId', authenticate, authorize(['PATIENT']), UserController.getPendingConsultations);
router.get('/appointments/completed/:userId', authenticate, authorize(['PATIENT']), UserController.getCompletedConsultations);
router.get('/appointments/cancelled/:userId', authenticate, authorize(['PATIENT']), UserController.getCancelledConsultations);
router.post("/appointments/gopd", authenticate, authorize(['PATIENT']), validateData(gopdSchema), UserController.bookGOPDConsultation);
router.post("/appointments", authenticate, authorize(['PATIENT']), validateData(appointmentSchema), UserController.bookConsultation);
router.post("/appointments/cancel/:appointmentId", authenticate, authorize(['PATIENT']), validateData(cancelSchema), UserController.cancelAppointment);

//! Doctor Endpoints
router.get("/doctors/gp", authenticate, UserController.generalPractitioners);
router.get("/doctors/specializations", authenticate, UserController.getSpecializations);
router.get("/doctors/:doctorId", authenticate, UserController.getDoctorById);
router.get("/doctors/specialty/:specialty", authenticate, UserController.getDoctorsBySpecialty);


//! Reviews Endpoints
router.post('/reviews', authenticate, validateData(reviewDoctorSchema), UserController.reviewDoctor);
router.get("/reviews/:doctorId", authenticate, UserController.getDoctorReviews);


// tell frontend to include these scopes 
//TODO openid profile email 

router.get("/doctors", authenticate, DoctorController.index);


export default router;
