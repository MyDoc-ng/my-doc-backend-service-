import { Profile, TransactionType, AppointmentStatus } from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { BadRequestException } from "../exception/bad-request";
import { ErrorCode } from "../exception/base";
import { createGoogleMeetEvent } from "../utils/generate_verify_token";
import { GOPDBookingData } from "../models/consultation.model";

export class ConsultationService {
  
  async createSession(
    userId: string,
    doctorId: string,
    type: ConsultationType,
    symptoms?: string,
    profileId?: string
  ): Promise<Session> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    const requiredBalance = type === ConsultationType.MESSAGING ? 4000 : 10500;

    if (!user?.wallet || user.wallet.balance < requiredBalance) {
      throw new BadRequestException(
        `Insufficient balance. Minimum required: ${requiredBalance}`,
        ErrorCode.BADREQUEST
      );
    }

    return prisma.$transaction(async (tx) => {
      // Create session
      const session = await tx.session.create({
        data: {
          type,
          startTime: new Date(),
          userId,
          doctorId,
          profileId,
          symptoms,
        },
      });

      // Deduct funds
      await tx.wallet.update({
        where: { id: String(user.walletId) },
        data: { balance: { decrement: requiredBalance } },
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          amount: -requiredBalance,
          type: TransactionType.CONSULTATION,
          userId,
        },
      });

      return session;
    });
  }

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
