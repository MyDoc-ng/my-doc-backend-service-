import { Request, Response } from 'express';
import * as authService from '../services/authService';

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};


// Register a new user
export const submitBiodata = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authService.submitBiodata(req.body);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Login user and generate a JWT token
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: { email: string; password: string } = req.body;
    const result = await authService.loginUser(email, password);

    if (result.token) {
      res.json(result);
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
