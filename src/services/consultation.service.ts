import { Profile, TransactionType, AppointmentStatus, SessionType } from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";
import { GOPDBookingData } from "../models/consultation.model";

export class ConsultationService {
  
  async createProfile(
    userId: string,
    data: { fullName: string; contact: string; gender: string; age: number }
  ): Promise<Profile> {
    return prisma.profile.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  static async bookGOPDConsultation(data: GOPDBookingData) {
    const { doctorId, patientId, consultationType } = data;
    
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
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        consultationType: consultationType
      },
    });

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
