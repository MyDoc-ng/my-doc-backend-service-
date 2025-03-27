import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import logger from '../logger';
import { DoctorService } from '../services/doctor.service';
import { ConsultationService } from '../services/consultation.service';
import { ChatService } from '../services/chat.service';
import { BadRequestException } from '../exception/bad-request';
import { ErrorCode } from '../exception/base';


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

      const newMessage = await ChatService.sendMessage(validatedData);
      res.status(201).json({ success: true, message: newMessage });
    } catch (error: any) {
      next(error)
    }
  }

  static async sendVoiceMessage(req: Request, res: Response, next: NextFunction) {

    try {
      if (!req.file) {
        throw new BadRequestException("No voice file uploaded", ErrorCode.BADREQUEST);
      }

      const serverUrl = `${req.protocol}://${req.get("host")}`;

      const messageData = {
        senderId: req.body.senderId,
        senderType: req.body.senderType,
        receiverId: req.body.receiverId,
        receiverType: req.body.receiverType,
        voiceUrl: `${serverUrl}/uploads/voicenotes/${req.file.filename}`,
      };

      const newMessage = await ChatService.uploadVoiceMessage(messageData);
      res.status(201).json({ success: true, message: newMessage });
    } catch (error: any) {
      next(error)
    }
  }

  static async getUserMessages(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.params;

    try {
      const messages = await ChatService.getUserMessages(userId);
      res.json({ success: true, messages });
    } catch (error: any) {
      next(error)
    }
  }

  static async reviewDoctor(req: Request, res: Response, next: NextFunction) {
    const { doctorId, userId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Invalid rating. Must be between 1 and 5." });
    }

    try {
      const review = ConsultationService.reviewDoctor(doctorId, userId, rating, comment);

      res.status(201).json({ message: "Review submitted successfully!", review });
    } catch (error) {
      next(error)
    }
  }

  static async getDoctorReviews(req: Request, res: Response, next: NextFunction) {
    const { doctorId } = req.params;

    try {
      const reviews = ConsultationService.getDoctorReviews(doctorId);

      res.status(200).json(reviews);
    } catch (error) {
      next(error)
    }
  }

}