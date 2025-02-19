import { NextFunction, Request, Response } from 'express';
import { AppointmentService } from '../services/appointmentService';

const appointmentService = new AppointmentService();


export class AppointmentController {
  async getAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const appointments = await appointmentService.getAppointments();
      
      res.json(appointments);
    } catch (error: any) {
        
        next(error)
    }
  }
  async createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
    
    try {
      const appointments = await appointmentService.createAppointment(req.body);
      
      res.json(appointments);
    } catch (error: any) {
        
        next(error)
    }
  }
}