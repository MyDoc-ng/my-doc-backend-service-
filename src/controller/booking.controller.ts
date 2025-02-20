// src/controllers/booking.controller.ts
import { NextFunction, Request, Response } from "express";
import { BookingService } from "../services/booking.service";
// import { findDoctors, getDoctorAvailability } from '../services/doctor.service';
import { DoctorService } from "../services/doctor.service";

const bookingService = new BookingService();
const doctorService = new DoctorService();

export class BookingController {
  async startGopdConsultation(req: Request, res: Response, next: NextFunction):Promise<any> {
    try {
      const { userId, symptoms } = req.body;
      const doctors = await doctorService.findDoctors({
        specialization: "General Practitioner",
      });

      if (!doctors.length) {
        return res.status(404).json({ error: "No available doctors" });
      }

      const session = await bookingService.createSession(
        userId,
        doctors[0].id,
        "gopd-chat",
        symptoms
      );

      res.json(session);
    } catch (error) {
      next(error);
    }
  }

  async bookAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, doctorId, type, profileId } = req.body;
      
      const session = await bookingService.createSession(
        userId,
        doctorId,
        type,
        undefined,
        profileId
      );

      res.json(session);
    } catch (error) {
      next(error);
    }
  }

  async getDoctorAvailability(req: Request, res: Response, next: NextFunction) {    
    try {
      const availability = await doctorService.getDoctorAvailability(req.params.doctorId);
      res.json(availability);
    } catch (error) {
      next(error);
    }
  }

  async createProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await bookingService.createProfile(
        req.body.userId,
        req.body
      );
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }
}
