import express, { Router } from 'express';
import patientRoutes from './patient.routes';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import notificationRoutes from './notification.routes';
import profileRoutes from './profile.routes';
import doctorRoutes from './doctor.routes';
import adminRoutes from './admin.routes';
import logger from '../logger';
import { SearchController } from '../controller/search.controller';
import { authenticate } from '../middleware/auth.middleware';

const router: Router = express.Router();

logger.info('Initializing API routes');

// API Routes
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/admin', adminRoutes);
router.use('/', authRoutes);
router.use('/', chatRoutes);
router.use('/', notificationRoutes);
router.use('/', profileRoutes);

router.get('/search', authenticate, SearchController.search);

logger.debug('Routes initialized', {
    routes: ['/patients', '/doctors', '/admin', '/']
});

export default router; 