import express, { Router } from 'express';
import { UserController } from '../controller/user.controller';
import authenticate from '../middleware/authMiddleware';
import { errorMiddleware } from '../middleware/errorMiddleware';

const router: Router = express.Router();

const userController = new UserController();

router.get('/users', [authenticate], userController.getUsers);  

export default router;
