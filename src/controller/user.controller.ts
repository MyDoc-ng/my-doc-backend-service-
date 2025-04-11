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

      res.status(200).json(users);
    } catch (error: any) {
      next(error)
    }
  }

  static async getPendingConsultations(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await UserService.getPendingConsultations(req.params.userId);
      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error)
    }
  }
  static async getUpcomingConsultations(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await UserService.getUpcomingConsultations(req.params.userId);
      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error)
    }
  }
  static async getCompletedConsultations(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await UserService.getCompletedConsultations(req.params.userId);
      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error)
    }
  }

  static async getCancelledConsultations(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await UserService.getCancelledConsultations(req.params.userId);
      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error)
    }
  }

  static async generalPractitioners(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Fetching general practitioners');
      const result = await DoctorService.getGeneralPractitioners();

      res.status(result.status ?? 200).json(result);
    } catch (error: any) {

      next(error);
    }
  }

  static async getSpecializations(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Fetching general practitioners');
      const result = await DoctorService.getSpecializations();

      res.status(result.status ?? 200).json(result);
    } catch (error: any) {

      next(error);
    }
  }

  static async getDoctorById(req: Request, res: Response, next: NextFunction) {

    try {
      const { doctorId } = req.params;

      logger.info('Fetching doctor by id', { doctorId });
      const result = await DoctorService.getDoctorById(doctorId);

      res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  static async bookGOPDConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ConsultationService.bookGOPDConsultation(req.body);
      res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error)
    }
  }

  static async bookConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ConsultationService.bookConsultation(req.body);
      res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error)
    }
  }

  static async cancelAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const appointmentId = req.params.appointmentId;
      const userId = req.user.id;

      const { reason, otherReason } = req.body;

      const result = await ConsultationService.cancelAppointment({ userId, appointmentId, reason, otherReason });

      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error)
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = req.body;

      const result = await ChatService.sendMessage(validatedData);
      res.status(result.status ?? 201).json(result);
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

      const result = await ChatService.uploadVoiceMessage(messageData);
      res.status(result.status ?? 201).json(result);
    } catch (error: any) {
      next(error)
    }
  }

  static async getMessages(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.params;

    try {
      const result = await ChatService.getMessages(userId);
      res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error)
    }
  }

  static async reviewDoctor(req: Request, res: Response, next: NextFunction) {
    const { doctorId, patientId, rating, comment } = req.body;

    try {
      const result = await ConsultationService.reviewDoctor(doctorId, patientId, rating, comment);

      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error)
    }
  }

  static async getDoctorReviews(req: Request, res: Response, next: NextFunction) {
    const { doctorId } = req.params;

    try {
      const result = await ConsultationService.getDoctorReviews(doctorId);

      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error)
    }
  }

  static async getDoctorsBySpecialty(req: Request, res: Response, next: NextFunction) {
    try {
      const specialtyName = req.params.specialty;

      const result = await DoctorService.getDoctorsBySpecialty(specialtyName);

      res.status(result.status ?? 200).json(result);

    } catch (error) {
      next(error)
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await UserService.updateProfile(req.body);
      res.status(result.status ?? 201).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const result = await UserService.changePassword({ currentPassword, newPassword, userId });

      res.status(result.status ?? 201).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;

      const result = await UserService.deleteUserById(userId);

      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error);
    }
  }

}