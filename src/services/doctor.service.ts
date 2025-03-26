import { SessionType, Doctor, Prisma, AppointmentStatus, UserTypes } from "@prisma/client";
import { prisma } from "../prisma/prisma";
import { NotFoundException } from "../exception/not-found";
import { ErrorCode } from "../exception/base";
import { google } from "googleapis";
import { googleConfig, oauth2Client } from "../utils/oauthUtils";
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
    return await prisma.doctor.findMany();
  }

  static async getDoctorById(doctorId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        specialty: true,
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

  static async createDoctors(data: DoctorProfile) {
    const {
      name,
      email,
      experience,
      location,
      consultationTypes,
      consultationFees,
      homeVisitCharge,
      videoConsultationFee,
      clinicConsultationFee,
      ratings,
      bio,
      specialtyId,
    } = data;

    const existingDoctor = await prisma.doctor.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (existingDoctor) {
      throw new Error('Doctor with this email already exists');
    }

    const newDoctor = await prisma.doctor.create({
      data: {
        name,
        email,
        consultationTypes,
        location,
        consultationFees,
        homeVisitCharge,
        videoConsultationFee,
        clinicConsultationFee,
        experience,
        ratings,
        bio,
        specialtyId,
      },
    });

    return newDoctor;
  }

  static async getTopDoctors() {
    const doctors = await prisma.doctor.findMany({
      orderBy: { ratings: "desc" },
      take: 5,
    });

    return doctors;
  }

  static async findDoctors(filters: FilterDoctor): Promise<Doctor[]> {
    return prisma.doctor.findMany({
      where: {
        specialtyId: filters.specialization,
        ratings: { gte: filters.minRating },
        location: { contains: filters.location },
        consultationTypes: { has: filters.consultationType },
      },
    });
  }

  static async getDoctorAvailability(
    doctorId: string
  ): Promise<any> {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
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
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || !doctor.googleRefreshToken || !doctor.googleCalendarId) {
      throw new Error('Doctor not found or Google Calendar not connected.');
    }

    oauth2Client.setCredentials({
      refresh_token: doctor.googleRefreshToken,
    });

    return { calendarId: doctor.googleCalendarId, oauth2Client };
  }

  static async getGeneralPractitioners() {
    return await prisma.doctor.findMany({
      where: {
        specialty: {
          name: "General Practitioner",
        },
      },
      include: {
        specialty: true, // Include specialty details if needed
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
        doctors: true,
      },
    });
  }

}
