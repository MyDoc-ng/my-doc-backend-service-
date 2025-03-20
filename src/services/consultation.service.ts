import { prisma } from "../prisma/prisma";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";
import { BookingData, GOPDBookingData } from "../models/consultation.model";
import { NotificationType, SessionType } from "@prisma/client";
import { NotificationService } from "./notification.service";

export class ConsultationService {

  static async bookGOPDConsultation(data: GOPDBookingData) {
    const { doctorId, patientId } = data;

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
        patient: true, // Include patient details
      },
    });
  }
}
