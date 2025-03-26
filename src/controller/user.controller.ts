import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import logger from '../logger';
import { DoctorService } from '../services/doctor.service';
import { ConsultationService } from '../services/consultation.service';
import { chatSchema } from '../schema/chatValidation.schema';


export class UserController {
  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserService.getUsers();

      res.json(users);
    } catch (error: any) {

      next(error)
    }
  }

  static async getUpcomingConsultations(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const userConsultations = await UserService.getUpcomingConsultations(req.params.userId);
      res.status(200).json(userConsultations);
    } catch (error) {
      next(error)
    }
  }

  static async generalPractitioners(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Fetching general practitioners');
      const doctors = await DoctorService.getGeneralPractitioners();
      logger.debug('General practitioners fetched successfully', { count: doctors.length });

      res.status(200).json(doctors);
    } catch (error: any) {
      logger.error('Error fetching general practitioners', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  static async getSpecializations(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Fetching general practitioners');
      const doctors = await DoctorService.getSpecializations();
      logger.debug('General practitioners fetched successfully', { count: doctors.length });

      res.status(200).json(doctors);
    } catch (error: any) {
      logger.error('Error fetching general practitioners', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  static async getDoctorById(req: Request, res: Response, next: NextFunction) {

    try {
      const { doctorId } = req.params;

      logger.info('Fetching doctor by id', { doctorId });
      const doctor = await DoctorService.getDoctorById(doctorId);
      logger.debug('Doctor fetched successfully', { doctor });

      res.status(200).json(doctor);
    } catch (error: any) {
      logger.error('Error fetching the doctor ', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  static async bookGOPDConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const consultation = await ConsultationService.bookGOPDConsultation(req.body);
      res.status(200).json(consultation);
    } catch (error: any) {
      next(error)
      res.status(500).json({ message: error.message });
    }
  }

  static async bookConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const consultation = await ConsultationService.bookConsultation(req.body);
      res.status(200).json(consultation);
    } catch (error: any) {
      next(error)
      res.status(500).json({ message: error.message });
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = req.body;

      const newMessage = await UserService.sendMessage(validatedData);
      res.status(201).json({ success: true, message: newMessage });
    } catch (error: any) {
      next(error)
    }
  };

  static async getUserMessages(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.params;

    try {
      const messages = await UserService.getUserMessages(userId);
      res.json({ success: true, messages });
    } catch (error: any) {
      next(error)
      // res.status(500).json({ error: "Failed to fetch messages" });
    }
  };

}