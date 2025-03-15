import express, { Router } from 'express';
import { AuthController } from '../controller/auth.controller';
import { validateData } from '../middleware/validationMiddleware';
import { userBiodataSchema, userLoginSchema, userRegisterSchema } from '../schema/user.schema';
import { upload } from '../middleware/upload';

const router: Router = express.Router();

// User registration route
//@ts-ignore
router.post('/register', validateData(userRegisterSchema), AuthController.register);

// User login route
router.post('/login', validateData(userLoginSchema), AuthController.login);

router.post('/refresh-token', AuthController.refreshToken);

router.put('/submit-biodata', validateData(userBiodataSchema), AuthController.submitBiodata);

router.put("/upload-photo", upload.single("photo"), AuthController.uploadUserPhoto);

router.post('/google-login', AuthController.googleAuth);
// tell frontend to include these scopes 
//TODO openid profile email 

router.get('/verify-email', AuthController.verifyEmail);

export default router;
