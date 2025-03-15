import express, { Router } from "express";
import { AppointmentController } from "../controller/appointment.controller";
import authenticate from "../middleware/authMiddleware";
import { validateData } from "../middleware/validationMiddleware";
import { appointmentSchema } from "../schema/appointment.schema";
import { ConsultationController } from "../controller/consultation.controller";
import passport from "passport";

const appointmentController = new AppointmentController();
const consultationController = new ConsultationController();

const router: Router = express.Router();

router.get('/appointments/doctor/:doctorId', [authenticate], ConsultationController.getDoctorConsultations);

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
  consultationController.startGopdConsultation
);

router.post("/book/gopd", ConsultationController.bookConsultation);
router.get("/:id", ConsultationController.getConsultationById);


// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: clientID,
//       clientSecret: clientSecret,
//       callbackURL: "http://localhost:8000/auth/callback",
//     },
//     function (accessToken, refreshToken, profile, cb) {
//       console.log("refreshToken : ", refreshToken);
//       return cb();
//     }
//   )
// );

router.get(
  "/test/callback",
  passport.authenticate("google", { failureRedirect: "/" })
);

router.get(
  "/auth/test",
  passport.authenticate("google", {
    scope: ["profile", "https://www.googleapis.com/auth/calendar"],
    accessType: "offline",
    prompt: "consent",
  })
);



export default router;
