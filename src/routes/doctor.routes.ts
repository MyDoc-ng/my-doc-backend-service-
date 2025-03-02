import express, { Router } from "express";
import authenticate from "../middleware/authMiddleware";
import { DoctorController } from "../controller/doctor.controller";
import { BookingController } from "../controller/booking.controller";
import { WalletController } from "../controller/wallet.controller";

const router: Router = express.Router();

const doctorController = new DoctorController();
const bookingController = new BookingController();
const walletController = new WalletController();

router.get("/doctors", [authenticate], doctorController.getDoctors);
router.get("/doctors/top", [authenticate], doctorController.getTopDoctors);
// router.get('/doctors', bookingController.searchDoctors);
router.get(
  "/doctors/:doctorId/availability",
  [authenticate],
  bookingController.getDoctorAvailability
);
// router.post("/appointments", [authenticate], bookingController.bookAppointment);

// GOPD Consultation
router.post(
  "/gopd/start",
  [authenticate],
  bookingController.startGopdConsultation
);

// Wallet
router.post("/wallet/top-up", [authenticate], walletController.topUpWallet);

export default router;
