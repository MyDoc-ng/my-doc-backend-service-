import express, { Router } from 'express';
import { validateData } from '../middleware/validationMiddleware';
import logger from '../logger';
import { userRegisterSchema } from '../schema/user.schema';
import { UserController } from '../controller/user.controller';
import { AuthController } from '../controller/auth.controller';
import { authenticateUser } from '../middleware/authMiddleware';
import { DoctorController } from '../controller/doctor.controller';


const router: Router = express.Router();

logger.debug('Configuring user routes');

// Auth routes
// @ts-ignore
router.post('/auth/register', validateData(userRegisterSchema), AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/logout', AuthController.logout);

// Profile routes
// router.get('/profile', authenticateUser, UserController.getProfile);
// router.put('/profile', authenticate, UserController.updateProfile);

// Appointment routes
// router.get('/appointments', authenticate, UserController.getAppointments);
// router.post('/appointments', authenticate, UserController.createAppointment);
router.get("/doctors", authenticateUser, DoctorController.index);



export default router;
