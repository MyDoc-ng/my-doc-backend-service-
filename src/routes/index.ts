import express, { Router } from 'express';
import userRoutes from './user.routes';
import doctorRoutes from './doctor.routes';
import adminRoutes from './admin.routes';
import logger from '../logger';

const router: Router = express.Router();

logger.info('Initializing API routes');

// API Routes
router.use('/users', userRoutes);
router.use('/doctors', doctorRoutes);
router.use('/admin', adminRoutes);

logger.debug('Routes initialized', {
    routes: ['/users', '/doctors', '/admin']
});

export default router; 