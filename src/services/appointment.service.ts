import { prisma } from "../prisma/prisma";
import { ErrorCode } from "../exception/base";
import { BookingData, GOPDBookingData } from "../models/consultation.model";
import { AppointmentStatus, NotificationType, SessionType } from "@prisma/client";
import { NotificationService } from "./notification.service";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import { NotFoundException } from "../exception/not-found";

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
      throw new NotFoundException("Doctor not found", ErrorCode.NOTFOUND);
    }

    // Check if patient exists
    const patientExists = await checkIfUserExists(patientId);
    if (!patientExists) {
      throw new NotFoundException("Patient not found", ErrorCode.NOTFOUND);
    }

    const startTime = new Date(); // Current time
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    // Create appointment in database
    const appointment = await prisma.consultation.create({
      data: {
        patientId: patientId,
        doctorId: doctorId,
        startTime: startTime,
        endTime: endTime,
        consultationType: SessionType.VIDEO
      },
    });

    await NotificationService.createNotification(
      appointment.patientId,
      "New Appointment",
      `Your aapointment has recorded, kindly wait for doctor's approval`,
      NotificationType.APPOINTMENT_SCHEDULED);

    await NotificationService.createNotification(
      appointment.doctorId,
      "New Appointment",
      "You have a new appointment scheduled.",
      NotificationType.APPOINTMENT_SCHEDULED
    );

    return appointment;
  }

  static async bookConsultation(data: BookingData) {
    const { doctorId, patientId, date, time } = data;

    // Check if doctor exists
    const doctorExists = await checkIfUserExists(doctorId);
    if (!doctorExists) {
      throw new NotFoundException("Doctor not found", ErrorCode.NOTFOUND);
    }

    // Check if patient exists
    const patientExists = await checkIfUserExists(patientId);
    if (!patientExists) {
      throw new NotFoundException("Patient not found", ErrorCode.NOTFOUND);
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
        consultationType: SessionType.VIDEO
      },
    });

    await NotificationService.createNotification(
      appointment.patientId,
      "New Appointment",
      `Your aapointment has recorded, kindly wait for doctor's approval`,
      NotificationType.APPOINTMENT_SCHEDULED);

    await NotificationService.createNotification(
      appointment.doctorId,
      "New Appointment",
      "You have a new appointment scheduled.",
      NotificationType.APPOINTMENT_SCHEDULED
    );

    return appointment;
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

  static async reviewDoctor(doctorId: string, patientId: string, rating: number, comment: string) {

    // Check if doctor exists
    const doctorExists = await checkIfUserExists(doctorId);
    if (!doctorExists) {
      throw new NotFoundException("Doctor not found", ErrorCode.NOTFOUND);
    }

    // Check if patient exists
    const patientExists = await checkIfUserExists(patientId);
    if (!patientExists) {
      throw new NotFoundException("Patient not found", ErrorCode.NOTFOUND);
    }

    return await prisma.review.create({
      data: { doctorId, patientId, rating, comment },
    });
  }

  static async getDoctorReviews(doctorId: string) {
    // Check if doctor exists
    const doctorExists = await checkIfUserExists(doctorId);
    if (!doctorExists) {
      throw new NotFoundException("Doctor not found", ErrorCode.NOTFOUND);
    }

    return await prisma.review.aggregate({
      where: { doctorId },
      _avg: { rating: true },
    });
  }

  static async getUpcomingAppointment(userId: string) {
    const upcomingAppointment = await prisma.consultation.findFirst({
      where: {
        doctorId: userId,
      },
      orderBy: [
        { startTime: "asc" },
        { endTime: "asc" },
      ],
      include: {
        doctor: true,
      },
    });

    return upcomingAppointment;
  }

  static async cancelAppointment(userId: string, appointmentId: string, reason: string, otherReason?: string) {
    // Ensure the appointment exists and belongs to the user
    const appointment = await prisma.consultation.findUnique({
      where: { id: appointmentId, patientId: userId },
    });

    if (!appointment) {
      throw new NotFoundException("Appointment not found or unauthorized", ErrorCode.NOTFOUND);
    }

    // Update appointment status to 'cancelled'
    return await prisma.consultation.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: reason === "Others" ? otherReason : reason,
        cancelledAt: new Date(),
      },
    });
  }
}
