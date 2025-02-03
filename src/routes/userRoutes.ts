import express, { Router } from 'express';
import { UserController } from '../controller/userController';

const router: Router = express.Router();

const userController = new UserController();

router.get('/users', (req, res, next) => userController.getUsers(req, res, next));

export default router;
