import express, { Router } from 'express';
import userRoutes from './user.routes';
import doctorRoutes from './doctor.routes';
import adminRoutes from './admin.routes';
import logger from '../logger';
import { SearchController } from '../controller/search.controller';
import { authenticate } from '../middleware/authMiddleware';

const router: Router = express.Router();

logger.info('Initializing API routes');

// API Routes
router.use('/users', userRoutes);
router.use('/doctors', doctorRoutes);
router.use('/admin', adminRoutes);

router.get('/search', authenticate, SearchController.search);


logger.debug('Routes initialized', {
    routes: ['/users', '/doctors', '/admin']
});

export default router; 