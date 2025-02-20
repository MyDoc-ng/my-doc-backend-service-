import express, { Router } from 'express';
import authenticate from '../middleware/authMiddleware';
import { DoctorController } from '../controller/doctor.controller';

const router: Router = express.Router();

const doctorController = new DoctorController();

router.get('/doctors', [authenticate], doctorController.getDoctors);  
router.get('/doctors/top', [authenticate], doctorController.getTopDoctors);  

export default router;
