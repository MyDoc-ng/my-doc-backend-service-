import express, { Router } from 'express';
import { AppointmentController } from '../controller/appointment.controller';
import authenticate from '../middleware/authMiddleware';
import { validateData } from '../middleware/validationMiddleware';
import { appointmentSchema } from '../schema/appointment.schema';


const appointmentController = new AppointmentController();


const router: Router = express.Router();

router.get('/appointments', authenticate, appointmentController.getAppointments);
// router.get('/appointments/:id', authenticate, appointmentController.getAppointment);
router.post('/appointments', authenticate, validateData(appointmentSchema), appointmentController.createAppointment);

router.get('/appointments/upcoming', authenticate, appointmentController.getUpcomingAppointment);

export default router;
