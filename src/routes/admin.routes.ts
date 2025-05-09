import express, { Router } from 'express';
import logger from '../logger';
import { authenticate } from '../middleware/auth.middleware';
import { AdminController } from '../controller/admin.controller';
import { validateData } from '../middleware/validation.middleware';
import { doctorLoginSchema, doctorSignupSchema } from '../schema/doctor.schema';

const router: Router = express.Router();

logger.debug('Configuring admin routes');

// User management
router.get('/users', authenticate, AdminController.getUsers);
// router.get('/users/:id', authenticate, AdminController.getUser);
// router.put('/users/:id', authenticate, AdminController.updateUser);
// router.delete('/users/:id', authenticate, AdminController.deleteUser);

// // Doctor management
// router.get('/doctors', authenticate, AdminController.getAllDoctors);
// router.get('/doctors/:id', authenticate, AdminController.getDoctor);
// router.put('/doctors/:id', authenticate, AdminController.updateDoctor);
// router.delete('/doctors/:id', authenticate, AdminController.deleteDoctor);

// // Analytics routes
// router.get('/analytics/users', authenticate, AdminController.getUserAnalytics);
// router.get('/analytics/doctors', authenticate, AdminController.getDoctorAnalytics);
// router.get('/analytics/appointments', authenticate, AdminController.getAppointmentAnalytics);

//! Auth Enpoints
// @ts-ignore
router.post('/register', validateData(doctorSignupSchema), AdminController.store);
router.post('/login', validateData(doctorLoginSchema), AdminController.store);

export default router; 