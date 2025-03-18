import express, { Router } from 'express';
import logger from '../logger';
import { authenticateAdmin } from '../middleware/authMiddleware';
import { AdminController } from '../controller/admin.controller';
import { validateData } from '../middleware/validationMiddleware';
import { DoctorSignupSchema } from '../schema/doctorSignup.schema';

const router: Router = express.Router();

logger.debug('Configuring admin routes');

// User management
router.get('/users', authenticateAdmin, AdminController.getUsers);
// router.get('/users/:id', authenticateAdmin, AdminController.getUser);
// router.put('/users/:id', authenticateAdmin, AdminController.updateUser);
// router.delete('/users/:id', authenticateAdmin, AdminController.deleteUser);

// // Doctor management
// router.get('/doctors', authenticateAdmin, AdminController.getAllDoctors);
// router.get('/doctors/:id', authenticateAdmin, AdminController.getDoctor);
// router.put('/doctors/:id', authenticateAdmin, AdminController.updateDoctor);
// router.delete('/doctors/:id', authenticateAdmin, AdminController.deleteDoctor);

// // Analytics routes
// router.get('/analytics/users', authenticateAdmin, AdminController.getUserAnalytics);
// router.get('/analytics/doctors', authenticateAdmin, AdminController.getDoctorAnalytics);
// router.get('/analytics/appointments', authenticateAdmin, AdminController.getAppointmentAnalytics);

router.post('/auth/register', validateData(DoctorSignupSchema), AdminController.store);
router.post('/auth/login', validateData(DoctorSignupSchema), AdminController.store);



export default router; 