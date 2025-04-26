import { prisma } from "../prisma/prisma";
import { ErrorCode } from "../exception/base";
import {
  BookingData,
  GOPDBookingData,
  UpdateBookingData,
} from "../models/consultation.model";
import {
  AppointmentStatus,
  NotificationType,
  SessionType,
} from "@prisma/client";
import { NotificationService } from "./notification.service";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import { NotFoundException } from "../exception/not-found";
import { BadRequestException } from "../exception/bad-request";
import { DoctorService } from "./doctor.service";
import { calendar } from "../utils/oauthUtils";
import { responseService } from "./response.service";

interface ICancelAppointment {
  appointmentId: string;
  userId: string;
  reason: string;
  otherReason?: string;
}
export class ConsultationService {
  static async getAllAppointments() {
    const appointments = await prisma.consultation.findMany();
    return appointments;
  }

  static async bookGOPDConsultation(data: GOPDBookingData) {
    const { doctorId, patientId } = data;

    // Check if doctor exists
    const doctorExists = await checkIfUserExists(doctorId);
    if (!doctorExists) {
      return responseService.notFoundError({
        message: "Doctor not found",
      });
    }

    // Check if patient exists
    const patientExists = await checkIfUserExists(patientId);
    if (!patientExists) {
      return responseService.notFoundError({
        message: "Patient not found",
      });
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    const appointment = await prisma.consultation.create({
      data: {
        patientId: patientId,
        doctorId: doctorId,
        startTime: startTime,
        endTime: endTime,
        consultationType: SessionType.VIDEO,
      },
    });

    await NotificationService.createNotification(
      appointment.patientId!,
      "New Appointment",
      `Your aapointment has recorded, kindly wait for doctor's approval`,
      NotificationType.APPOINTMENT_SCHEDULED
    );

    await NotificationService.createNotification(
      appointment.doctorId!,
      "New Appointment",
      "You have a new appointment scheduled.",
      NotificationType.APPOINTMENT_SCHEDULED
    );

    return responseService.success({
      message: "Appointment booked successfully",
      data: {
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        status: appointment.status,
        consultationType: appointment.consultationType,
        createdAt: appointment.createdAt,
      },
    });
  }

  static async bookConsultation(data: BookingData) {
    const { doctorId, patientId, date, time } = data;

    // Check if doctor exists
    const doctorExists = await checkIfUserExists(doctorId);
    if (!doctorExists) {
      return responseService.notFoundError({
        message: "Doctor not found",
      });
    }

    // Check if patient exists
    const patientExists = await checkIfUserExists(patientId);
    if (!patientExists) {
      return responseService.notFoundError({
        message: "Patient not found",
      });
    }

    const timeIn24Hr = new Date(`${date} ${time}`).toISOString();

    const startTime = new Date(timeIn24Hr);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    // Create appointment in database
    const appointment = await prisma.consultation.create({
      data: {
        patientId: patientId,
        doctorId: doctorId,
        startTime: startTime,
        endTime: endTime,
        status: AppointmentStatus.PENDING,
        consultationType: SessionType.VIDEO,
      },
    });

    await NotificationService.createNotification(
      appointment.patientId!,
      "New Appointment",
      `Your aapointment has recorded, kindly wait for doctor's approval`,
      NotificationType.APPOINTMENT_SCHEDULED
    );

    await NotificationService.createNotification(
      appointment.doctorId!,
      "New Appointment",
      "You have a new appointment scheduled.",
      NotificationType.APPOINTMENT_SCHEDULED
    );

    return responseService.success({
      message: "Appointment booked successfully",
      data: {
        id: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        status: appointment.status,
        consultationType: appointment.consultationType,
        createdAt: appointment.createdAt,
      },
    });
  }

  static async getConsultationById(consultationId: string) {
    return await prisma.consultation.findUnique({
      where: { id: consultationId },
    });
  }

  static async getDoctorConsultation(doctorId: string) {
    return await prisma.consultation.findMany({
      where: { doctorId: doctorId },
      include: {
        patient: true,
      },
    });
  }

  static async reviewDoctor(
    doctorId: string,
    patientId: string,
    rating: number,
    comment: string
  ) {
    // Check if doctor exists
    const doctorExists = await checkIfUserExists(doctorId);
    if (!doctorExists) {
      return responseService.notFoundError({
        message: "Doctor not found",
      });
    }

    // Check if patient exists
    const patientExists = await checkIfUserExists(patientId);
    if (!patientExists) {
      return responseService.notFoundError({
        message: "Patient not found",
      });
    }

    const review = await prisma.review.create({
      data: { doctorId, patientId, rating, comment },
    });

    return responseService.success({
      message: "Review added successfully",
      data: {
        id: review.id,
        doctorId: review.doctorId,
        patientId: review.patientId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      },
    });
  }

  static async getDoctorReviews(doctorId: string) {
    // Check if doctor exists
    const doctorExists = await checkIfUserExists(doctorId);
    if (!doctorExists) {
      return responseService.notFoundError({
        message: "Doctor not found",
      });
    }

    const review = await prisma.review.aggregate({
      where: { doctorId },
      _avg: { rating: true },
    });

    return responseService.success({
      message: "Reviews fetched successfully",
      data: {
        doctorId,
        averageRating: review._avg.rating,
      },
    });
  }

  static async getUpcomingAppointment(userId: string) {
    const upcomingAppointment = await prisma.consultation.findFirst({
      where: {
        doctorId: userId,
      },
      orderBy: [{ startTime: "asc" }, { endTime: "asc" }],
      include: {
        doctor: true,
      },
    });

    return upcomingAppointment;
  }

  static async cancelAppointment(data: ICancelAppointment) {
    // Ensure the appointment exists and belongs to the user
    const { appointmentId, userId, reason, otherReason } = data;

    const appointment = await prisma.consultation.findUnique({
      where: {
        id: appointmentId,
        OR: [{ doctorId: userId }, { patientId: userId }],
      },
    });

    if (!appointment) {
      return responseService.notFoundError({
        message: "Appointment not found or unauthorized",
      });
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return responseService.error({
        message: "Appointment already cancelled",
      });
    }

    // Update appointment status to 'cancelled'
    const cancelledApointment = await prisma.consultation.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: reason === "Others" ? otherReason : reason,
        cancelledAt: new Date(),
        googleEventId: null,
        googleMeetLink: null,
      },
    });

    return responseService.success({
      message: "Appointment cancelled successfully",
      data: {
        id: cancelledApointment.id,
        startTime: cancelledApointment.startTime,
        endTime: cancelledApointment.endTime,
        doctorId: cancelledApointment.doctorId,
        patientId: cancelledApointment.patientId,
        consultationType: cancelledApointment.consultationType,
        status: cancelledApointment.status,
        cancellationReason: cancelledApointment.cancellationReason,
        cancelledAt: cancelledApointment.cancelledAt,
      },
    });
  }

  static async rescheduleAppointment(data: UpdateBookingData) {
    const { appointmentId, date, time } = data;

    const appointment = await prisma.consultation.findUnique({
      where: {
        id: appointmentId
      },
    });

    if (!appointment) {
      return responseService.notFoundError({
        message: "Appointment not found or unauthorized",
      });
    }

    const timeIn24Hr = new Date(`${date} ${time}`).toISOString();

    const startTime = new Date(timeIn24Hr);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    const consultation =  await prisma.consultation.update({
      where: { id: appointmentId },
      data: { 
        startTime: startTime, 
        endTime: endTime,
        status: AppointmentStatus.CONFIRMED 
      },
      include: {
        doctor: true,
        patient: true,
      }
    });

    await NotificationService.createNotification(
      appointment.patientId!,
      "Appointment Rescheduled",
      `Your appointment with ${consultation.doctor!.name}, has been rescheduled`,
      NotificationType.APPOINTMENT_RESCHEDULED
    );

    await NotificationService.createNotification(
      appointment.doctorId!,
      "Appointment Rescheduled",
      `You rescheduled your appointment with ${consultation.patient!.name}`,
      NotificationType.APPOINTMENT_RESCHEDULED
    );

    return responseService.success({
      message: "Appointment rescheduled successfully",
      data: consultation,
    }); 
  }

  static async acceptAppointment(appointmentId: string, doctorId: string) {
    const appointment = await prisma.consultation.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    });

    if (!appointment) {
      throw new NotFoundException("Appointment not found");
    }

    if (appointment.doctorId !== doctorId) {
      throw new BadRequestException(
        "You are not authorized to accept this appointment"
      );
    }

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException("Appointment is not in pending status");
    }

    // Get doctor's calendar details
    const { calendarId, oauth2Client } =
      await DoctorService.getDoctorCalendarDetails(appointment.doctorId);

    // Create event in Google Calendar
    const event = {
      summary: `Appointment with ${appointment.patient?.name}`,
      description: "Doctor Appointment",
      start: {
        dateTime: new Date(appointment.startTime).toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(appointment.endTime).toISOString(),
        timeZone: "UTC",
      },
      attendees: [{ email: appointment.patient?.email }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 10 },
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: appointment.id,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const calendarResponse = await calendar.events.insert({
      calendarId: calendarId,
      auth: oauth2Client,
      sendNotifications: true,
      sendUpdates: "all",
      requestBody: event,
      conferenceDataVersion: 1,
    });

    // Update appointment in database with Google Event ID and status
    return await prisma.consultation.update({
      where: { id: appointmentId, doctorId },
      data: {
        status: AppointmentStatus.CONFIRMED,
        googleEventId: calendarResponse.data.id,
        googleMeetLink: calendarResponse.data.hangoutLink,
      },
    });
  }

  static async getPatientsSeen(doctorId: string) {
    return await prisma.consultation.count({
      where: { doctorId, status: AppointmentStatus.COMPLETED },
    });
  }

  static async getAppointmentById(appointmentId: string) {
    //check if appointment exists
    const existingaApointment = await prisma.consultation.findUnique({
      where: { id: appointmentId },
    });

    if (!existingaApointment) {
      return responseService.notFoundError({
        message: "Appointment not found",
      });
    }
    const appointment = await prisma.consultation.findMany({
      where: { id: appointmentId },
      include: { patient: true },
    });

    return responseService.success({
      message: "Appointment fetched successfully",
      data: appointment,
    });
  }
}
