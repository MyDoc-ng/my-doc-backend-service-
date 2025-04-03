// src/controllers/booking.controller.ts
import { NextFunction, Request, Response } from "express";
import { ConsultationService } from "../services/consultation.service";
// import { findDoctors, getDoctorAvailability } from '../services/doctor.service';
import { DoctorService } from "../services/doctor.service";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { calendar } from "../utils/oauthUtils";


export class ConsultationController {

  // async bookAppointment(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { userId, doctorId, type, profileId } = req.body;
      
  //     const session = await bookingService.createSession(
  //       userId,
  //       doctorId,
  //       type,
  //       undefined,
  //       profileId
  //     );

  //     res.json(session);
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async getDoctorAvailability(req: Request, res: Response, next: NextFunction) {    
    try {
      const availability = await DoctorService.getDoctorAvailability(req.params.doctorId);
      res.json(availability);
    } catch (error) {
      next(error);
    }
  }

  // async createProfile(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const profile = await Book.createProfile(
  //       req.body.userId,
  //       req.body
  //     );
  //     res.json(profile);
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async bookGOPDConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const consultation = await ConsultationService.bookGOPDConsultation(req.body);
      res.json(consultation);
    } catch (error :any) {
      next(error)
      res.status(500).json({ message: error.message });
    }
  }

  static async getConsultationById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const consultation = await ConsultationService.getConsultationById(req.params.id);
      res.json(consultation);
    } catch (error) {
      next(error)
      res.status(404).json({ message: "Consultations not found" });
    }
  }

  static async getDoctorConsultations(req: Request, res: Response,next: NextFunction): Promise<any> {
    try {
      const doctorConsultations = await ConsultationService.getDoctorConsultation(req.params.doctorId);
      res.status(200).json(doctorConsultations);
    } catch (error) {
      next(error)
      res.status(404).json({ message: "Consultations not found" });
    }
  }
  
}
