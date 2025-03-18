import { NextFunction, Request, Response } from "express";
import logger from "../logger";
import { DoctorService } from "../services/doctor.service";

export class AdminController {
    static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
      
    }

    static async store(req: Request, res: Response, next: NextFunction) {
      try {
        logger.info('Creating new doctor', { 
          userData: { ...req.body, password: undefined } // Log user data without sensitive information
        });
        
        const doctor = await DoctorService.createDoctors(req.body);
        logger.debug('Doctor created successfully', { doctorId: doctor.id });
  
        res.status(201).json({ message: 'Doctor created successfully', doctor });
      } catch (error: any) {
        logger.error('Error creating doctor', {
          error: error.message,
          stack: error.stack
        });
        next(error);
      }
    }
  }