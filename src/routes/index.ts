import express, { Router } from 'express';
import patientRoutes from './patient.routes';
import doctorRoutes from './doctor.routes';
import adminRoutes from './admin.routes';
import logger from '../logger';
import { SearchController } from '../controller/search.controller';
import { authenticate } from '../middleware/authMiddleware';
import { validateData } from '../middleware/validation.middleware';
import { userBiodataSchema, userLoginSchema, userRegisterSchema } from '../schema/user.schema';
import { AuthController } from '../controller/auth.controller';
import { upload } from '../middleware/upload';
import { emailVerified } from '../middleware/emailVerified.middleware';

const router: Router = express.Router();

logger.info('Initializing API routes');

// API Routes
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/admin', adminRoutes);

router.get('/search', authenticate, SearchController.search);
//@ts-ignore
// ! Generic Auth Endpoints
router.post('/register', validateData(userRegisterSchema), AuthController.register);
router.post('/login', validateData(userLoginSchema), AuthController.login);
router.put('/submit-biodata', validateData(userBiodataSchema), AuthController.submitBiodata);
router.put("/upload-photo", upload.single("photo"), AuthController.uploadUserPhoto);
router.post('/google-login', AuthController.googleAuth);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', authenticate, AuthController.logout);

logger.debug('Routes initialized', {
    routes: ['/patients', '/doctors', '/admin']
});

export default router; 