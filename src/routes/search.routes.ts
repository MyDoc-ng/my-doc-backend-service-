import express, { Router } from 'express';
import { SearchController } from '../controller/search.controller';
import { authenticateUser } from '../middleware/authMiddleware';

const router: Router = express.Router();


router.get('/search', authenticateUser, SearchController.search);

export default router;