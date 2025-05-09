import { NextFunction, Request, Response } from "express";
import { DoctorService } from "../services/doctor.service";
import {
  googleConfig,
  handleOAuthCallback,
  initiateOAuth,
  saveTokensAndCalendarId,
} from "../utils/oauthUtils";
import { prisma } from "../prisma/prisma";
import logger from "../logger";
import { ErrorCode } from "../exception/base";
import { AppointmentStatus, UserTypes } from "@prisma/client";
import { ConsultationService } from "../services/consultation.service";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import { NotFoundException } from "../exception/not-found";

export class DoctorController {
  static async index(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info("Fetching all doctors");
      const doctors = await DoctorService.getAllDoctors();
      logger.debug("Doctors fetched successfully", { count: doctors.length });
      res.status(200).json(doctors);
    } catch (error: any) {
      logger.error("Error fetching doctors", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  static async profile(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.user.id;
      const result = await DoctorService.getDoctorById(id);
      res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  static async documents(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.user.id;
      const result = await DoctorService.getDoctorDocuments(id);
      res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  static async generalPractitioners(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      logger.info("Fetching general practitioners");
      const doctors = await DoctorService.getGeneralPractitioners();

      res.json(doctors);
    } catch (error: any) {
      logger.error("Error fetching general practitioners", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  static async topDoctors(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      logger.info("Fetching top doctors");
      const doctors = await DoctorService.getTopDoctors();
      logger.debug("Top doctors fetched successfully", {
        count: doctors.length,
      });

      res.json(doctors);
    } catch (error: any) {
      logger.error("Error fetching top doctors", {
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  static async googleOAuth2(req: Request, res: Response, next: NextFunction) {
    const doctorRedirectUri = `${googleConfig.redirect}`;
    const doctorId = req.params.doctorId;
    const scopes = ["https://www.googleapis.com/auth/calendar"];

    const doctorExists = await checkIfUserExists(doctorId);
    if (!doctorExists) {
      next(new NotFoundException("Doctor not found"));
    }

    try {
      logger.info("Initiating Google OAuth2 flow", {
        doctorId,
        redirectUri: doctorRedirectUri,
      });

      const authUrl = await initiateOAuth({
        entityType: UserTypes.DOCTOR,
        entityId: doctorId,
        scopes,
        prisma,
        redirectUri: doctorRedirectUri,
      });

      logger.debug("OAuth2 URL generated successfully", { doctorId });
      res.status(200).json(authUrl);
    } catch (error: any) {
      logger.error("Error initiating OAuth", {
        doctorId,
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  static async oAuth2Callback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const [entityType, entityIdStr] = state.split("_");
    const entityId = entityIdStr;

    logger.info("OAuth2 callback received", { entityId, entityType });

    try {
      logger.info("Processing OAuth2 callback", { entityId });

      const { tokens, calendarId } = await handleOAuthCallback(code);

      logger.debug("OAuth2 tokens received", {
        entityId,
        hasTokens: !!tokens,
        hasCalendarId: !!calendarId,
      });

      if (entityType === "DOCTOR") {
        await saveTokensAndCalendarId({
          entityType: entityType,
          entityId: entityId,
          tokens: tokens,
          calendarId: calendarId,
          prisma: prisma,
        });
        logger.info("Doctor Google Calendar connected successfully", {
          entityId,
        });
        res.json({
          message: `${
            entityType.charAt(0).toUpperCase() + entityType.slice(1)
          } Google Calendar connected successfully!`,
        });
      }
    } catch (error: any) {
      logger.error("Error during OAuth2 callback", {
        entityId,
        error: error.message,
        stack: error.stack,
      });
      next(error);
    }
  }

  static async getAppointments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { status } = req.query;
      const doctorId = req.user.id;
      const appointments = await DoctorService.getAppointments(
        doctorId,
        status as AppointmentStatus
      );
      res.status(200).json(appointments);
    } catch (error) {
      next(error);
    }
  }

  static async getAppointmentById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const appointmentId = req.params.appointmentId;
      const result = await ConsultationService.getAppointmentById(
        appointmentId
      );
      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // static async getUpcomingConsultations(req: Request, res: Response, next: NextFunction): Promise<any> {
  //   try {
  //     const result = await DoctorService.getUpcomingConsultations(req.params.doctorId);
  //     res.status(result.status ?? 200).json(result);
  //   } catch (error) {
  //     next(error)
  //   }
  // }

  static async getAppointmentHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const doctorId = req.user.id;
      const history = await DoctorService.getAppointmentHistory(doctorId);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }

  static async acceptAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const doctorId = req.user.id;
      const appointmentId = req.params.id;
      const result = await ConsultationService.acceptAppointment(
        appointmentId,
        doctorId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async cancelAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user.id;
      const appointmentId = req.params.id;
      const { reason, otherReason } = req.body;
      const result = await ConsultationService.cancelAppointment({
        userId,
        appointmentId,
        reason,
        otherReason,
      });
      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async rescheduleAppointment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await ConsultationService.rescheduleAppointment(req.body);

      res.status(result.status ?? 200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getChat(req: Request, res: Response) {
    const chat = await DoctorService.getChat(req.user.id, req.params.patientId);
    res.status(200).json(chat);
  }

  static async sendMessage(req: Request, res: Response) {
    await DoctorService.sendMessage(
      req.user.id,
      req.params.patientId,
      req.body.message
    );
    res.status(201).json({ message: "Message sent" });
  }

  static async addMedicalNote(req: Request, res: Response) {
    // await DoctorService.addMedicalNote(req.user.id, req.params.appointmentId, req.body);
    res.status(201).json({ message: "Medical note added" });
  }

  static async getPatientHistory(req: Request, res: Response) {
    const history = await DoctorService.getPatientHistory(
      req.user.id,
      req.params.patientId
    );
    res.status(200).json(history);
  }

  static async referPatient(req: Request, res: Response) {
    await DoctorService.referPatient(
      req.user.id,
      req.params.patientId,
      req.body.specialistId,
      req.body.notes
    );
    res.status(201).json({ message: "Patient referred" });
  }

  static async getBalance(req: Request, res: Response) {
    const earnings = await DoctorService.getBalance(req.user.id);
    res.status(200).json(earnings);
  }

  static async requestWithdrawal(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await DoctorService.requestWithdrawal(
        req.user.id,
        req.body.amount
      );
      res.status(result.status ?? 200).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  static async getPatientsSeen(req: Request, res: Response) {
    const doctorId = req.user.id;
    const count = await ConsultationService.getPatientsSeen(doctorId);
    res.json({ totalPatientsSeen: count });
  }

  static async transactionHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const doctorId = req.user.id;
      const result = await DoctorService.getTransactionHistory(doctorId);
      res.status(result.status).json(result);
    } catch (error: any) {
      next(error);
    }
  }
}
