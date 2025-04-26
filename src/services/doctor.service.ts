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
import { checkIfUserExists } from "../utils/checkIfUserExists";
import { transformUserRoles } from "../utils/role.utils";

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
    const existingUser = checkIfUserExists(doctorId);
    if (!existingUser) {
      return responseService.notFoundError({
        message: "User not found",
      });
    }                             

    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      include: {
        doctorProfile: {
          include: {
            specialty: true,
          },
        },
        roles: {
          include: {
            role: true,
          }
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
        homeVisitCharge: doctor.doctorProfile?.homeVisitFee,
        clinicConsultationFee: doctor.doctorProfile?.clinicConsultationFee,
        bio: doctor.doctorProfile?.bio,
        roles: transformUserRoles(doctor.roles),
        ratings: doctor.DoctorReviews.length ? doctor.DoctorReviews.reduce((acc, review) => acc + review.rating, 0) / doctor.DoctorReviews.length : 0,
        patientsTreated: patientsTreated.length,
        isAvailable: computeDoctorAvailability(doctor.isOnline, doctor.doctorProfile!?.lastActive, 7), // Uses threshold of 7 days
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
      throw new NotFoundException("Doctor not found");
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
      throw new NotFoundException('Doctor not found or Google Calendar not connected.');
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
      isAvailable: computeDoctorAvailability(doctor.user.isOnline, doctor.lastActive, 7), // Uses threshold of 7 days
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
      });
    }

    return responseService.success({
      message: "Doctors fetched successfully",
      data: doctors.map((doctor) => ({
        ...doctor,
        isAvailable: computeDoctorAvailability(doctor.user.isOnline, doctor.lastActive, 7), // Uses threshold of 7 days
      })),
    });
  }

  static async getAppointments(doctorId: string, status: AppointmentStatus) {

    if (!status) {
      status = AppointmentStatus.UPCOMING;
    }

    // Validate status
    const validStatuses = Object.values(AppointmentStatus);
    if (!validStatuses.includes(status.toLocaleUpperCase() as AppointmentStatus)) {
      throw new BadRequestException(`Invalid appointment status: ${status}`);
    }

    // Ensure status is in uppercase
    status = status.toUpperCase() as AppointmentStatus;

    logger.info('Fetching appointments', { doctorId, status });
    return await prisma.consultation.findMany({
      where: { doctorId, status },
      orderBy: { startTime: "desc" },
    });
  }

  // static async getUpcomingConsultations(doctorId: string) {

  //   const userExists = await checkIfUserExists(doctorId);
  //   if (!userExists) {
  //     return responseService.notFoundError({
  //       message: "Doctor not found",
  //     })
  //   }

  //   const consultation = await prisma.consultation.findMany({
  //     where: {
  //       doctorId: doctorId,
  //       status: AppointmentStatus.UPCOMING
  //     },
  //     orderBy: {
  //       startTime: 'asc'
  //     },
  //     include: {
  //       patient: true,
  //       doctor: true,
  //     },
  //   });

  //   return responseService.success({
  //     message: "Upcoming consultations fetched successfully",
  //     data: consultation
  //   });
  // }

  static async getAppointmentHistory(doctorId: string) {
    return await prisma.consultation.findMany({
      where: { doctorId, status: AppointmentStatus.COMPLETED },
      orderBy: { startTime: "desc" },
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

  static async getBalance(doctorId: string) {
    const totalBalance = await prisma.payment.aggregate({
      where: { doctorId, status: PaymentStatus.SUCCESSFUL },
      _sum: { amount: true },
    });

    // const availableForWithdrawal = await prisma.payment.aggregate({
    //   where: { doctorId, status: PaymentStatus.SUCCESSFUL },
    //   _sum: { amount: true },
    // });

    return responseService.success({
      message: "Balance fetched successfully",
      data: {
        totalBalance: totalBalance._sum.amount || 0,
        // availableForWithdrawal: availableForWithdrawal._sum.amount || 0,
      },
    });
  }

  static async getPatientHistory(doctorId: string, patientId: string) {
    return prisma.consultation.findMany({
      where: { doctorId, patientId, status: AppointmentStatus.COMPLETED },
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
