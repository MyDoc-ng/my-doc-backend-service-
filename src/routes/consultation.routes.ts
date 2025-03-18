import express, { Router } from "express";
import { AppointmentController } from "../controller/appointment.controller";
import { authenticateAdmin, authenticateDoctor, authenticateUser } from "../middleware/authMiddleware";
import { validateData } from "../middleware/validationMiddleware";
import { appointmentSchema } from "../schema/appointment.schema";
import { ConsultationController } from "../controller/consultation.controller";

// const appointmentController = new AppointmentController();

const router: Router = express.Router();

router.get('/appointments/doctor/:doctorId', [authenticateDoctor], ConsultationController.getDoctorConsultations);

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

// GOPD Consultation
router.post("/appointments/gopd", [authenticateUser],
  validateData(appointmentSchema), ConsultationController.bookGOPDConsultation);

router.put('/appointments/:id/approve', [authenticateAdmin, authenticateDoctor], ConsultationController.approveAppointment);

router.get("/:id", ConsultationController.getConsultationById);


export default router;
