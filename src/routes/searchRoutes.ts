import express, { Router } from 'express';
import { SearchController } from '../controller/searchController';
import authenticate from '../middleware/authMiddleware';

const router: Router = express.Router();
const searchController = new SearchController();


router.get('/search', authenticate, searchController.search);

export default router;