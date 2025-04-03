import express, { Router } from "express";
import { ConsultationController } from "../controller/consultation.controller";
import { authenticate } from "../middleware/authMiddleware";

// const appointmentController = new AppointmentController();

const router: Router = express.Router();

router.get('/appointments/doctor/:doctorId', [authenticate], ConsultationController.getDoctorConsultations);

// router.get(
//   "/appointments",
//   authenticate,
//   ConsultationController.getAppointments
// );
// router.get('/appointments/:id', authenticate, appointmentController.getAppointment);
// router.post(
//   "/appointments",
//   authenticateUser,
//   validateData(appointmentSchema),
//   appointmentController.createAppointment
// );

// router.get(
//   "/appointments/upcoming",
//   [authenticateUser, authenticateAdmin],
//   appointmentController.getUpcomingAppointment
// );


router.get("/:id", ConsultationController.getConsultationById);


export default router;
