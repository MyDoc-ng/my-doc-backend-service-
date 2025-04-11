import { SessionType, AppointmentStatus, UserTypes, User, ReferralStatus, WithdrawalStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { NotFoundException } from "../exception/not-found";
import { ErrorCode } from "../exception/base";
import { oauth2Client } from "../utils/oauthUtils";
import logger from "../logger";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { computeDoctorAvailability } from "../utils/computeDoctorAvailability";
import { BadRequestException } from "../exception/bad-request";
import { responseService } from "./response.service";

interface FilterDoctor {
  specialization?: string;
  minRating?: number;
  location?: string;
  availability?: string;
  consultationType?: SessionType;
}

interface DoctorProfile {
  name: string;
  email: string;
  experience: number;
  location: string;
  consultationTypes: SessionType[]; // Assuming consultation types are strings
  consultationFees: number;
  homeVisitCharge: number;
  videoConsultationFee: number;
  clinicConsultationFee: number;
  ratings: number;
  bio: string;
  specialtyId: string;
}

export class DoctorService {

  static async getAllDoctors() {
    return await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: UserTypes.DOCTOR
            }
          }
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  static async getDoctorById(doctorId: string) {
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      include: {
        doctorProfile: {
          include: {
            specialty: true,
          },
        },
        DoctorReviews: true,
        PatientReviews: true,
      },
    });

    if (!doctor) {
      logger.error('Doctor not found', { doctorId });
      return responseService.notFoundError({
        message: "Doctor not found",
      });
    }

    const patientsTreated = await prisma.consultation.groupBy({
      by: ["patientId"],
      where: {
        doctorId: doctorId,
        status: AppointmentStatus.COMPLETED,
      },
    });

    return responseService.success({
      message: "Doctor fetched successfully",
      data: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email, 
        gender: doctor.gender,
        phone: doctor.phoneNumber,
        profilePicture: doctor.profilePicture,
        specialty: doctor.doctorProfile?.specialty,
        experience: doctor.doctorProfile?.experience,
        location: doctor.doctorProfile?.location,
        consultationTypes: doctor.doctorProfile?.consultationTypes,
        consultationFees: doctor.doctorProfile?.consultationFees,
        homeVisitCharge: doctor.doctorProfile?.homeVisitCharge,
        videoConsultationFee: doctor.doctorProfile?.videoConsultationFee,
        clinicConsultationFee: doctor.doctorProfile?.clinicConsultationFee,
        bio: doctor.doctorProfile?.bio,
        ratings: doctor.DoctorReviews.length ? doctor.DoctorReviews.reduce((acc, review) => acc + review.rating, 0) / doctor.DoctorReviews.length : 0,
        patientsTreated: patientsTreated.length,
        isAvailable: computeDoctorAvailability(doctor.doctorProfile!?.isOnline, doctor.doctorProfile!?.lastActive, 7), // Uses threshold of 7 days
      },
    });
  }

  static async getTopDoctors() {
    const ratings = await prisma.review.groupBy({
      by: ["doctorId"],
      _avg: { rating: true },
      orderBy: { _avg: { rating: "desc" } },
      take: 5,
    });

    const doctorIds = ratings.map(r => r.doctorId);

    const doctors = await prisma.doctorProfile.findMany({
      where: { id: { in: doctorIds } },
      include: {
        user: true,
        specialty: true,
      },
    });

    const doctorMap = Object.fromEntries(
      ratings.map(r => [r.doctorId, r._avg.rating])
    );
    const topDoctors = doctors.map(doctor => ({
      ...doctor,
      avgRating: doctorMap[doctor.id] || 0,
    }));

    return topDoctors;
  }

  static async getDoctorAvailability(doctorId: string): Promise<any> {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: doctorId },
      select: { availability: true }
    });

    if (!doctor) {
      throw new NotFoundException("Doctor not found", ErrorCode.NOTFOUND);
    }

    try {
      // return JSON.parse(doctor.availability as string) ;
    } catch {
      return [];
    }
  }

  // Utility function to get doctor's calendar details
  static async getDoctorCalendarDetails(doctorId: string) {
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      include: { doctorProfile: true }
    });

    if (!doctor || !doctor.doctorProfile!.googleRefreshToken || !doctor.doctorProfile!.googleCalendarId) {
      throw new NotFoundException('Doctor not found or Google Calendar not connected.', ErrorCode.NOTFOUND);
    }

    oauth2Client.setCredentials({
      refresh_token: doctor.doctorProfile!.googleRefreshToken,
    });

    return { calendarId: doctor.doctorProfile!.googleCalendarId, oauth2Client };
  }

  static async getGeneralPractitioners() {
    const doctors = await prisma.doctorProfile.findMany({
      where: {
        specialty: {
          name: "General Practitioner",
        },
      },
      include: {
        user: true,
        specialty: true,
      },
    });

    const transformedDoctors = doctors.map((doctor) => ({
      ...doctor,
      isAvailable: computeDoctorAvailability(doctor.isOnline, doctor.lastActive, 7), // Uses threshold of 7 days
    }));

    return responseService.success({
      message: "General practitioners fetched successfully",
      data: transformedDoctors,
    });

  }

  static async getSpecializations() {
    const specializations = await prisma.specialty.findMany({
      where: {
        name: {
          not: "General Practitioner",
        },
      },
      include: {
        DoctorProfile: true,
      },
    });

    return responseService.success({
      message: "Specializations fetched successfully",
      data: specializations,
    });
  }

  static async saveCertificationFiles(doctorId: string, fileUrls: { cv: string | null; medicalLicense: string | null; reference: string | null }) {
    return await prisma.doctorProfile.update({
      where: { userId: doctorId },
      data: {
        cv: fileUrls.cv,
        medicalLicense: fileUrls.medicalLicense,
        reference: fileUrls.reference,
      },
    });
  }

  static async getDoctorsBySpecialty(specialtyName: string) {

    if (!specialtyName) {
      return responseService.error({
        message: "Specialty name or ID is required",
      });
    }
    // Fetch doctors by specialty
    const doctors = await prisma.doctorProfile.findMany({
      where: {
        specialty: {
          OR: [
            { name: specialtyName },
            { id: specialtyName }
          ],
        },
      },
      include: {
        user: true,
        specialty: true,
      },
    });

    if (!doctors.length) {
      return responseService.notFoundError({
        message: `No doctors found for ${specialtyName}`,
        data: null,
      });
    }

    return responseService.success({
      message: "Doctors fetched successfully",
      data: doctors.map((doctor) => ({
        ...doctor,
        isAvailable: computeDoctorAvailability(doctor.isOnline, doctor.lastActive, 7), // Uses threshold of 7 days
      })),
    });
  }

  static async login(data: any) {
    const doctor = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true, password: true } });
    if (!doctor || !(await bcrypt.compare(data.password, doctor.password!))) {
      throw new Error("Invalid credentials");
    }
    return jwt.sign({ id: doctor.id, role: UserTypes.DOCTOR }, process.env.JWT_SECRET as string);
  }

  static async getDashboard(doctorId: string) {
    return {
      appointments: await prisma.consultation.findMany({ where: { doctorId } }),
      earnings: await prisma.payment.findMany({ where: { doctorId } }),
    };
  }

  static async getAppointments(doctorId: string, status: AppointmentStatus) {

    if (!status) {
      status = AppointmentStatus.CONFIRMED;
    }

    // Validate status
    const validStatuses = Object.values(AppointmentStatus);
    if (!validStatuses.includes(status.toLocaleUpperCase() as AppointmentStatus)) {
      throw new BadRequestException(`Invalid appointment status: ${status}`, ErrorCode.BADREQUEST);
    }

    // Ensure status is in uppercase
    status = status.toUpperCase() as AppointmentStatus;

    logger.info('Fetching appointments', { doctorId, status });
    return await prisma.consultation.findMany({
      where: { doctorId, status },
      orderBy: { startTime: "desc" },
    });
  }

  static async getAppointmentHistory(doctorId: string) {
    return await prisma.consultation.findMany({
      where: { doctorId, status: AppointmentStatus.COMPLETED },
      orderBy: { startTime: "desc" },
    });
  }


  static async rescheduleAppointment(appointmentId: string, doctorId: string, newDate: string) {
    return prisma.consultation.update({
      where: { id: appointmentId, doctorId },
      data: { startTime: newDate, status: AppointmentStatus.CONFIRMED },
    });
  }

  static async getChat(doctorId: string, patientId: string) {
    return prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: doctorId, receiverId: patientId },
          { senderId: patientId, receiverId: doctorId }
        ]
      },
    });
  }

  static async sendMessage(doctorId: string, patientId: string, content: string) {
    return prisma.chatMessage.create({ data: { senderId: doctorId, receiverId: patientId, content } });
  }

  // static async addMedicalNote(doctorId: string, appointmentId: string, noteData: any) {
  //   return prisma.medicalNote.create({ data: { ...noteData, doctorId, appointmentId } });
  // }

  static async getEarnings(doctorId: string) {
    const totalEarnings = await prisma.payment.aggregate({
      where: { doctorId, status: PaymentStatus.SUCCESSFUL },
      _sum: { amount: true },
    });

    const availableForWithdrawal = await prisma.payment.aggregate({
      where: { doctorId, status: PaymentStatus.SUCCESSFUL },
      _sum: { amount: true },
    });

    return {
      totalEarnings: totalEarnings._sum.amount || 0,
      availableForWithdrawal: availableForWithdrawal._sum.amount || 0,
    };
  }


  static async getPatientHistory(doctorId: string, patientId: string) {
    return prisma.consultation.findMany({
      where: { doctorId, patientId, status: AppointmentStatus.COMPLETED },
      // include: { medicalNotes: true },
      orderBy: { startTime: "desc" },
    });
  }

  static async referPatient(doctorId: string, patientId: string, specialistId: string, notes: string) {
    return prisma.referral.create({
      data: {
        referringDoctorId: doctorId,
        patientId,
        specialistId,
        notes,
        status: ReferralStatus.PENDING,
      },
    });
  }

  static async requestWithdrawal(doctorId: string, amount: number) {
    const earnings = await prisma.payment.aggregate({
      where: { doctorId, status: PaymentStatus.SUCCESSFUL },
      _sum: { amount: true },
    });

    const totalEarnings = earnings._sum.amount ?? 0;

    if (totalEarnings < amount) {
      throw new Error("Insufficient balance for withdrawal");
    }

    return prisma.withdrawal.create({
      data: { doctorId, amount, status: WithdrawalStatus.PENDING },
    });
  }

}
