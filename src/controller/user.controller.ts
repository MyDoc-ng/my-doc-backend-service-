import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { log } from 'console';

const userService = new UserService();


export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getUsers();
      
      res.json(users);
    } catch (error: any) {
        
        next(error)
    }
  }
}