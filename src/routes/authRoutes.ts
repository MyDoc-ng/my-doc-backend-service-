import express, { Router } from 'express';
import { AuthController } from '../controller/authController';
import { validateData } from '../middleware/validationMiddleware';
import { userBiodataSchema, userLoginSchema, userRegisterSchema } from '../schema/userSchema';

const router: Router = express.Router();
const authController = new AuthController();

// User registration route
router.post('/register', validateData(userRegisterSchema), (req, res, next) => authController.register(req, res, next));

// User login route
router.post('/login', validateData(userLoginSchema), (req, res, next) => authController.login(req, res, next));

router.put('/submit-biodata', validateData(userBiodataSchema), (req, res, next) => authController.submitBiodata(req, res, next));

export default router;
