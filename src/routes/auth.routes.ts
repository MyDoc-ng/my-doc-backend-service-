import express, { Router } from 'express';
import { AuthController } from '../controller/auth.controller';
import { validateData } from '../middleware/validationMiddleware';
import { userBiodataSchema, userLoginSchema, userRegisterSchema } from '../schema/user.schema';
import { upload } from '../middleware/upload';

const router: Router = express.Router();
const authController = new AuthController();

// User registration route
//@ts-ignore
router.post('/register', validateData(userRegisterSchema), authController.register);

// User login route
router.post('/login', validateData(userLoginSchema), authController.login);

router.put('/submit-biodata', validateData(userBiodataSchema), authController.submitBiodata);

router.put("/upload-photo", upload.single("photo"), authController.uploadUserPhoto);

router.post('/google', authController.googleAuth);

router.post('/apple', authController.appleAuth);

export default router;
