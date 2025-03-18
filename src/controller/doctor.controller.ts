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

const doctorService = new DoctorService();

export class DoctorController {
  static async index(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Fetching all doctors');
      const doctors = await DoctorService.getAllDoctors();
      logger.debug('Doctors fetched successfully', { count: doctors.length });
      res.json(doctors);
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
      const doctors = await doctorService.getTopDoctors();
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

  async createDoctor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        userId,
        specialization,
        experienceYears,
        ratings,
        bio,
        isOnline,
        availability,
      } = req.body;

      logger.info('Creating new doctor', { 
        userId, 
        specialization,
        experienceYears 
      });
      
      const doctor = await doctorService.createDoctors({
        userId,
        specialization,
        experienceYears,
        ratings,
        bio,
        isOnline,
        availability,
      });

      logger.debug('Doctor created successfully', { 
        doctorId: doctor.id,
        userId: doctor.userId 
      });
      
      res.json(doctor);
    } catch (error: any) {
      logger.error('Error creating doctor', {
        userId: req.body.userId,
        error: error.message,
        stack: error.stack
      });
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
}
