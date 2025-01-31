import express, { Router } from 'express';
import { register, login, submitBiodata } from '../controller/authController';
import { validateData } from '../middleware/validationMiddleware';
import { userBiodataSchema, userLoginSchema, userRegisterSchema } from '../schema/userSchema';

const router: Router = express.Router();

// User registration route
router.post('/register', validateData(userRegisterSchema), register);

// User login route
router.post('/login', validateData(userLoginSchema), login);

router.post('/submit-biodata', validateData(userBiodataSchema), submitBiodata);

export default router;
