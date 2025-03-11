import express, { Router } from "express";
import { AppointmentController } from "../controller/appointment.controller";
import authenticate from "../middleware/authMiddleware";
import { validateData } from "../middleware/validationMiddleware";
import { appointmentSchema } from "../schema/appointment.schema";
import { BookingController } from "../controller/booking.controller";

const appointmentController = new AppointmentController();
const bookingController = new BookingController();

const router: Router = express.Router();

router.get(
  "/appointments",
  authenticate,
  appointmentController.getAppointments
);
// router.get('/appointments/:id', authenticate, appointmentController.getAppointment);
router.post(
  "/appointments",
  authenticate,
  validateData(appointmentSchema),
  appointmentController.createAppointment
);

router.get(
  "/appointments/upcoming",
  authenticate,
  appointmentController.getUpcomingAppointment
);

// GOPD Consultation
router.post(
  "/gopd/start",
  [authenticate],
  bookingController.startGopdConsultation
);

export default router;
