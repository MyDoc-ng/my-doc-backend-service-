import { NextFunction, Request, Response } from "express";
import { DoctorService } from "../services/doctor.service";
import {
  handleOAuthCallback,
  initiateOAuth,
  saveTokensAndCalendarId,
} from "../utils/oauthUtils";
import { prisma } from "../prisma/prisma";

const doctorService = new DoctorService();

// Google Calendar API setup (move to a separate module later)
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirect: process.env.GOOGLE_REDIRECT_URI, // Base URI, specific to doctor callback
};

export class DoctorController {
  static async index(req: Request, res: Response, next: NextFunction) {
    try {
      const doctors = await DoctorService.getAllDoctors();
      res.json(doctors);
    } catch (error: any) {
      next(error);
      res.status(500).json({ message: error.message });
    }
  }

  async createDoctor(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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

      const doctor = await doctorService.createDoctors({
        userId,
        specialization,
        experienceYears,
        ratings,
        bio,
        isOnline,
        availability,
      });

      res.json(doctor);
    } catch (error: any) {
      next(error);
    }
  }

  static async topDoctors(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const doctors = await doctorService.getTopDoctors();

      res.json(doctors);
    } catch (error: any) {
      next(error);
    }
  }

  static async show(req: Request, res: Response) {
    try {
      const doctor = await DoctorService.getDoctorById(req.params.id);
      res.json(doctor);
    } catch (error) {
      res.status(404).json({ message: "Doctor not found" });
    }
  }

  static async generalPractitioners(req: Request, res: Response) {
    try {
      const doctor = await DoctorService.getDoctorById(req.params.id);
      res.json(doctor);
    } catch (error) {
      res.status(404).json({ message: "Doctor not found" });
    }
  }

  static async googleOAuth2(req: Request, res: Response) {
    const doctorRedirectUri = `${googleConfig.redirect}/doctor/callback`;
    const doctorId = parseInt(req.params.doctorId);
    const scopes = ["https://www.googleapis.com/auth/calendar"]; // Define the necessary scopes
    try {
      const authUrl = await initiateOAuth({
        doctorId: doctorId,
        scopes: scopes,
        prisma: prisma,
        redirectUri: doctorRedirectUri,
      });
      res.redirect(authUrl);
    } catch (error) {
      console.error("Error initiating OAuth:", error);
      res.status(500).send("Error initiating OAuth flow.");
    }
  }

  static async oAuth2Callback(req: Request, res: Response): Promise<any> {
    const code = req.query.code as string;
    const state = req.query.state as string;

    try {
      const { tokens, calendarId } = await handleOAuthCallback(code);

      const doctorId = parseInt(state);

      await saveTokensAndCalendarId({
        doctorId: doctorId,
        tokens: tokens,
        calendarId: calendarId,
        prisma: prisma,
      });

      res.send("Doctor Google Calendar connected successfully!");
    } catch (error) {
      console.error("Error during Google OAuth2 flow:", error);
      res.status(500).send("Error connecting to Google Calendar.");
    }
  }
}
