// src/controllers/booking.controller.ts
import { NextFunction, Request, Response } from "express";
import { ConsultationService } from "../services/consultation.service";
// import { findDoctors, getDoctorAvailability } from '../services/doctor.service';
import { DoctorService } from "../services/doctor.service";
import { SessionType } from "@prisma/client";
import { NotFoundException } from "../exception/not-found";
import { ErrorCode } from "../exception/base";


const doctorService = new DoctorService();

export class ConsultationController {

  async startGopdConsultation(req: Request, res: Response, next: NextFunction):Promise<any> {
    try {
      const { userId, symptoms } = req.body;

      const doctors = await doctorService.findDoctors({
        specialization: "General Practitioner",
      });

      if (!doctors.length) {
        throw new NotFoundException("No available doctors", ErrorCode.NOTFOUND);
      }

      const session = await bookingService.createSession(
        userId,
        doctors[0].id,
        ConsultationType.CHAT,
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

  static async bookConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const consultation = await ConsultationService.bookConsultation(req.body);
      res.json(consultation);
    } catch (error :any) {
      next(error)
      res.status(500).json({ message: error.message });
    }
  }

  static async getConsultationById(req: Request, res: Response) {
    try {
      const consultation = await ConsultationService.getConsultationById(req.params.id);
      res.json(consultation);
    } catch (error) {
      res.status(404).json({ message: "Consultation not found" });
    }
  }
}
