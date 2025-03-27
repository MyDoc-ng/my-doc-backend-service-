import { prisma } from "../prisma/prisma";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";
import { BookingData, GOPDBookingData } from "../models/consultation.model";
import { NotificationType, SessionType } from "@prisma/client";
import { NotificationService } from "./notification.service";
import { checkIfUserExists } from "../utils/checkIfUserExists";
import { NotFoundException } from "../exception/not-found";

export class ConsultationService {

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
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new BadRequestException(
        'Doctor not found',
        ErrorCode.BADREQUEST
      );
    }

    // Check if patient exists
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new BadRequestException(
        'Patient not found',
        ErrorCode.BADREQUEST
      );
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

    await NotificationService.createUserNotification(
      appointment.patientId,
      "New Appointment",
      `Your aapointment has recorded, kindly wait for doctor's approval`,
      NotificationType.APPOINTMENT_SCHEDULED);

    await NotificationService.createDoctorNotification(
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

  static async reviewDoctor(doctorId: string, userId: string, rating: number, comment: string) {
    return await prisma.review.create({
      data: { doctorId, userId, rating, comment },
    });
  }

  static async getDoctorReviews(doctorId: string) {
    return await prisma.review.findMany({
      where: { doctorId },
      orderBy: { createdAt: "desc" },
    });
  }
}
