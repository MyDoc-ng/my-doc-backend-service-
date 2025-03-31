import { SessionType, AppointmentStatus, UserTypes, User } from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { NotFoundException } from "../exception/not-found";
import { ErrorCode } from "../exception/base";
import { oauth2Client } from "../utils/oauthUtils";
import logger from "../logger";

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
    return await prisma.user.findMany({ where: { role: UserTypes.DOCTOR } });
  }

  static async getDoctorById(doctorId: string) {
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      include: {
        doctorProfile: true,
      },
    });

    if (!doctor) {
      logger.error('Doctor not found', { doctorId });
      throw new NotFoundException('Doctor not found', ErrorCode.NOTFOUND);
    }

    const patientsTreated = await prisma.consultation.groupBy({
      by: ["patientId"],
      where: {
        doctorId: doctorId,
        status: AppointmentStatus.COMPLETED,
      },
    });

    return {
      ...doctor,
      patientsTreated: patientsTreated.length,
    }
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
      avgRating: doctorMap[doctor.id] || 0, // Default to 0 if no rating
    }));
  
    return topDoctors;
  }
  

  // static async findDoctors(filters: FilterDoctor): Promise<User[]> {
  //   return prisma.doctorProfile.findMany({
  //     where: {
  //       specialtyId: filters.specialization,
  //       // ratings: { gte: filters.minRating },
  //       location: { contains: filters.location },
  //       consultationTypes: { has: filters.consultationType },
  //     },
  //   });
  // }

  static async getDoctorAvailability(
    doctorId: string
  ): Promise<any> {
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
      throw new Error('Doctor not found or Google Calendar not connected.');
    }

    oauth2Client.setCredentials({
      refresh_token: doctor.doctorProfile!.googleRefreshToken,
    });

    return { calendarId: doctor.doctorProfile!.googleCalendarId, oauth2Client };
  }

  static async getGeneralPractitioners() {
    return await prisma.doctorProfile.findMany({
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
  }

  static async getSpecializations() {
    return await prisma.specialty.findMany({
      where: {
        name: {
          not: "General Practitioner",
        },
      },
      include: {
        DoctorProfile: true,
      },
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
}
