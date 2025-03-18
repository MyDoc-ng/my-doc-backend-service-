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
      const availability = await DoctorService.getDoctorAvailability(req.params.doctorId);
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

  static async approveAppointment(req: Request, res: Response,next: NextFunction): Promise<any> {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true, doctor: true },
      });
  
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
  
      if (appointment.status !== 'PENDING') {
        return res.status(400).json({ message: 'Appointment is not in pending state' });
      }
  
      // Get doctor's calendar details
      const { calendarId, oauth2Client } = await getDoctorCalendarDetails(appointment.doctorId);
  
      // Create event in Google Calendar
      const event = {
        summary: `Appointment with ${appointment.patient.name}`,
        description: 'Doctor Appointment',
        start: {
          dateTime: new Date(appointment.startTime).toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(appointment.endTime).toISOString(),
          timeZone: 'UTC',
        },
        attendees: [{ email: appointment.patient.email }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
      };
  
      const calendarResponse = await calendar.events.insert({
        calendarId: calendarId,
        auth: oauth2Client,
        requestBody: event,
      });
  
      // Update appointment in database with Google Event ID and status
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'APPROVED',
          googleEventId: calendarResponse.data.id,
        },
      });
  
      res.json({ message: 'Appointment approved and event created in Google Calendar', appointment: updatedAppointment });
    } catch (error) {
      console.error("Error approving appointment:", error);
      res.status(500).json({ message: 'Failed to approve appointment', error: error });
    }
  }
}
