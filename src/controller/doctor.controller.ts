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
import { AuthService } from "../services/auth.service";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";
import { UnauthorizedException } from "../exception/unauthorized";

export class DoctorController {
  static async index(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Fetching all doctors');
      const doctors = await DoctorService.getAllDoctors();
      logger.debug('Doctors fetched successfully', { count: doctors.length });
      res.status(200).json(doctors);
    } catch (error: any) {
      logger.error('Error fetching doctors', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  static async show(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      logger.info('Fetching doctor by ID', { doctorId: id });

      const doctor = await DoctorService.getDoctorById(id);
      logger.debug('Doctor fetched successfully', { doctorId: id });

      res.json(doctor);
    } catch (error: any) {
      logger.error('Error fetching doctor by ID', {
        doctorId: req.params.id,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  static async generalPractitioners(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Fetching general practitioners');
      const doctors = await DoctorService.getGeneralPractitioners();
      logger.debug('General practitioners fetched successfully', { count: doctors.length });

      res.json(doctors);
    } catch (error: any) {
      logger.error('Error fetching general practitioners', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  static async topDoctors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Fetching top doctors');
      const doctors = await DoctorService.getTopDoctors();
      logger.debug('Top doctors fetched successfully', { count: doctors.length });

      res.json(doctors);
    } catch (error: any) {
      logger.error('Error fetching top doctors', {
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  static async store(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Creating new doctor');

      const doctor = await AuthService.registerDoctors(req.body);
      logger.debug('Doctor created successfully', { doctorId: doctor.id });

      res.status(201).json({ message: 'Doctor created successfully', doctor });
    } catch (error: any) {
      next(error);
    }
  }

  static async googleOAuth2(req: Request, res: Response, next: NextFunction) {
    const doctorRedirectUri = `${googleConfig.redirect}`;
    const doctorId = req.params.doctorId;
    const scopes = ["https://www.googleapis.com/auth/calendar"];

    try {
      logger.info('Initiating Google OAuth2 flow', {
        doctorId,
        redirectUri: doctorRedirectUri
      });

      const authUrl = await initiateOAuth({
        doctorId,
        scopes,
        prisma,
        redirectUri: doctorRedirectUri,
      });

      logger.debug('OAuth2 URL generated successfully', { doctorId });
      res.json({ authUrl });
    } catch (error: any) {
      logger.error('Error initiating OAuth', {
        doctorId,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  static async oAuth2Callback(req: Request, res: Response, next: NextFunction): Promise<any> {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const doctorId = state;

    try {
      logger.info('Processing OAuth2 callback', { doctorId });

      const { tokens, calendarId } = await handleOAuthCallback(code);
      logger.debug('OAuth2 tokens received', {
        doctorId,
        hasTokens: !!tokens,
        hasCalendarId: !!calendarId
      });

      await saveTokensAndCalendarId({
        doctorId,
        tokens,
        calendarId,
        prisma,
      });

      logger.info('Doctor Google Calendar connected successfully', { doctorId });
      res.json({ message: "Doctor Google Calendar connected successfully!" });
    } catch (error: any) {
      logger.error('Error during OAuth2 callback', {
        doctorId,
        error: error.message,
        stack: error.stack
      });
      next(error);
    }
  }

  static async uploadCertification(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.files) {
        throw new BadRequestException("No files uploaded!", ErrorCode.BADREQUEST);
      }

      const doctorId = req.body.doctorId;

      if (!doctorId) {
        throw new UnauthorizedException("Unauthorized access", ErrorCode.UNAUTHORIZED);
      }

      const files = req.files as {
        cv?: Express.Multer.File[];
        medicalLicense?: Express.Multer.File[];
        reference?: Express.Multer.File[];
      };

      const serverUrl = `${req.protocol}://${req.get("host")}`;

      const cvPath = `${serverUrl}/${files.cv?.[0]?.path.replace(/\\/g, "/")}`;
      const medicalLicensePath = `${serverUrl}/${files.medicalLicense?.[0]?.path.replace(/\\/g, "/")}`;
      const referencePath = `${serverUrl}/${files.reference?.[0]?.path.replace(/\\/g, "/")}`;

      const fileUrls = {
        cv: cvPath || null,
        medicalLicense: medicalLicensePath || null,
        reference: referencePath || null,
      };

      const updatedDoctor = await DoctorService.saveCertificationFiles(doctorId, fileUrls);

      res.status(201).json({
        message: "Files uploaded and doctor profile updated successfully",
        doctor: updatedDoctor,
      });
    } catch (error) {
      next(error);
    }
  }
}
